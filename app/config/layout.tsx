import Link from 'next/link';
import { ChevronLeft, Settings } from 'lucide-react';

import { AdminBadge } from '@/components/admin-badge';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" className="mr-2" asChild>
            <Link href="/">
              <ChevronLeft className="size-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="size-5" />
            <h1 className="text-lg font-semibold">Configuración</h1>
          </div>
          <AdminBadge />
        </div>
      </header>
      <main className="container mx-auto flex-1 py-6">{children}</main>
    </div>
  );
}
