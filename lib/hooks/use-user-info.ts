import useSWR, { mutate } from 'swr';

interface UserInfo {
  id: string;
  nombre_cliente: string | null;
  info_vehiculo: string | null;
  historial_servicio: string | null;
  ubicacion: string | null;
  idioma: string;
  created_at: string;
  updated_at: string;
}

interface UpdateUserInfoData {
  nombre_cliente?: string;
  info_vehiculo?: string;
  historial_servicio?: string;
  ubicacion?: string;
  idioma?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al obtener la información del usuario');
  }
  return response.json();
};

export function useUserInfo() {
  const {
    data: userInfo,
    error,
    isLoading,
  } = useSWR<UserInfo>('/api/user-info', fetcher);

  const updateUserInfo = async (data: UpdateUserInfoData) => {
    try {
      const response = await fetch('/api/user-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la información del usuario');
      }

      const updatedInfo = await response.json();
      mutate('/api/user-info', updatedInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating user info:', error);
      throw error;
    }
  };

  return {
    userInfo,
    isLoading,
    error,
    updateUserInfo,
  };
}
