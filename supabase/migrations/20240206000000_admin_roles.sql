-- Create user roles enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE auth.user_role AS ENUM ('user', 'admin');
    END IF;
END $$;

-- Add role column to auth.users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN role auth.user_role NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set user role (only admins can use this)
CREATE OR REPLACE FUNCTION public.set_user_role(user_id UUID, new_role auth.user_role)
RETURNS void AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  -- Update the user's role
  UPDATE auth.users
  SET role = new_role
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get users with roles (only admins can use this)
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role auth.user_role,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can view user roles';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.role,
    u.created_at,
    u.last_sign_in_at,
    u.raw_user_meta_data
  FROM auth.users u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the first admin or create one if none exists
CREATE OR REPLACE FUNCTION public.ensure_initial_admin()
RETURNS void AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  -- Check if any admin exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE role = 'admin'
  ) INTO admin_exists;

  -- If no admin exists, make the first user an admin
  IF NOT admin_exists THEN
    UPDATE auth.users
    SET role = 'admin'
    WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure we have at least one admin
SELECT public.ensure_initial_admin();
