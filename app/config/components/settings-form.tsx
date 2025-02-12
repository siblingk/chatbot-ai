'use client';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type AISettings = Database['public']['Tables']['ai_settings']['Row'];

const settingsFormSchema = z.object({
  // Variables de Configuración
  nivel_tono: z.number().min(1).max(5),
  nivel_tecnico: z.number().min(1).max(5),
  longitud_respuesta: z.number().min(1).max(5),
  nivel_urgencia: z.boolean(),
  sensibilidad_precio: z.number().min(1).max(5),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      nivel_tono: 3,
      nivel_tecnico: 3,
      longitud_respuesta: 3,
      nivel_urgencia: false,
      sensibilidad_precio: 3,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;

      const { data: settings, error } = await supabase
        .from('ai_settings')
        .select()
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }

      if (settings) {
        form.reset({
          nivel_tono: settings.nivel_tono,
          nivel_tecnico: settings.nivel_tecnico,
          longitud_respuesta: settings.longitud_respuesta,
          nivel_urgencia: settings.nivel_urgencia,
          sensibilidad_precio: settings.sensibilidad_precio,
        });
      }
    };

    fetchSettings();
  }, [form]);

  async function onSubmit(values: SettingsFormValues) {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('No se encontró el ID del usuario');
      }

      const settings: Database['public']['Tables']['ai_settings']['Insert'] = {
        user_id: user.id,
        nivel_tono: values.nivel_tono,
        nivel_tecnico: values.nivel_tecnico,
        longitud_respuesta: values.longitud_respuesta,
        nivel_urgencia: values.nivel_urgencia,
        sensibilidad_precio: values.sensibilidad_precio,
      };

      const { error } = await supabase
        .from('ai_settings')
        .upsert(settings)
        .select()
        .single();

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al guardar la configuración'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid gap-10">
            {/* Nivel de Tono */}
            <FormField
              control={form.control}
              name="nivel_tono"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Tono</FormLabel>
                    <span className="text-xs text-neutral-500">
                      {field.value}/5
                    </span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-0.5"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>Casual</span>
                        <span>Profesional</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nivel Técnico */}
            <FormField
              control={form.control}
              name="nivel_tecnico"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
                      Nivel Técnico
                    </FormLabel>
                    <span className="text-xs text-neutral-500">
                      {field.value}/5
                    </span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-0.5"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>Básico</span>
                        <span>Avanzado</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Longitud de Respuesta */}
            <FormField
              control={form.control}
              name="longitud_respuesta"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
                      Longitud
                    </FormLabel>
                    <span className="text-xs text-neutral-500">
                      {field.value}/5
                    </span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-0.5"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>Conciso</span>
                        <span>Detallado</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sensibilidad al Precio */}
            <FormField
              control={form.control}
              name="sensibilidad_precio"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
                      Presupuesto
                    </FormLabel>
                    <span className="text-xs text-neutral-500">
                      {field.value}/5
                    </span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-0.5"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>Económico</span>
                        <span>Premium</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manejo de Urgencia */}
            <FormField
              control={form.control}
              name="nivel_urgencia"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-2">
                  <div>
                    <FormLabel className="text-sm font-medium">
                      Modo Rápido
                    </FormLabel>
                    <FormDescription className="mt-0.5 text-xs text-neutral-500">
                      Respuestas más concisas y directas
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-neutral-900 dark:data-[state=checked]:bg-neutral-100"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px] bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
