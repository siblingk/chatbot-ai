'use client';

import { Attachment, ChatRequestOptions, CreateMessage, Message } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const suggestedActions = [
  {
    title: 'My car makes noises',
    label: 'when braking',
    action: 'My car makes strange noises when braking, what could it be?',
  },
  {
    title: 'I need a tune-up',
    label: 'for my vehicle',
    action: 'I need a tune-up for my vehicle, what do you recommend?',
  },
];

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    ''
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(async () => {
    try {
      // Validar que haya contenido
      if (!input.trim()) {
        toast.error('Por favor ingresa un mensaje');
        return;
      }

      // Actualizar la URL
      window.history.replaceState({}, '', `/chat/${chatId}`);

      // Crear el evento sintético
      const syntheticEvent = {
        preventDefault: () => {},
      };

      // Llamar handleSubmit con el evento y las opciones
      try {
        await handleSubmit(syntheticEvent, {
          experimental_attachments: attachments,
        });

        // Limpiar el formulario solo si el envío fue exitoso
        setAttachments([]);
        setLocalStorageInput('');
        setInput('');

        if (width && width > 768) {
          textareaRef.current?.focus();
        }
      } catch (error) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = 'Error al enviar el mensaje';

        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error instanceof Response) {
          try {
            const data = await error.json();
            errorMessage = data.details || data.error || errorMessage;
          } catch {
            // Si no podemos parsear la respuesta, usar el mensaje genérico
          }
        }

        console.error('Error en el envío:', error);
        toast.error(errorMessage);

        // Re-habilitar el input
        if (textareaRef.current) {
          textareaRef.current.disabled = false;
        }
      }
    } catch (error) {
      console.error('Error general:', error);
      toast.error('Error inesperado. Por favor intenta de nuevo.');
    }
  }, [
    input,
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    setInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File, chatId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);

    try {
      const response = await fetch(`/api/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          name: data.path,
          contentType: file.type,
        };
      } else {
        const { error, details } = await response.json();
        console.error('Upload error:', { error, details });
        toast.error(error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file, chatId));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is NonNullable<typeof attachment> =>
            attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload one or more files');
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, chatId]
  );

  return (
    <div className="relative flex w-full flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="grid w-full gap-2 sm:grid-cols-2">
            {suggestedActions.map((suggestedAction, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * index }}
                key={index}
                className={index > 1 ? 'hidden sm:block' : 'block'}
              >
                <Button
                  variant="ghost"
                  onClick={async () => {
                    window.history.replaceState({}, '', `/chat/${chatId}`);

                    append({
                      role: 'user',
                      content: suggestedAction.action,
                    });
                  }}
                  className="h-auto w-full flex-1 items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
                >
                  <span className="font-medium">{suggestedAction.title}</span>
                  <span className="text-muted-foreground">
                    {suggestedAction.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        )}

      <input
        type="file"
        className="pointer-events-none fixed -left-4 -top-4 size-0.5 opacity-0"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row items-end gap-2 overflow-x-scroll">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder="Describe your vehicle's problem or the service you need..."
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted',
          className
        )}
        rows={3}
        autoFocus
        onKeyDown={async (event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (isLoading) {
              toast.error(
                'Por favor espera a que el modelo termine su respuesta.'
              );
              return;
            }

            if (!input.trim()) {
              toast.error('Por favor ingresa un mensaje');
              return;
            }

            try {
              await submitForm();
            } catch (error) {
              console.error('Error al enviar mensaje:', error);
              toast.error(
                'Error al enviar el mensaje. Por favor intenta de nuevo.'
              );
            }
          }
        }}
      />

      {isLoading ? (
        <Button
          className="absolute bottom-2 right-2 m-0.5 h-fit rounded-full border p-1.5 dark:border-zinc-600"
          onClick={(event) => {
            event.preventDefault();
            stop();
            setMessages((messages) => sanitizeUIMessages(messages));
          }}
        >
          <StopIcon size={14} />
        </Button>
      ) : (
        <Button
          className="absolute bottom-2 right-2 m-0.5 h-fit rounded-full border p-1.5 dark:border-zinc-600"
          onClick={async (event) => {
            event.preventDefault();
            if (!input.trim()) {
              toast.error('Por favor ingresa un mensaje');
              return;
            }
            try {
              await submitForm();
            } catch (error) {
              console.error('Error al enviar mensaje:', error);
              toast.error(
                'Error al enviar el mensaje. Por favor intenta de nuevo.'
              );
            }
          }}
          disabled={!input.trim() || uploadQueue.length > 0}
        >
          <ArrowUpIcon size={14} />
        </Button>
      )}

      <Button
        className="absolute bottom-2 right-11 m-0.5 h-fit rounded-full p-1.5 dark:border-zinc-700"
        onClick={(event) => {
          event.preventDefault();
          fileInputRef.current?.click();
        }}
        variant="outline"
        disabled={isLoading}
      >
        <PaperclipIcon size={14} />
      </Button>
    </div>
  );
}
