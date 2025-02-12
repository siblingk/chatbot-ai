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
    const body = await request.json();
    const { id, messages, modelId, systemPrompt, userProfile, title } = body;

    if (!id) {
      return new Response('Missing required fields', { status: 400 });
    }

    const user = await getUser();

    // Get or create chat
    const chat = await getChatById(id);
    if (!chat) {
      const chatTitle =
        title ||
        (await generateTitleFromUserMessage({
          message: messages?.[messages.length - 1],
        }));
      await saveChat({ id, userId: user.id, title: chatTitle });
    } else if (chat.user_id !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Si solo estamos creando el chat (sin mensajes), retornamos aquí
    if (!messages || !modelId) {
      return new Response('Chat created successfully', { status: 200 });
    }

    const model = models.find((m) => m.id === modelId);

    if (!model) {
      return new Response('Model not found', { status: 404 });
    }

    const coreMessages = convertToCoreMessages(messages);
    const userMessage = getMostRecentUserMessage(coreMessages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Save user message
    const formattedUserMessage = {
      id: generateUUID(),
      chat_id: id,
      role: userMessage.role as MessageRole,
      content: formatMessageContent(userMessage),
      created_at: new Date().toISOString(),
    };

    await saveMessages({
      chatId: id,
      messages: [formattedUserMessage],
    });

    // Construir el prompt del sistema con la información del usuario y vehículo
    let finalSystemPrompt = systemPrompt || '';
    if (userProfile?.nombre) {
      finalSystemPrompt = `${finalSystemPrompt}

USER INFORMATION:
- Name: ${userProfile.nombre}
${userProfile.ubicacion ? `- Location: ${userProfile.ubicacion}` : ''}
${userProfile.telefono ? `- Phone: ends in ${userProfile.telefono.slice(-2)}` : ''}

${
  body.vehicleInfo
    ? `VEHICLE INFORMATION:
- Brand: ${body.vehicleInfo.brand}
- Model: ${body.vehicleInfo.model}
- Year: ${body.vehicleInfo.year}`
    : ''
}

Use this information to personalize your responses and refer to the user by name.
When mentioning the vehicle, use its complete information (brand, model, and year).`;
    }

    const responseMessageId = generateUUID();
    let fullContent = '';

    const result = await streamText({
      model: customModel(model.apiIdentifier),
      messages: coreMessages,
      system: finalSystemPrompt,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.fullStream) {
            if (chunk.type === 'text-delta') {
              fullContent += chunk.textDelta;
              controller.enqueue(encoder.encode(chunk.textDelta));
            }
          }

          // Save complete message
          const formattedResponseMessage = {
            id: responseMessageId,
            chat_id: id,
            role: 'assistant' as MessageRole,
            content: fullContent,
            created_at: new Date().toISOString(),
          };

          await saveMessages({
            chatId: id,
            messages: [formattedResponseMessage],
          });

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
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
