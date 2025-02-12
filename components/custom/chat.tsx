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

  return (
    <>
      <div className="flex h-dvh min-w-0 flex-col bg-background">
        <ChatHeader selectedModelId={selectedModelId} />
        <div
          ref={messagesContainerRef}
          className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-scroll pt-4"
        >
          {messages.length === 0 && <Overview />}

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
              !userProfile.ubicacion
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
