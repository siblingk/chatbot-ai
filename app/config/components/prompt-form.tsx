'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

const promptFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  content: z.string().min(1, 'El contenido es requerido'),
  is_default: z.boolean().default(false),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PromptFormProps {
  prompt?: Prompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PromptForm({
  prompt,
  open,
  onOpenChange,
  onSuccess,
}: PromptFormProps) {
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: '',
      content: '',
      is_default: false,
    },
  });

  useEffect(() => {
    if (prompt) {
      form.reset({
        name: prompt.name,
        content: prompt.content,
        is_default: prompt.is_default,
      });
    }
  }, [prompt, form]);

  const onSubmit = async (data: PromptFormValues) => {
    try {
      const supabase = createClient();

      if (prompt?.id) {
        const { error } = await supabase
          .from('prompts')
          .update({
            name: data.name,
            content: data.content,
            is_default: data.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prompt.id);

        if (error) throw error;
        toast.success('Prompt actualizado correctamente');
      } else {
        const { error } = await supabase.from('prompts').insert({
          name: data.name,
          content: data.content,
          is_default: data.is_default,
        });

        if (error) throw error;
        toast.success('Prompt creado correctamente');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Error al guardar el prompt');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {prompt?.id ? 'Editar Prompt' : 'Nuevo Prompt'}
          </DialogTitle>
          <DialogDescription>
            Crea o edita un prompt personalizado para el chat
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi prompt personalizado" {...field} />
                  </FormControl>
                  <FormDescription>
                    Un nombre descriptivo para identificar el prompt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe aquí el contenido del prompt..."
                      className="min-h-[200px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    El contenido del prompt que se usará en el chat
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Prompt por Defecto
                    </FormLabel>
                    <FormDescription>
                      Usar este prompt como el predeterminado
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {prompt?.id ? 'Guardar Cambios' : 'Crear Prompt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
