'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  FileJson,
  MessageSquare,
  Settings,
  Shield,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { AdminStats } from './components/admin-stats';
import { PromptForm } from './components/prompt-form';
import { PromptsList } from './components/prompts-list';
import { SettingsForm } from './components/settings-form';

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
      {/* Sección de Configuración */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Settings className="size-5" />
          <h2 className="text-lg font-semibold">Configuración</h2>
        </div>
        <SettingsForm />
      </section>

      {/* Sección de Prompts */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <FileJson className="size-5" />
          <h2 className="text-lg font-semibold">Prompts</h2>
        </div>
        <PromptsList
          initialPrompts={prompts as any}
          onEdit={handleEditPrompt}
        />
      </section>

      {/* Sección de Estadísticas */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BrainCircuit className="size-5" />
          <h2 className="text-lg font-semibold">Estadísticas</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <AdminStats />
          </CardContent>
        </Card>
      </section>

      <PromptForm
        prompt={editingPrompt as any}
        open={isPromptFormOpen}
        onOpenChange={setIsPromptFormOpen}
        onSuccess={handlePromptFormSuccess}
      />
    </div>
  );
}
