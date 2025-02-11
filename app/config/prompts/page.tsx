'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { PromptsList } from '@/app/config/components/prompts-list';
import { PromptForm } from '@/app/config/components/prompt-form';

interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>();

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Obtener el usuario actual para depuración
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('Usuario actual:', user);

      if (!user) {
        console.error('No hay usuario autenticado');
        return;
      }

      // Primero intentamos obtener los prompts usando la función RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_prompts')
        .returns<Prompt[]>();

      console.log('RPC Data:', rpcData);
      console.log('RPC Error:', rpcError);

      if (rpcError) {
        console.error('Error RPC:', rpcError);

        // Si falla el RPC, intentamos obtener directamente de la tabla
        const { data: queryData, error: queryError } = await supabase
          .from('prompts')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false })
          .returns<Prompt[]>();

        console.log('Query Data:', queryData);
        console.log('Query Error:', queryError);

        if (queryError) {
          console.error('Error Query:', queryError);
          throw queryError;
        }

        if (!queryData) {
          console.log('No se encontraron prompts en la consulta directa');
          setPrompts([]);
          return;
        }

        console.log('Prompts from query:', queryData);
        setPrompts(queryData);
      } else {
        if (!rpcData) {
          console.log('No se encontraron prompts en el RPC');
          setPrompts([]);
          return;
        }

        console.log('Prompts from RPC:', rpcData);
        setPrompts(rpcData);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error('Error al cargar los prompts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Cargando prompts...');
    loadPrompts();
  }, []);

  const handleEdit = (prompt: Prompt) => {
    console.log('Editando prompt:', prompt);
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    console.log('Cerrando formulario');
    setEditingPrompt(undefined);
    setIsFormOpen(false);
  };

  const handleFormSuccess = () => {
    console.log('Formulario guardado con éxito, recargando prompts...');
    loadPrompts();
    handleFormClose();
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Prompts</h1>
      <p className="text-muted-foreground">
        Aquí puedes ver y gestionar todos los prompts disponibles, incluyendo
        los del sistema y tus prompts personalizados.
      </p>

      {isLoading ? (
        <div className="text-center text-muted-foreground">
          Cargando prompts...
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No hay prompts disponibles. ¡Crea uno nuevo!
        </div>
      ) : (
        <PromptsList initialPrompts={prompts} onEdit={handleEdit} />
      )}

      <PromptForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        prompt={editingPrompt}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
