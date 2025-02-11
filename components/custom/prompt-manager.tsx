'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Prompt } from '@/ai/prompts';
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
  getAllPrompts,
} from '@/ai/prompts';

interface PromptFormData {
  name: string;
  content: string;
  isDefault?: boolean;
}

interface PromptManagerProps {
  onPromptChange?: () => void;
}

export function PromptManager({ onPromptChange }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    content: '',
  });

  // Cargar prompts
  const loadPrompts = async () => {
    const allPrompts = await getAllPrompts();
    setPrompts(allPrompts);
  };

  // Cargar prompts al montar el componente
  useEffect(() => {
    loadPrompts();
  }, []);

  // Crear o actualizar prompt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingPrompt) {
        // Actualizar prompt existente
        const updated = await updatePrompt({
          id: editingPrompt.id,
          ...formData,
        });

        if (updated) {
          toast.success('Prompt actualizado correctamente');
          onPromptChange?.();
        }
      } else {
        // Crear nuevo prompt
        const created = await createPrompt(formData);

        if (created) {
          toast.success('Prompt creado correctamente');
          onPromptChange?.();
        }
      }

      setIsOpen(false);
      loadPrompts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el prompt');
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar prompt
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este prompt?')) {
      setIsLoading(true);

      try {
        const success = await deletePrompt(id);

        if (success) {
          toast.success('Prompt eliminado correctamente');
          loadPrompts();
          onPromptChange?.();
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al eliminar el prompt');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Abrir diálogo para editar
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      content: prompt.content,
      isDefault: prompt.isDefault,
    });
    setIsOpen(true);
  };

  // Abrir diálogo para crear nuevo
  const handleNew = () => {
    setEditingPrompt(null);
    setFormData({
      name: '',
      content: '',
      isDefault: false,
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prompts</h2>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Prompt
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? 'Editar Prompt' : 'Nuevo Prompt'}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt
                ? 'Modifica los detalles del prompt existente'
                : 'Crea un nuevo prompt personalizado'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre del prompt"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Contenido del prompt"
                required
                className="min-h-[200px]"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Guardando...'
                  : editingPrompt
                    ? 'Actualizar'
                    : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contenido</TableHead>
              <TableHead>Predeterminado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>{prompt.name}</TableCell>
                <TableCell className="max-w-md truncate">
                  {prompt.content}
                </TableCell>
                <TableCell>{prompt.isDefault ? 'Sí' : 'No'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prompt.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
