import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserSettingsResponse } from '@/lib/supabase/types';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error: supabaseError } =
          await supabase.rpc('get_user_settings');

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        if (data && data.length > 0) {
          setSettings(data[0] as UserSettingsResponse);
        } else {
          setSettings(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettingsResponse>) => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error: supabaseError } = await supabase
        .from('user_settings')
        .upsert(
          {
            ...newSettings,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
          { onConflict: 'user_id' }
        );

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Actualizar el estado local
      if (settings) {
        setSettings({
          ...settings,
          ...newSettings,
        });
      } else {
        const { data } = await supabase.rpc('get_user_settings');
        if (data && data.length > 0) {
          setSettings(data[0] as UserSettingsResponse);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
}
