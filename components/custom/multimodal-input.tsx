'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, StopCircle } from 'lucide-react';

export interface MultimodalInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
  disabled?: boolean;
}

export function MultimodalInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  disabled = false,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
      setInput('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="relative flex w-full grow flex-col"
    >
      <Textarea
        ref={textareaRef}
        tabIndex={0}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled
            ? 'Por favor completa tu información personal primero'
            : 'Envía un mensaje...'
        }
        spellCheck={false}
        className="min-h-[60px] w-full resize-none bg-background px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        disabled={disabled || isLoading}
      />
      <div className="absolute right-0 top-4 sm:right-4">
        <div className="flex gap-2">
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stop()}
            >
              <StopCircle className="h-4 w-4" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            input.length > 0 && (
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={disabled || isLoading}
              >
                <SendHorizonal className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            )
          )}
        </div>
      </div>
    </form>
  );
}
