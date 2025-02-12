'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  FileJson,
  MessageSquare,
  Settings,
  Shield,
  User,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { AdminStats } from './components/admin-stats';
import { PromptForm } from './components/prompt-form';
import { PromptsList } from './components/prompts-list';
import { SettingsForm } from './components/settings-form';
import { UserInfoForm } from '@/components/custom/user-info-form';

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
    <div className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-medium tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza la experiencia de tu asistente
        </p>
      </div>

      <div className="grid gap-12">
        {/* Sección de Información Personal */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <User className="size-4 text-neutral-500" />
            <h2 className="text-base font-medium">Información Personal</h2>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border shadow-[0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_1px_rgba(255,255,255,0.1)]">
            <UserInfoForm />
          </div>
        </section>

        {/* Sección de Prompts */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="size-4 text-neutral-500" />
              <h2 className="text-base font-medium">Prompts</h2>
            </div>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border shadow-[0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_1px_rgba(255,255,255,0.1)]">
            <div className="p-6">
              <PromptsList
                initialPrompts={prompts as any}
                onEdit={handleEditPrompt}
              />
            </div>
          </div>
        </section>

        {/* Sección de Configuración */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-neutral-500" />
            <h2 className="text-base font-medium">Preferencias</h2>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border shadow-[0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_1px_rgba(255,255,255,0.1)]">
            <SettingsForm />
          </div>
        </section>

        {/* Sección de Estadísticas */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-neutral-500" />
            <h2 className="text-base font-medium">Análisis</h2>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border shadow-[0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_1px_rgba(255,255,255,0.1)]">
            <div className="p-6">
              <AdminStats />
            </div>
          </div>
        </section>
      </div>

      <PromptForm
        prompt={editingPrompt as any}
        open={isPromptFormOpen}
        onOpenChange={setIsPromptFormOpen}
        onSuccess={handlePromptFormSuccess}
      />
    </div>
  );
}
