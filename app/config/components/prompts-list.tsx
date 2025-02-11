'use client';

import { useState, useEffect } from 'react';
import { Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface PromptsListProps {
  initialPrompts: Prompt[];
  onEdit: (prompt: Prompt) => void;
}

export function PromptsList({ initialPrompts, onEdit }: PromptsListProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    // Obtener el usuario actual
    const getCurrentUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('getCurrentUser - User ID:', user?.id);
      setCurrentUser(user?.id || null);
    };

    getCurrentUser();
  }, []);

  // Actualizar prompt cuando cambie currentUser
  useEffect(() => {
    console.log('Actualizando prompt con currentUser:', currentUser);
    const userPrompts = initialPrompts.filter((p) => p.user_id === currentUser);
    setUserPrompt(userPrompts.length > 0 ? userPrompts[0] : null);
  }, [currentUser, initialPrompts]);

  const handleToggleDefault = async (prompt: Prompt) => {
    try {
      if (!currentUser) {
        toast.error('No hay usuario autenticado');
        return;
      }

      const supabase = createClient();

      // Si el prompt ya está activo, lo desactivamos
      if (prompt.is_default) {
        const { error } = await supabase
          .from('prompts')
          .update({ is_default: false })
          .eq('id', prompt.id);

        if (error) throw error;
      } else {
        // Activar el prompt seleccionado
        const { error } = await supabase
          .from('prompts')
          .update({ is_default: true })
          .eq('id', prompt.id);

        if (error) throw error;
      }

      // Actualizar el estado local
      setUserPrompt((prev) =>
        prev ? { ...prev, is_default: !prev.is_default } : null
      );
      toast.success('Prompt actualizado correctamente');
    } catch (error) {
      console.error('Error toggling prompt:', error);
      toast.error('Error al actualizar el prompt');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mi Prompt Personalizado</CardTitle>
              <CardDescription>
                Personaliza y activa tu propio prompt para el chat
              </CardDescription>
            </div>
            {!userPrompt && (
              <Button
                onClick={() =>
                  onEdit({
                    id: '',
                    name: '',
                    content: '',
                    is_default: false,
                    created_at: '',
                    updated_at: '',
                    user_id: currentUser,
                  })
                }
                size="sm"
                className="gap-2"
              >
                <Plus className="size-4" />
                <span>Crear Prompt</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!userPrompt ? (
            <div className="py-8 text-center text-muted-foreground">
              No tienes un prompt personalizado. ¡Crea uno nuevo!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium leading-none">
                    {userPrompt.name}
                    {userPrompt.is_default && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Activo)
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {userPrompt.content}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={userPrompt.is_default}
                    onCheckedChange={() => handleToggleDefault(userPrompt)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(userPrompt)}
                  >
                    <Edit2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
