'use client';

import { useCallback, useEffect, useState } from 'react';

import { getUserRole } from '@/db/cached-queries';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    try {
      const role = await getUserRole();
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return { isAdmin, isLoading };
}
