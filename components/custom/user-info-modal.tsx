'use client';

import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSWRConfig } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, MapPin, Check, X } from 'lucide-react';
import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const userProfileSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().regex(/^\d{10}$/, 'El número debe tener 10 dígitos'),
  ubicacion: z.string().min(2, 'Por favor indica tu ubicación'),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;

interface UserInfoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    id: 'nombre',
    title: '¿Cómo te llamas?',
    description: 'Tu nombre nos ayuda a personalizar tu experiencia',
  },
  {
    id: 'telefono',
    title: '¿Cuál es tu teléfono?',
    description: 'Te contactaremos solo cuando sea necesario',
  },
  {
    id: 'ubicacion',
    title: '¿Dónde te encuentras?',
    description: 'Para mostrarte los talleres más cercanos',
  },
];

export function UserInfoModal({ isOpen, onOpenChange }: UserInfoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const { mutate } = useSWRConfig();

  const form = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      ubicacion: '',
    },
  });

  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const ubicacionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentStep === 2 && !detectedLocation && !isConfirmingLocation) {
      if ('geolocation' in navigator) {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=es`
              );

              if (!response.ok) {
                throw new Error(
                  'Error en la respuesta del servicio de geocodificación'
                );
              }

              const data = await response.json();
              if (data.address?.city || data.address?.town) {
                setDetectedLocation(data.address?.city || data.address?.town);
                setIsConfirmingLocation(true);
              } else {
                toast.error('No se pudo detectar tu ciudad');
                setIsConfirmingLocation(false);
              }
            } catch (error) {
              console.error('Error getting location:', error);
              toast.error('No se pudo obtener tu ubicación');
              setIsConfirmingLocation(false);
            } finally {
              setIsLoading(false);
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            toast.error('No se pudo acceder a tu ubicación');
            setIsLoading(false);
            setIsConfirmingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else {
        toast.error('Tu navegador no soporta geolocalización');
        setIsConfirmingLocation(false);
      }
    }
  }, [currentStep, detectedLocation, isConfirmingLocation]);

  async function onSubmit(values: UserProfileFormValues) {
    try {
      setIsLoading(true);

      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la información');
      }

      await mutate('/api/user-profile');
      toast.success('¡Información guardada correctamente!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
      toast.error('Error al guardar la información');
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = async () => {
    const currentField = steps[currentStep].id as keyof UserProfileFormValues;
    const isValid = await form.trigger(currentField);

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleOpenChange = () => {
    toast.error('Por favor completa la información requerida');
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleNext();
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return `(${numbers}`;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleConfirmLocation = () => {
    if (detectedLocation) {
      form.setValue('ubicacion', detectedLocation);
      handleNext();
    }
  };

  const handleRejectLocation = () => {
    setIsConfirmingLocation(false);
    setDetectedLocation(null);
    form.setValue('ubicacion', '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="fixed left-1/2 top-1/2 flex min-h-[380px] w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center overflow-hidden rounded-[24px] border-none bg-gradient-to-b from-gray-50/80 to-white/80 p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:from-gray-900/80 dark:to-gray-800/80 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_12px_-2px_rgba(0,0,0,0.4)]"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Barra de progreso sutil */}
        <div className="absolute left-0 top-0 h-[2px] w-full overflow-hidden">
          <motion.div
            className="h-full bg-gray-200 dark:bg-gray-700"
            initial={{ width: '0%' }}
            animate={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <DialogHeader className="mb-6 text-center">
            <motion.div
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogTitle className="text-2xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
                {steps[currentStep].title}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {steps[currentStep].description}
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-6"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="min-h-[60px]"
                >
                  {currentStep === 0 && (
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Tu nombre completo"
                              autoComplete="off"
                              spellCheck={false}
                              autoFocus={true}
                              onKeyDown={handleKeyDown}
                              className="h-10 rounded-lg border-none bg-gray-100/50 text-center text-base font-normal text-gray-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300 dark:bg-gray-800/50 dark:text-gray-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:placeholder:text-gray-500 dark:focus-visible:ring-gray-700"
                            />
                          </FormControl>
                          <FormMessage className="mt-2 text-center text-[13px]" />
                        </FormItem>
                      )}
                    />
                  )}

                  {currentStep === 1 && (
                    <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="(123) 456-7890"
                              autoComplete="off"
                              inputMode="numeric"
                              autoFocus={true}
                              value={formatPhoneNumber(field.value)}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                              onKeyDown={handleKeyDown}
                              maxLength={14}
                              className="h-10 rounded-lg border-none bg-gray-100/50 text-center text-base font-normal text-gray-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300 dark:bg-gray-800/50 dark:text-gray-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:placeholder:text-gray-500 dark:focus-visible:ring-gray-700"
                            />
                          </FormControl>
                          <FormMessage className="mt-2 text-center text-[13px]" />
                        </FormItem>
                      )}
                    />
                  )}

                  {currentStep === 2 && (
                    <FormField
                      control={form.control}
                      name="ubicacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            {isLoading ? (
                              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                <div className="size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Detectando tu ubicación...
                                </p>
                              </div>
                            ) : isConfirmingLocation ? (
                              <div className="space-y-4 text-center">
                                <div className="flex items-center justify-center gap-2 text-base text-gray-900 dark:text-gray-100">
                                  <MapPin className="h-4 w-4" />
                                  <span>{detectedLocation}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  ¿Es esta tu ubicación correcta?
                                </p>
                                <div className="flex justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleRejectLocation}
                                    className="gap-1.5 rounded-lg bg-gray-100/50 px-4 py-2 text-sm font-medium text-gray-700"
                                    autoFocus={true}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    No
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleConfirmLocation}
                                    className="gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Sí
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Input
                                {...field}
                                placeholder="Tu ciudad"
                                autoComplete="off"
                                autoFocus={true}
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck={false}
                                onKeyDown={handleKeyDown}
                                className="h-10 rounded-lg border-none bg-gray-100/50 text-center text-base font-normal text-gray-900 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300 dark:bg-gray-800/50 dark:text-gray-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:placeholder:text-gray-500 dark:focus-visible:ring-gray-700"
                              />
                            )}
                          </FormControl>
                          <FormMessage className="mt-2 text-center text-[13px]" />
                        </FormItem>
                      )}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex w-full gap-2">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    className="flex-1 gap-1.5 rounded-lg bg-gray-100/50 px-4 py-2 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm hover:bg-gray-200/50 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Atrás
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white',
                    currentStep === 0 && 'w-full'
                  )}
                >
                  {currentStep === steps.length - 1 ? (
                    isLoading ? (
                      'Guardando...'
                    ) : (
                      'Finalizar'
                    )
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
