'use client';

import { useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';

interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PromptsListProps {
  initialPrompts: Prompt[];
  onEdit: (prompt: Prompt) => void;
}

export function PromptsList({ initialPrompts, onEdit }: PromptsListProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prompts Personalizados</CardTitle>
            <CardDescription>
              Gestiona tus prompts personalizados para el chat
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
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {prompts.map((prompt) => (
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prompt.content}
                    </p>
                  </div>
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
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
