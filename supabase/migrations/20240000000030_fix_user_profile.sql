-- Drop existing function
drop function if exists public.get_user_profile();

-- Recreate function with correct fields
create or replace function public.get_user_profile()
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
    user_data jsonb;
begin
    select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'updated_at', u.updated_at
    )
    into user_data
    from public.users u
    where u.id = auth.uid();

    return coalesce(user_data, '{}'::jsonb);
end;
$$; 