import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { createPrompts, defaultConfig } from '@/ai/prompts';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';

type PromptConfig = Database['public']['Tables']['prompt_config']['Row'];

export function useActivePromptConfig() {
  const {
    data: config,
    error,
    mutate,
  } = useSWR<PromptConfig | null>('/api/admin/prompt-config', fetcher, {
    fallbackData: defaultConfig,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000, // 10 segundos
    shouldRetryOnError: true,
    retry: 3,
  });

  const prompts = config ? createPrompts(config) : createPrompts(defaultConfig);
  const isLoading = !error && !config;
  const isError = error !== undefined;

  return {
    config: config || defaultConfig,
    prompts,
    isLoading,
    isError,
    mutate,
  };
}
