-- Create an enum for user roles
CREATE TYPE auth.user_role AS ENUM ('user', 'admin');

-- Add role column to auth.users if it doesn't exist
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role auth.user_role NOT NULL DEFAULT 'user';

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION auth.is_admin()
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
CREATE OR REPLACE FUNCTION auth.set_user_role(user_id UUID, new_role auth.user_role)
RETURNS void AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT auth.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  -- Update the user's role
  UPDATE auth.users
  SET role = new_role
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to list all users and their roles (only accessible by admins)
CREATE OR REPLACE VIEW auth.users_with_roles AS
SELECT 
  id,
  email,
  role,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users;

-- Set RLS policy on the view
ALTER VIEW auth.users_with_roles OWNER TO authenticated;
GRANT ALL ON auth.users_with_roles TO authenticated;

-- Create policy to only allow admins to view the users list
CREATE POLICY admin_view_users
  ON auth.users_with_roles
  FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- Function to get the first admin or create one if none exists
CREATE OR REPLACE FUNCTION auth.ensure_initial_admin()
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
