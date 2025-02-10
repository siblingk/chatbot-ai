import useSWR from 'swr';

import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';

type PromptConfig = Database['public']['Tables']['prompt_config']['Row'];

export function usePromptConfig() {
  const { data, error, mutate } = useSWR<PromptConfig>(
    '/api/admin/prompt-config',
    fetcher
  );

  return {
    config: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
