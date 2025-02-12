'use client';
import { Message } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import { Dispatch, SetStateAction } from 'react';

import { Vote } from '@/lib/supabase/types';

import { UIBlock } from './block';

import { SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';

export interface PreviewMessageProps {
  chatId: string;
  message: Message;
  isLoading: boolean;
  vote?: Vote;
}

export function PreviewMessage({
  chatId,
  message,
  isLoading = false,
  vote,
}: PreviewMessageProps) {
  return (
    <motion.div
      className="group/message mx-auto w-full max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cx(
          'group-data-[role=user]/message:bg-gray-100 dark:group-data-[role=user]/message:bg-zinc-900 group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl'
        )}
      >
        {message.role === 'assistant' && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}
        <div className="min-w-0 py-2">
          <div className="prose max-w-none dark:prose-invert">
            {typeof message.content === 'string' ? (
              <Markdown>{message.content}</Markdown>
            ) : (
              <pre>{JSON.stringify(message.content, null, 2)}</pre>
            )}
          </div>
          <MessageActions
            key={`action-${message.id}`}
            chatId={chatId}
            message={message}
            vote={vote}
            isLoading={isLoading}
          />
        </div>
      </div>
    </motion.div>
  );
}

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="group/message mx-auto w-full max-w-3xl px-4"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          }
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
