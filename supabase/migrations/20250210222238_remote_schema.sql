create type "public"."user_role" as enum ('user', 'admin');

alter table "public"."users" add column "role" user_role not null default 'user'::user_role;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'::user_role
  );
END;
$function$
;


