-- Drop existing functions if they exist
drop function if exists public.update_user_info(text, text, text, text, text);
drop function if exists public.get_user_info();

-- Create function to get user info
create or replace function public.get_user_info()
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
    user_data jsonb;
begin
    select jsonb_build_object(
        'id', i.id,
        'nombre_cliente', i.nombre_cliente,
        'info_vehiculo', i.info_vehiculo,
        'historial_servicio', i.historial_servicio,
        'ubicacion', i.ubicacion,
        'idioma', i.idioma,
        'created_at', i.created_at,
        'updated_at', i.updated_at
    )
    into user_data
    from public.user_info i
    where i.user_id = auth.uid();

    return coalesce(user_data, '{}'::jsonb);
end;
$$;

-- Create function to update user info
create or replace function public.update_user_info(
    p_data jsonb
)
returns jsonb
security definer
language plpgsql
as $$
declare
    updated_record jsonb;
begin
    insert into public.user_info (
        user_id,
        nombre_cliente,
        info_vehiculo,
        historial_servicio,
        ubicacion,
        idioma
    )
    values (
        auth.uid(),
        p_data->>'nombre_cliente',
        p_data->>'info_vehiculo',
        p_data->>'historial_servicio',
        p_data->>'ubicacion',
        p_data->>'idioma'
    )
    on conflict (user_id)
    do update set
        nombre_cliente = coalesce(excluded.nombre_cliente, user_info.nombre_cliente),
        info_vehiculo = coalesce(excluded.info_vehiculo, user_info.info_vehiculo),
        historial_servicio = coalesce(excluded.historial_servicio, user_info.historial_servicio),
        ubicacion = coalesce(excluded.ubicacion, user_info.ubicacion),
        idioma = coalesce(excluded.idioma, user_info.idioma),
        updated_at = now()
    returning jsonb_build_object(
        'id', id,
        'nombre_cliente', nombre_cliente,
        'info_vehiculo', info_vehiculo,
        'historial_servicio', historial_servicio,
        'ubicacion', ubicacion,
        'idioma', idioma,
        'created_at', created_at,
        'updated_at', updated_at
    ) into updated_record;

    return updated_record;
end;
$$; 