'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import { usePromptConfig } from '@/hooks/use-prompt-config';
import { useToast } from '@/hooks/use-toast';

const promptConfigSchema = z.object({
  system_config: z.object({
    tone: z.number().min(1).max(5),
    technicalDepth: z.number().min(1).max(5),
    responseLength: z.number().min(1).max(5),
    language: z.enum(['en', 'es']),
    empathyLevel: z.number().min(1).max(5),
    urgencyEmphasis: z.number().min(1).max(5),
  }),
  business_rules: z.object({
    minQuoteAmount: z.number().min(0),
    maxQuoteAmount: z.number().min(0),
    warrantyPeriod: z.number().min(0),
    maxShopOptions: z.number().min(1).max(10),
    priceRangeBuffer: z.number().min(0).max(100),
  }),
  is_active: z.boolean(),
});

type PromptConfigForm = z.infer<typeof promptConfigSchema>;

export default function PromptConfigPage() {
  const { toast } = useToast();
  const { config, isLoading, mutate } = usePromptConfig();

  const form = useForm<PromptConfigForm>({
    resolver: zodResolver(promptConfigSchema),
    defaultValues: {
      system_config: {
        tone: 3,
        technicalDepth: 3,
        responseLength: 3,
        language: 'es',
        empathyLevel: 4,
        urgencyEmphasis: 3,
      },
      business_rules: {
        minQuoteAmount: 50,
        maxQuoteAmount: 1000,
        warrantyPeriod: 12,
        maxShopOptions: 3,
        priceRangeBuffer: 10,
      },
      is_active: true,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        system_config: config.system_config,
        business_rules: config.business_rules,
        is_active: config.is_active,
      });
    }
  }, [config, form]);

  async function onSubmit(data: PromptConfigForm) {
    try {
      const response = await fetch('/api/admin/prompt-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      await mutate();

      toast({
        title: 'Configuración guardada',
        description:
          'La configuración de prompts se ha guardado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar la configuración.',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Cargando configuración...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Configuración de Prompts
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Configura cómo el asistente interactúa con los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="system_config.tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tono de Comunicación</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      1: Casual - 5: Muy Profesional
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_config.language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_config.technicalDepth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profundidad Técnica</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      1: Básico - 5: Muy Técnico
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reglas de Negocio</CardTitle>
              <CardDescription>
                Configura las reglas de negocio para cotizaciones y garantías
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="business_rules.minQuoteAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Mínimo de Cotización</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_rules.maxQuoteAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Máximo de Cotización</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="business_rules.warrantyPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de Garantía (meses)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
              <CardDescription>
                Activa o desactiva esta configuración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activo</FormLabel>
                      <FormDescription>
                        Activar esta configuración de prompts
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
            </CardContent>
          </Card>

          <Button type="submit">Guardar Configuración</Button>
        </form>
      </Form>
    </div>
  );
}
