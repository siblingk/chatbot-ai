import { Suspense } from 'react';
import {
  Bot,
  BrainCircuit,
  FileJson,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getAdminUsersQuery } from '@/db/queries';
import { createClient } from '@/lib/supabase/server';

async function UsersStats() {
  const supabase = await createClient();
  const adminUsers = await getAdminUsersQuery(supabase);

  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold">{adminUsers.length}</div>
      <div className="text-sm text-muted-foreground">
        Administradores en el sistema
      </div>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-[50px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  );
}

export default function ConfigPage() {
  return (
    <div className="space-y-12">
      {/* Sección de Estadísticas */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Estadísticas</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<StatsLoading />}>
              <UsersStats />
            </Suspense>
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
    </div>
  );
}
