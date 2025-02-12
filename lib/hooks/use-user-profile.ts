import useSWR from 'swr';

interface UserProfile {
  id: string;
  email: string;
  nombre: string | null;
  telefono: string | null;
  ubicacion: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    '/api/user-profile',
    async (url: any) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al obtener el perfil del usuario');
      }
      return response.json();
    }
  );

  return {
    profile: data,
    isLoading,
    error,
    mutate,
  };
}
