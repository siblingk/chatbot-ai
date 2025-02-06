import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UserRole = 'user' | 'admin';

export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('is_admin');

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('set_user_role', {
        user_id: userId,
        new_role: role
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting user role:', error);
    return false;
  }
};

export const listUsers = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_users_with_roles');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error listing users:', error);
    return null;
  }
};
