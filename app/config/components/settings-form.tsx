'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { UserSettings } from '@/lib/supabase/types';

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
      const { data: settings, error } = await supabase.rpc('get_user_settings');

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (settings && settings.length > 0) {
        const userSettings = settings[0];
        form.reset({
          nivel_tono: userSettings.nivel_tono,
          nivel_tecnico: userSettings.nivel_tecnico,
          longitud_respuesta: userSettings.longitud_respuesta,
          nivel_urgencia: userSettings.nivel_urgencia,
          sensibilidad_precio: userSettings.sensibilidad_precio,
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

      // Crear el objeto de configuración con el tipo correcto
      const settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        nivel_tono: values.nivel_tono,
        nivel_tecnico: values.nivel_tecnico,
        longitud_respuesta: values.longitud_respuesta,
        nivel_urgencia: values.nivel_urgencia,
        sensibilidad_precio: values.sensibilidad_precio,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Chat</CardTitle>
        <CardDescription>
          Personaliza cómo el asistente interactúa contigo y maneja tus
          consultas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Variables de Configuración */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nivel_tono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Tono</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>Casual</span>
                      <span>Profesional</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel_tecnico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel Técnico</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>Básico</span>
                      <span>Detallado</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitud_respuesta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud de Respuesta</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>Conciso</span>
                      <span>Extenso</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel_urgencia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Manejo de Urgencia
                      </FormLabel>
                      <FormDescription>
                        Activa este modo para respuestas más rápidas y directas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sensibilidad_precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sensibilidad al Precio</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>Económico</span>
                      <span>Premium</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
