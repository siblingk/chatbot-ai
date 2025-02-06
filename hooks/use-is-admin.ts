'use client';

import { useCallback, useEffect, useState } from 'react';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/role');
      const { role } = await response.json();
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
