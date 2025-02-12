'use client';

import { Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

import { ChatHeader } from '@/components/custom/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { Database } from '@/lib/supabase/types';
import { fetcher, generateUUID } from '@/lib/utils';
import type { Prompt } from '@/ai/prompts';
import type { AISettings, User, Chat as ChatType } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { UserInfoModal } from './user-info-modal';
import { VehicleInfoForm } from './vehicle-info-form';

export function Chat({
  id: initialId,
  initialMessages,
  selectedModelId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
}) {
  const [id, setId] = useState(initialId);
  const { data: systemPrompt } = useSWR<Prompt>('/api/prompt', fetcher);
  const { data: userProfile } = useSWR<User>('/api/user-profile', fetcher);
  const { data: chat } = useSWR<ChatType>(`/api/chat/${id}`, fetcher);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<{
    brand: string;
    model: string;
    year: string;
  } | null>(null);

  const { messages, input, setInput, handleSubmit, isLoading, stop } = useChat({
    api: '/api/chat',
    id,
    body: {
      id,
      modelId: selectedModelId,
      systemPrompt: systemPrompt?.content,
      userProfile: {
        nombre: userProfile?.nombre,
        telefono: userProfile?.telefono,
        ubicacion: userProfile?.ubicacion,
      },
      vehicleInfo,
    },
    initialMessages,
    streamProtocol: 'text',
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Verificar si el usuario tiene la información necesaria
  useEffect(() => {
    if (
      userProfile === null ||
      (userProfile &&
        (!userProfile.nombre ||
          !userProfile.telefono ||
          !userProfile.ubicacion))
    ) {
      setShowUserInfoModal(true);
    }
  }, [userProfile]);

  // Cargar la información del vehículo cuando el chat se carga
  useEffect(() => {
    if (chat?.title) {
      const parts = chat.title.split(' ');
      if (parts.length >= 3) {
        setVehicleInfo({
          year: parts[0],
          brand: parts[1],
          model: parts.slice(2).join(' '),
        });
      }
    }
  }, [chat]);

  const handleVehicleSubmit = async (data: {
    brand: string;
    model: string;
    year: string;
  }) => {
    try {
      if (!userProfile?.id) {
        console.error('User profile not found');
        return;
      }

      const newId = generateUUID();
      setId(newId);
      setVehicleInfo(data);
      const title = `${data.year} ${data.brand} ${data.model}`;

      console.log('Sending chat creation request:', {
        id: newId,
        title,
        vehicleInfo: data,
      });

      // Crear/actualizar el chat usando el endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newId,
          title,
          vehicleInfo: data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Error response from server:', responseData);
        throw new Error(responseData.error || 'Failed to save chat');
      }

      console.log('Chat saved successfully:', responseData);

      // Redirigir al nuevo chat
      window.history.pushState({}, '', `/chat/${newId}`);
    } catch (error) {
      console.error('Error saving chat:', error);
      setVehicleInfo(null); // Revertir el estado si hay un error
      setId(initialId); // Revertir el ID si hay un error
    }
  };

  return (
    <>
      <div className="flex h-dvh min-w-0 flex-col bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pt-4"
        >
          {messages.length === 0 &&
            initialMessages.length === 0 &&
            !vehicleInfo &&
            !chat?.title && <VehicleInfoForm onSubmit={handleVehicleSubmit} />}

          {messages.length === 0 &&
            initialMessages.length === 0 &&
            vehicleInfo && <Overview vehicleInfo={vehicleInfo} />}

          {initialMessages.length > 0 && messages.length === 0 && (
            <div className="space-y-4">
              {initialMessages.map((message, index) => (
                <PreviewMessage
                  key={message.id}
                  chatId={id}
                  message={message}
                  isLoading={false}
                />
              ))}
            </div>
          )}

          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              message={message}
              isLoading={isLoading && index === messages.length - 1}
            />
          ))}

          {isLoading &&
            (!messages.length ||
              messages[messages.length - 1].role !== 'assistant') && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="min-h-[24px] min-w-[24px] shrink-0"
          />
        </div>
        <div className="mx-auto w-full bg-background px-4 pb-4 md:max-w-3xl md:pb-6">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            disabled={
              !userProfile ||
              !userProfile.nombre ||
              !userProfile.telefono ||
              !userProfile.ubicacion ||
              !vehicleInfo
            }
          />
        </div>
      </div>

      <UserInfoModal
        isOpen={showUserInfoModal}
        onOpenChange={setShowUserInfoModal}
      />
    </>
  );
}
