'use client';

import { Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

import { ChatHeader } from '@/components/custom/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';
import type { Prompt } from '@/ai/prompts';
import type { AISettings, User } from '@/lib/supabase/types';

import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { UserInfoModal } from './user-info-modal';
import { VehicleInfoForm } from './vehicle-info-form';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
}) {
  const { data: systemPrompt } = useSWR<Prompt>('/api/prompt', fetcher);
  const { data: userProfile } = useSWR<User>('/api/user-profile', fetcher);
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

  const handleVehicleSubmit = async (data: {
    brand: string;
    model: string;
    year: string;
  }) => {
    setVehicleInfo(data);

    // Crear el chat con el título del vehículo
    try {
      const title = `${data.year} ${data.brand} ${data.model}`;

      // Creamos/actualizamos el chat con el título
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          title,
        }),
      });
    } catch (error) {
      console.error('Error creating chat:', error);
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
            !vehicleInfo && <VehicleInfoForm onSubmit={handleVehicleSubmit} />}

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
