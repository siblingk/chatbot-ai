'use client';

import { useState, useEffect } from 'react';
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
  DialogTrigger,
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
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Label } from '@/components/ui/label';

const userProfileSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().regex(/^\d{10}$/, 'El número debe tener 10 dígitos'),
  ubicacion: z.string().min(2, 'Por favor indica tu ubicación'),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;

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

interface UserInfoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserInfoModal({ isOpen, onOpenChange }: UserInfoModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    ubicacion: '',
  });

  // Actualizar el formulario cuando se carga el perfil
  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || '',
        telefono: profile.telefono || '',
        ubicacion: profile.ubicacion || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      toast.success('Información actualizada correctamente');
      onOpenChange(false);
    } catch (error) {
      toast.error('Error al actualizar la información');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Información Personal</DialogTitle>
          <DialogDescription>
            Esta información se usará para personalizar las respuestas del
            asistente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
              placeholder="Tu teléfono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input
              id="ubicacion"
              value={formData.ubicacion}
              onChange={(e) =>
                setFormData({ ...formData, ubicacion: e.target.value })
              }
              placeholder="Tu ubicación"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
