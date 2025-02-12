'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function UserInfoForm() {
  const { profile, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al actualizar la información');
    }
  };

  if (!profile && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Esta información se usará para personalizar las respuestas del
            asistente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsEditing(true)}>
            Agregar Información
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Editar Información Personal</CardTitle>
          <CardDescription>
            Esta información se usará para personalizar las respuestas del
            asistente
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>
          Esta información se usa para personalizar las respuestas del asistente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <p className="text-sm text-muted-foreground">
              {profile?.nombre || 'No especificado'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <p className="text-sm text-muted-foreground">
              {profile?.telefono || 'No especificado'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Ubicación</Label>
            <p className="text-sm text-muted-foreground">
              {profile?.ubicacion || 'No especificada'}
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)}>Editar Información</Button>
        </div>
      </CardContent>
    </Card>
  );
}
