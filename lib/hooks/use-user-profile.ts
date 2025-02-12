import useSWR, { mutate } from 'swr';

interface UserProfile {
  id: string;
  email: string;
  nombre: string | null;
  telefono: string | null;
  ubicacion: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateUserProfileData {
  nombre?: string;
  telefono?: string;
  ubicacion?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al obtener el perfil del usuario');
  }
  return response.json();
};

export function useUserProfile() {
  const {
    data: profile,
    error,
    isLoading,
  } = useSWR<UserProfile>('/api/user-profile', fetcher);

  const updateProfile = async (data: UpdateUserProfileData) => {
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil del usuario');
      }

      const updatedProfile = await response.json();
      mutate('/api/user-profile', updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
}
