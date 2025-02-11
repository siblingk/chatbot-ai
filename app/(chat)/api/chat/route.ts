import { convertToCoreMessages, CoreMessage, StreamData, streamText } from 'ai';
import { z } from 'zod';
import { TextEncoder } from 'util';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { getChatById, getDocumentById } from '@/db/cached-queries';
import {
  saveChat,
  saveDocument,
  saveMessages,
  saveSuggestions,
  deleteChatById,
} from '@/db/mutations';
import { createClient } from '@/lib/supabase/server';
import { MessageRole } from '@/lib/supabase/types';
import { generateUUID, getMostRecentUserMessage } from '@/lib/utils';
import type { ChatTools } from '../types';

import { generateTitleFromUserMessage } from '../../actions';

export const maxDuration = 60;

// Obtener el usuario actual
async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user');
  }

  return user;
}

// Formatear el contenido del mensaje
function formatMessageContent(message: CoreMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  return JSON.stringify(message.content);
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    });

    const { id, messages, modelId, systemPrompt } = body;

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

      // Obtener el prompt del sistema si no se proporciona uno
      let finalSystemPrompt = systemPrompt;
      if (!finalSystemPrompt) {
        try {
          const supabase = await createClient();
          const { data: defaultPrompt } = await supabase
            .from('prompts')
            .select('content')
            .is('user_id', null)
            .eq('is_default', true)
            .single();

          if (defaultPrompt) {
            finalSystemPrompt = defaultPrompt.content;
          }
        } catch (error) {
          console.error('Error getting system prompt:', error);
          // Usar el prompt por defecto si hay error
          finalSystemPrompt = systemPrompt;
        }
      }

      const result = await streamText<ChatTools>({
        model: customModel(model.apiIdentifier),
        system: finalSystemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        experimental_activeTools: [
          'createDocument',
          'updateDocument',
          'requestSuggestions',
        ],
        tools: {
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

              // Cerrar el stream de datos
              streamingData.close();

              // Save document
              await saveDocument({
                id,
                userId: user.id,
                title,
                content: draftText,
              });

              return {
                id,
                title,
                content: draftText,
              };
            },
          },
          updateDocument: {
            description: 'Update an existing document',
            parameters: z.object({
              id: z.string(),
              content: z.string(),
            }),
            execute: async ({ id, content }) => {
              // Get document
              const document = await getDocumentById(id);

              if (!document) {
                throw new Error('Document not found');
              }

              // Save document
              await saveDocument({
                id,
                userId: user.id,
                title: document.title,
                content,
              });

              return {
                id,
                title: document.title,
                content,
              };
            },
          },
          requestSuggestions: {
            description: 'Request suggestions for a document',
            parameters: z.object({
              documentId: z.string(),
              originalText: z.string(),
              suggestedText: z.string(),
              description: z.string(),
            }),
            execute: async ({
              documentId,
              originalText,
              suggestedText,
              description,
            }) => {
              // Get document
              const document = await getDocumentById(documentId);

              if (!document) {
                throw new Error('Document not found');
              }

              // Save suggestion
              const suggestion = {
                id: generateUUID(),
                userId: user.id,
                documentId,
                documentCreatedAt: document.created_at,
                originalText,
                suggestedText,
                description,
                isResolved: false,
              };

              await saveSuggestions([suggestion]);

              return suggestion;
            },
          },
        },
      });

      // Guardar el mensaje cuando termine el stream
      result.text
        .then(async (fullText) => {
          if (fullText.trim()) {
            const assistantMessage = {
              id: generateUUID(),
              chat_id: id,
              role: 'assistant' as MessageRole,
              content: fullText,
              created_at: new Date().toISOString(),
            };

            await saveMessages({
              chatId: id,
              messages: [assistantMessage],
            });
          }

          // Cerrar el stream después de guardar el mensaje
          streamingData.close();
        })
        .catch((error) => {
          console.error('Error processing stream:', error);
          streamingData.close();
        });

      // Retornar el stream de texto directamente
      return result.toTextStreamResponse();
    } catch (error) {
      console.error('Error in chat processing:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
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
