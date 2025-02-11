'use client';

import { useState, useEffect } from 'react';
import { Edit2, MoreVertical, Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

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

  // Actualizar prompts cuando cambie currentUser
  useEffect(() => {
    console.log('Actualizando prompts con currentUser:', currentUser);
    setPrompts(initialPrompts);
  }, [currentUser, initialPrompts]);

  console.log('PromptsList - Initial Prompts:', initialPrompts);
  console.log('PromptsList - Current Prompts:', prompts);
  console.log('PromptsList - Current User:', currentUser);

  // Filtrar prompts del sistema y del usuario
  const systemPrompts = prompts.filter((p) => {
    console.log('Evaluando prompt para sistema:', p);
    return p.user_id === null;
  });

  const userPrompts = prompts.filter((p) => {
    console.log('Evaluando prompt para usuario:', p);
    console.log(
      'Comparando user_id:',
      p.user_id,
      'con currentUser:',
      currentUser
    );
    return p.user_id === currentUser;
  });

  console.log('Prompts filtrados - Sistema:', systemPrompts);
  console.log('Prompts filtrados - Usuario:', userPrompts);

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('prompts').delete().eq('id', id);

      if (error) throw error;

      setPrompts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Prompt eliminado correctamente');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Error al eliminar el prompt');
    }
  };

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
        // Desactivar TODOS los prompts (tanto del sistema como del usuario)
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ is_default: false })
          .eq('is_default', true);

        if (updateError) throw updateError;

        // Luego activamos el prompt seleccionado
        const { error } = await supabase
          .from('prompts')
          .update({ is_default: true })
          .eq('id', prompt.id);

        if (error) throw error;
      }

      // Actualizar la lista de prompts
      const { data: updatedPrompts, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .or(`user_id.eq.${currentUser},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPrompts(updatedPrompts || []);
      toast.success('Prompt actualizado correctamente');
    } catch (error) {
      console.error('Error toggling prompt:', error);
      toast.error('Error al actualizar el prompt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompts del Sistema */}
      {systemPrompts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prompts del Sistema</CardTitle>
            <CardDescription>Prompts predefinidos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {systemPrompts.map((prompt) => (
                  <div key={prompt.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none">
                          {prompt.name}
                          {prompt.is_default && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Default)
                            </span>
                          )}
                        </h4>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {prompt.content}
                        </p>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Prompts del Usuario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Prompts</CardTitle>
              <CardDescription>
                Gestiona tus prompts personalizados
              </CardDescription>
            </div>
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
              <span>Nuevo Prompt</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userPrompts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay prompts personalizados. ¡Crea uno nuevo!
            </div>
          ) : (
            <ScrollArea className="h-[150px] pr-4">
              <div className="space-y-4">
                {userPrompts.map((prompt) => (
                  <div key={prompt.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none">
                          {prompt.name}
                          {prompt.is_default && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Activo)
                            </span>
                          )}
                        </h4>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {prompt.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={prompt.is_default}
                          onCheckedChange={() => handleToggleDefault(prompt)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => onEdit(prompt)}
                            >
                              <Edit2 className="size-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleDelete(prompt.id)}
                            >
                              <Trash className="size-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
