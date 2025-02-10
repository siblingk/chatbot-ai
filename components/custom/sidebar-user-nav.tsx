'use client';

import { User } from '@supabase/supabase-js';
import { Moon, Settings, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import { AdminBadge } from '@/components/admin-badge';
import { LogoutButton } from '@/components/custom/logout-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Button } from '@/components/ui/button';

export function SidebarUserNav({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();
  const { isAdmin } = useIsAdmin();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Image
                src={`https://avatar.vercel.sh/${user.email}`}
                alt={user.email ?? 'User Avatar'}
                width={24}
                height={24}
                className="rounded-full"
              />

              <div className="relative flex items-center gap-2">
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="absolute -top-8 left-0">
                <AdminBadge />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <Link href="/config">
                      <Settings className="size-4" />
                      <span>Configuración</span>
                    </Link>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'light' ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
                <span>{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
              </Button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
