import { convertToCoreMessages, CoreMessage, streamText } from 'ai';
import { TextEncoder } from 'util';

import { customModel } from '@/ai';
import { models } from '@/ai/models';
import { getChatById } from '@/db/cached-queries';
import { saveMessages, deleteChatById } from '@/db/mutations';
import { createClient } from '@/lib/supabase/server';
import { MessageRole } from '@/lib/supabase/types';
import { generateUUID, getMostRecentUserMessage } from '@/lib/utils';

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
    const {
      id,
      messages,
      modelId,
      systemPrompt,
      userProfile,
      title,
      vehicleInfo,
    } = body;

    if (!id) {
      console.error('Missing chat ID');
      return new Response('Missing required fields', { status: 400 });
    }

    const user = await getUser();

    // Get or create chat
    const chat = await getChatById(id);

    try {
      if (!chat) {
        const chatTitle = vehicleInfo
          ? `${vehicleInfo.year} ${vehicleInfo.brand} ${vehicleInfo.model}`
          : title ||
            (await generateTitleFromUserMessage({
              message: messages?.[messages.length - 1],
            }));

        // Crear el chat con la información del vehículo
        const supabase = await createClient();
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .upsert(
            {
              id,
              title: chatTitle,
              user_id: user.id,
              vehicle_brand: vehicleInfo?.brand || null,
              vehicle_model: vehicleInfo?.model || null,
              vehicle_year: vehicleInfo?.year || null,
            },
            {
              onConflict: 'id',
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (createError) {
          console.error('Error creating chat:', createError);
          return new Response(
            JSON.stringify({
              error: 'Error creating chat',
              details: createError,
            }),
            {
              status: 500,
            }
          );
        }

        console.log('Chat created successfully:', newChat);
      } else if (chat.user_id !== user.id) {
        return new Response('Unauthorized', { status: 401 });
      } else if (title || vehicleInfo) {
        // Si el chat existe y se proporciona un título o información del vehículo, actualizarlo
        const supabase = await createClient();
        const updatedTitle = vehicleInfo
          ? `${vehicleInfo.year} ${vehicleInfo.brand} ${vehicleInfo.model}`
          : title || chat.title;

        const { error: updateError } = await supabase
          .from('chats')
          .update({
            title: updatedTitle,
            vehicle_brand: vehicleInfo?.brand || chat.vehicle_brand,
            vehicle_model: vehicleInfo?.model || chat.vehicle_model,
            vehicle_year: vehicleInfo?.year || chat.vehicle_year,
          })
          .eq('id', id);

        if (updateError) {
          console.error('Error updating chat:', updateError);
          return new Response(
            JSON.stringify({
              error: 'Error updating chat',
              details: updateError,
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
    } catch (error) {
      console.error('Database operation error:', error);
      return new Response(
        JSON.stringify({ error: 'Database operation failed', details: error }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Si solo estamos creando/actualizando el chat (sin mensajes), retornamos aquí
    if (!messages || !modelId) {
      return new Response(
        JSON.stringify({ message: 'Chat created/updated successfully' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
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
  vehicleInfo
    ? `VEHICLE INFORMATION:
- Brand: ${vehicleInfo.brand}
- Model: ${vehicleInfo.model}
- Year: ${vehicleInfo.year}`
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
