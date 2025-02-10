-- Drop function if exists
DROP FUNCTION IF EXISTS get_admin_count();

-- Create function to count admin users
CREATE OR REPLACE FUNCTION get_admin_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM users
    WHERE role = 'admin'::user_role
  );
END;
$$; 