'use client';

import { ShieldCheck } from 'lucide-react';

import { useIsAdmin } from '@/hooks/use-is-admin';
import { cn } from '@/lib/utils';

interface AdminBadgeProps {
  className?: string;
}

export function AdminBadge({ className }: AdminBadgeProps) {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading || !isAdmin) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary',
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Admin
    </div>
  );
}
