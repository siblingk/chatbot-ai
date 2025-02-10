import {
  convertToCoreMessages,
  CoreMessage,
  Message,
  StreamData,
  streamObject,
  streamText,
  StreamingTextResponse,
  OpenAIStream,
} from 'ai';
import { z } from 'zod';
import OpenAI from 'openai';
import { type ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { createPrompts } from '@/ai/prompts';
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

const requestSchema = z.object({
  id: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      role: z.enum(['user', 'assistant', 'system', 'tool']),
    })
  ),
  modelId: z.string(),
  prompts: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      console.error('Invalid request body:', result.error);
      return new Response('Invalid request body', { status: 400 });
    }

    const { id, messages, modelId, prompts } = result.data;

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

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const chatMessages = coreMessages
        .filter((msg) => msg.role !== 'tool')
        .map((msg) => ({
          role: msg.role,
          content: msg.content.toString().trim(),
        }));

      if (prompts) {
        chatMessages.unshift({
          role: 'system',
          content: prompts,
        });
      }

      const completion = await openai.chat.completions.create({
        model: model.apiIdentifier,
        messages: chatMessages,
        stream: true,
      });

      return new StreamingTextResponse(
        new ReadableStream({
          async start(controller) {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          },
        })
      );
    } catch (error) {
      console.error('Error in chat processing:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return new Response('Internal Server Error', { status: 500 });
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
