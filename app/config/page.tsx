'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  FileJson,
  MessageSquare,
  Shield,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { AdminStats } from './components/admin-stats';
import { PromptForm } from './components/prompt-form';
import { PromptsList } from './components/prompts-list';

interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfigPage() {
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>();
  const [isPromptFormOpen, setIsPromptFormOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    const fetchPrompts = async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc('get_user_prompts');
      if (data) {
        setPrompts(data);
      }
    };

    fetchPrompts();
  }, []);

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsPromptFormOpen(true);
  };

  const handlePromptFormSuccess = async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_user_prompts');
    if (data) {
      setPrompts(data);
    }
  };

  return (
    <div className="space-y-12">
      {/* Sección de Prompts */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Prompts</h2>
        </div>
        <PromptsList initialPrompts={prompts} onEdit={handleEditPrompt} />
      </section>

      {/* Sección de Estadísticas */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Estadísticas</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <AdminStats />
          </CardContent>
        </Card>
      </section>

      {/* Sección de Configuración del Chat */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Configuración del Chat</h2>
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Historial de Chat</div>
                <div className="text-sm text-muted-foreground">
                  Mantener historial de conversaciones
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Autoguardado</div>
                <div className="text-sm text-muted-foreground">
                  Guardar conversaciones automáticamente
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sección de IA */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Configuración de IA</h2>
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Modo Creativo</div>
                <div className="text-sm text-muted-foreground">
                  Permitir respuestas más creativas y extensas
                </div>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Memoria de Contexto</div>
                <div className="text-sm text-muted-foreground">
                  Mantener contexto entre conversaciones
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sección de Administración */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Administración</h2>
        </div>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Registro de Actividad</div>
                <div className="text-sm text-muted-foreground">
                  Mantener registro de acciones administrativas
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Acceso de Usuarios</div>
                <div className="text-sm text-muted-foreground">
                  Permitir registro de nuevos usuarios
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </section>

      <PromptForm
        prompt={editingPrompt}
        open={isPromptFormOpen}
        onOpenChange={setIsPromptFormOpen}
        onSuccess={handlePromptFormSuccess}
      />
    </div>
  );
}
