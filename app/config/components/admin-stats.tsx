'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';

export function AdminStats() {
  const [adminCount, setAdminCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc('get_admin_count');
        if (data) {
          setAdminCount(data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-[50px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold">{adminCount}</div>
      <div className="text-sm text-muted-foreground">
        Administradores en el sistema
      </div>
    </div>
  );
}
