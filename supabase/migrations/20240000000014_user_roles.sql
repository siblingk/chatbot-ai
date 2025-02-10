-- Create enum type for roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to users table with enum type
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user'::user_role;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'::user_role
  );
END;
$$; 