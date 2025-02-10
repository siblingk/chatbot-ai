import {
  convertToCoreMessages,
  CoreMessage,
  Message,
  StreamData,
  streamObject,
  streamText,
} from 'ai';
import { z } from 'zod';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { blocksPrompt, regularPrompt, systemPrompt } from '@/ai/prompts';
import { getChatById, getDocumentById, getSession } from '@/db/cached-queries';
import {
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
  deleteChatById,
} from '@/db/mutations';
import { createClient } from '@/lib/supabase/server';
import { MessageRole } from '@/lib/supabase/types';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];

const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

// Add helper function to format message content for database storage
function formatMessageContent(message: CoreMessage): string {
  // Para mensajes del usuario
  if (message.role === 'user') {
    const content = message.content;
    // Si es un objeto o array, convertirlo a string
    if (typeof content === 'object' && content !== null) {
      return typeof content.text === 'string'
        ? content.text
        : JSON.stringify(content);
    }
    // Si es string o cualquier otro tipo, convertirlo a string
    return String(content);
  }

  // Para mensajes de herramientas
  if (message.role === 'tool') {
    return message.content
      .map(
        (content) => `${content.toolName}: ${JSON.stringify(content.result)}`
      )
      .join('\n');
  }

  // Para mensajes del asistente
  if (message.role === 'assistant') {
    const content = message.content;
    // Si ya es string, retornarlo directamente
    if (typeof content === 'string') {
      return content;
    }
    // Si es array, concatenar los textos
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if ('text' in item) return item.text;
          if ('toolCallId' in item) return `[${item.toolName}]`;
          return JSON.stringify(item);
        })
        .join('\n');
    }
    // Si es objeto, convertirlo a string
    return JSON.stringify(content);
  }

  // Para cualquier otro caso
  return String(message.content);
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    });

    const { id, messages, modelId } = body;

    // Validate required fields
    if (!id || !messages || !modelId) {
      console.error('Missing required fields:', { id, messages, modelId });
      return new Response('Missing required fields', { status: 400 });
    }

    // Get user with error handling
    let user;
    try {
      user = await getUser();
    } catch (error) {
      console.error('Error getting user:', error);
      return new Response('Unauthorized', { status: 401 });
    }

    // Validate model
    const model = models.find((m) => m.id === modelId);
    if (!model) {
      console.error('Model not found:', modelId);
      return new Response('Model not found', { status: 404 });
    }

    // Convert and validate messages
    const coreMessages = convertToCoreMessages(messages);
    const userMessage = getMostRecentUserMessage(coreMessages);

    if (!userMessage) {
      console.error('No user message found in:', messages);
      return new Response('No user message found', { status: 400 });
    }

    try {
      // Get or create chat
      const chat = await getChatById(id);

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });
        await saveChat({ id, userId: user.id, title });
      } else if (chat.user_id !== user.id) {
        console.error('User not authorized for chat:', {
          chatId: id,
          userId: user.id,
        });
        return new Response('Unauthorized', { status: 401 });
      }

      // Save message with error handling
      try {
        const formattedMessage = {
          id: generateUUID(),
          chat_id: id,
          role: userMessage.role as MessageRole,
          content: formatMessageContent(userMessage),
          created_at: new Date().toISOString(),
        };

        console.log('Saving message:', formattedMessage);

        await saveMessages({
          chatId: id,
          messages: [formattedMessage],
        });
      } catch (error) {
        console.error('Error saving message:', error);
        throw error;
      }

      const streamingData = new StreamData();

      const result = await streamText({
        model: customModel(model.apiIdentifier),
        system: systemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        experimental_activeTools: allTools,
        tools: {
          getWeather: {
            description: 'Get the current weather at a location',
            parameters: z.object({
              latitude: z.number(),
              longitude: z.number(),
            }),
            execute: async ({ latitude, longitude }) => {
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
              );

              const weatherData = await response.json();
              return weatherData;
            },
          },
          createDocument: {
            description: 'Create a document for a writing activity',
            parameters: z.object({
              title: z.string(),
            }),
            execute: async ({ title }) => {
              const id = generateUUID();
              let draftText: string = '';

              // Stream UI updates immediately for better UX
              streamingData.append({ type: 'id', content: id });
              streamingData.append({ type: 'title', content: title });
              streamingData.append({ type: 'clear', content: '' });

              // Generate content
              const { fullStream } = await streamText({
                model: customModel(model.apiIdentifier),
                system:
                  'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
                prompt: title,
              });

              for await (const delta of fullStream) {
                const { type } = delta;

                if (type === 'text-delta') {
                  draftText += delta.textDelta;
                  // Stream content updates in real-time
                  streamingData.append({
                    type: 'text-delta',
                    content: delta.textDelta,
                  });
                }
              }

              // Try to save with retries
              // let attempts = 0;
              // const maxAttempts = 3;
              // let savedId: string | null = null;

              // while (attempts < maxAttempts && !savedId) {
              //   try {
              //     await saveDocument({
              //       id,
              //       title,
              //       content: draftText,
              //       userId: user.id,
              //     });
              //     savedId = id;
              //     break;
              //   } catch (error) {
              //     attempts++;
              //     if (attempts === maxAttempts) {
              //       // If original ID fails, try with a new ID
              //       const newId = generateUUID();
              //       try {
              //         await saveDocument({
              //           id: newId,
              //           title,
              //           content: draftText,
              //           userId: user.id,
              //         });
              //         // Update the ID in the UI
              //         streamingData.append({ type: 'id', content: newId });
              //         savedId = newId;
              //       } catch (finalError) {
              //         console.error('Final attempt failed:', finalError);
              //         return {
              //           error:
              //             'Failed to create document after multiple attempts',
              //         };
              //       }
              //     }
              //     await new Promise((resolve) =>
              //       setTimeout(resolve, 100 * attempts)
              //     );
              //   }
              // }

              streamingData.append({ type: 'finish', content: '' });

              if (user && user.id) {
                await saveDocument({
                  id,
                  title,
                  content: draftText,
                  userId: user.id,
                });
              }

              return {
                id,
                title,
                content: `A document was created and is now visible to the user.`,
              };
            },
          },
          updateDocument: {
            description: 'Update a document with the given description',
            parameters: z.object({
              id: z.string().describe('The ID of the document to update'),
              description: z
                .string()
                .describe('The description of changes that need to be made'),
            }),
            execute: async ({ id, description }) => {
              const document = await getDocumentById(id);

              if (!document) {
                return {
                  error: 'Document not found',
                };
              }

              const { content: currentContent } = document;
              let draftText: string = '';

              streamingData.append({
                type: 'clear',
                content: document.title,
              });

              const { fullStream } = await streamText({
                model: customModel(model.apiIdentifier),
                system:
                  'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
                experimental_providerMetadata: {
                  openai: {
                    prediction: {
                      type: 'content',
                      content: currentContent,
                    },
                  },
                },
                messages: [
                  {
                    role: 'user',
                    content: description,
                  },
                  { role: 'user', content: currentContent },
                ],
              });

              for await (const delta of fullStream) {
                const { type } = delta;

                if (type === 'text-delta') {
                  const { textDelta } = delta;

                  draftText += textDelta;
                  streamingData.append({
                    type: 'text-delta',
                    content: textDelta,
                  });
                }
              }

              streamingData.append({ type: 'finish', content: '' });

              if (user && user.id) {
                await saveDocument({
                  id,
                  title: document.title,
                  content: draftText,
                  userId: user.id,
                });
              }

              return {
                id,
                title: document.title,
                content: 'The document has been updated successfully.',
              };
            },
          },
          requestSuggestions: {
            description: 'Request suggestions for a document',
            parameters: z.object({
              documentId: z
                .string()
                .describe('The ID of the document to request edits'),
            }),
            execute: async ({ documentId }) => {
              const document = await getDocumentById(documentId);

              if (!document || !document.content) {
                return {
                  error: 'Document not found',
                };
              }

              let suggestions: Array<{
                originalText: string;
                suggestedText: string;
                description: string;
                id: string;
                documentId: string;
                isResolved: boolean;
              }> = [];

              const { elementStream } = await streamObject({
                model: customModel(model.apiIdentifier),
                system:
                  'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
                prompt: document.content,
                output: 'array',
                schema: z.object({
                  originalSentence: z
                    .string()
                    .describe('The original sentence'),
                  suggestedSentence: z
                    .string()
                    .describe('The suggested sentence'),
                  description: z
                    .string()
                    .describe('The description of the suggestion'),
                }),
              });

              for await (const element of elementStream) {
                const suggestion = {
                  originalText: element.originalSentence,
                  suggestedText: element.suggestedSentence,
                  description: element.description,
                  id: generateUUID(),
                  documentId: documentId,
                  isResolved: false,
                };

                streamingData.append({
                  type: 'suggestion',
                  content: suggestion,
                });

                suggestions.push(suggestion);
              }

              if (user && user.id) {
                const userId = user.id;

                await saveSuggestions({
                  suggestions: suggestions.map((suggestion) => ({
                    ...suggestion,
                    userId,
                    createdAt: new Date(),
                    documentCreatedAt: document.created_at,
                  })),
                });
              }

              // if (user && user.id) {
              //   for (const suggestion of suggestions) {
              //     await saveSuggestions({
              //       documentId: suggestion.documentId,
              //       documentCreatedAt: document.created_at,
              //       originalText: suggestion.originalText,
              //       suggestedText: suggestion.suggestedText,
              //       description: suggestion.description,
              //       userId: user.id,
              //     });
              //   }
              // }

              return {
                id: documentId,
                title: document.title,
                message: 'Suggestions have been added to the document',
              };
            },
          },
        },
        onFinish: async ({ responseMessages }: any) => {
          if (user && user.id) {
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
              try {
                const responseMessagesWithoutIncompleteToolCalls =
                  sanitizeResponseMessages(responseMessages);

                await saveMessages({
                  chatId: id,
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      const messageId = generateUUID();

                      if (message.role === 'assistant') {
                        streamingData.appendMessageAnnotation({
                          messageIdFromServer: messageId,
                        });
                      }

                      return {
                        id: messageId,
                        chat_id: id,
                        role: message.role as MessageRole,
                        content: formatMessageContent(message),
                        created_at: new Date().toISOString(),
                      };
                    }
                  ),
                });
                break; // If successful, exit the retry loop
              } catch (error) {
                console.error(
                  `Failed to save chat (attempt ${retryCount + 1}):`,
                  error
                );
                retryCount++;
                if (retryCount === maxRetries) {
                  console.error('Failed to save chat after maximum retries');
                } else {
                  // Wait before retrying, with exponential backoff
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * Math.pow(2, retryCount))
                  );
                }
              }
            }
          }

          streamingData.close();
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      return result.toDataStreamResponse({
        data: streamingData,
      });
    } catch (error) {
      console.error('Error in chat flow:', error);
      if (
        error instanceof Error &&
        error.message === 'Chat ID already exists'
      ) {
        // Handle duplicate chat ID
        await saveMessages({
          chatId: id,
          messages: [
            {
              id: generateUUID(),
              chat_id: id,
              role: userMessage.role as MessageRole,
              content: formatMessageContent(userMessage),
              created_at: new Date().toISOString(),
            },
          ],
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Unhandled error in chat endpoint:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const user = await getUser();

  try {
    const chat = await getChatById(id);

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.user_id !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById(id, user.id);

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
