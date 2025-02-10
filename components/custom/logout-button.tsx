'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { signOut } from '@/db/auth';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <DropdownMenuItem asChild>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        onClick={handleLogout}
      >
        <LogOut className="size-4" />
        <span>Cerrar sesión</span>
      </Button>
    </DropdownMenuItem>
  );
}
