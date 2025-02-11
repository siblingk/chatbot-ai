'use client';
import { Attachment, ChatRequestOptions, CreateMessage, Message } from 'ai';
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
import { ArrowUp, Paperclip, Square } from 'lucide-react';

import type { Prompt } from '@/ai/prompts';

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

interface MultimodalInputProps {
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
  onPromptSelect?: (prompt: Prompt) => void;
}

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
  onPromptSelect,
}: MultimodalInputProps) {
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

  const handlePromptSelect = (prompt: Prompt) => {
    setInput(prompt.content);
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustHeight();
    }
  };

  return (
    <div className="relative flex w-full flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="grid w-full gap-2 sm:grid-cols-2">
            {suggestedActions.map((suggestedAction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex cursor-pointer flex-col gap-2 rounded-lg bg-muted/50 p-4 hover:bg-muted"
                onClick={() => setInput(suggestedAction.action)}
              >
                <div className="font-medium">{suggestedAction.title}</div>
                <div className="text-sm text-muted-foreground">
                  {suggestedAction.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      <div className="flex flex-col gap-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment
                key={attachment.name}
                attachment={attachment}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.name !== attachment.name)
                  );
                }}
              />
            ))}
          </div>
        )}

        {uploadQueue.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadQueue.map((fileName) => (
              <div
                key={fileName}
                className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm text-muted-foreground"
              >
                <Paperclip className="size-4" />
                <span>Subiendo {fileName}...</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex flex-col gap-2">
          <div className="relative flex w-full items-end gap-2 ">
            <Textarea
              ref={textareaRef}
              tabIndex={0}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitForm();
                }
              }}
              placeholder="Escribe un mensaje..."
              spellCheck={false}
              className="min-h-[60px] w-full resize-none rounded-2xl bg-background px-4 py-[1.3rem]"
            />

            <div className="absolute right-0 top-1 flex h-full items-center gap-2 pr-2">
              <input
                className="hidden"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                type="submit"
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  if (isLoading) {
                    stop();
                  } else {
                    submitForm();
                  }
                }}
              >
                {isLoading ? (
                  <Square className="size-4" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
