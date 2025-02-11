'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';

interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

interface PromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt;
  onSuccess?: () => void;
}

export function PromptForm({
  open,
  onOpenChange,
  prompt,
  onSuccess,
}: PromptFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (prompt) {
      setName(prompt.name);
      setContent(prompt.content);
      setIsDefault(prompt.is_default);
    } else {
      setName('');
      setContent('');
      setIsDefault(false);
    }
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log('Usuario actual:', user);
      console.log('Prompt a guardar:', prompt);

      if (userError) throw userError;
      if (!user) throw new Error('No se encontró el usuario');

      if (prompt?.id) {
        console.log('Actualizando prompt existente:', prompt);

        // Solo permitir editar si el prompt pertenece al usuario
        if (prompt.user_id !== user.id) {
          throw new Error('No puedes editar este prompt');
        }

        // Actualizar prompt existente
        const { error } = await supabase
          .from('prompts')
          .update({
            name,
            content,
            is_default: isDefault,
            updated_at: now,
          })
          .eq('id', prompt.id);

        if (error) throw error;

        toast.success('Prompt actualizado correctamente');
      } else {
        console.log('Creando nuevo prompt para el usuario:', user.id);

        // Crear nuevo prompt
        const { data, error } = await supabase
          .from('prompts')
          .insert({
            name,
            content,
            is_default: isDefault,
            user_id: user.id,
            created_at: now,
            updated_at: now,
          })
          .select();

        console.log('Resultado de la inserción:', { data, error });

        if (error) {
          console.error('Error al insertar:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error('No se pudo crear el prompt');
        }

        toast.success('Prompt creado correctamente');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar el prompt:', error);
      toast.error('Error al guardar el prompt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {prompt?.id ? 'Editar Prompt' : 'Crear Prompt Personalizado'}
          </DialogTitle>
          <DialogDescription>
            {prompt?.id
              ? 'Modifica tu prompt personalizado para el chat.'
              : 'Crea tu prompt personalizado para el chat. Solo puedes tener uno activo a la vez.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre descriptivo para tu prompt"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe las instrucciones personalizadas que se agregarán al prompt del sistema..."
              className="h-[200px]"
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
              disabled={isLoading}
            />
            <Label htmlFor="is-default">
              Activar este prompt personalizado
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {prompt?.id ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
