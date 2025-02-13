-- Eliminar tablas antiguas
drop table if exists public.user_settings cascade;
drop table if exists public.user_info cascade;
drop table if exists public.chat_settings cascade;
drop table if exists public.ai_settings cascade;

-- Modificar la tabla users para mantener solo lo esencial
alter table public.users drop column if exists nombre;
alter table public.users drop column if exists telefono;
alter table public.users drop column if exists ubicacion;

-- Función para obtener información del usuario
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

-- Función para actualizar información del usuario
create or replace function public.update_user_profile(
    p_data jsonb
)
returns jsonb
security definer
language plpgsql
as $$
declare
    updated_record jsonb;
begin
    update public.users
    set
        updated_at = now()
    where id = auth.uid()
    returning jsonb_build_object(
        'id', id,
        'email', email,
        'created_at', created_at,
        'updated_at', updated_at
    ) into updated_record;

    return updated_record;
end;
$$;

-- Función para obtener configuraciones de IA
create or replace function public.get_ai_settings()
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
    settings_data jsonb;
begin
    select jsonb_build_object(
        'id', s.id,
        'nivel_tono', s.nivel_tono,
        'nivel_tecnico', s.nivel_tecnico,
        'longitud_respuesta', s.longitud_respuesta,
        'nivel_urgencia', s.nivel_urgencia,
        'sensibilidad_precio', s.sensibilidad_precio,
        'created_at', s.created_at,
        'updated_at', s.updated_at
    )
    into settings_data
    from public.ai_settings s
    where s.user_id = auth.uid();

    return coalesce(settings_data, '{}'::jsonb);
end;
$$;

-- Función para actualizar configuraciones de IA
create or replace function public.update_ai_settings(
    p_data jsonb
)
returns jsonb
security definer
language plpgsql
as $$
declare
    updated_record jsonb;
begin
    insert into public.ai_settings (
        user_id,
        nivel_tono,
        nivel_tecnico,
        longitud_respuesta,
        nivel_urgencia,
        sensibilidad_precio
    )
    values (
        auth.uid(),
        coalesce((p_data->>'nivel_tono')::integer, 3),
        coalesce((p_data->>'nivel_tecnico')::integer, 3),
        coalesce((p_data->>'longitud_respuesta')::integer, 3),
        coalesce((p_data->>'nivel_urgencia')::boolean, false),
        coalesce((p_data->>'sensibilidad_precio')::integer, 3)
    )
    on conflict (user_id)
    do update set
        nivel_tono = coalesce((excluded.nivel_tono)::integer, ai_settings.nivel_tono),
        nivel_tecnico = coalesce((excluded.nivel_tecnico)::integer, ai_settings.nivel_tecnico),
        longitud_respuesta = coalesce((excluded.longitud_respuesta)::integer, ai_settings.longitud_respuesta),
        nivel_urgencia = coalesce((excluded.nivel_urgencia)::boolean, ai_settings.nivel_urgencia),
        sensibilidad_precio = coalesce((excluded.sensibilidad_precio)::integer, ai_settings.sensibilidad_precio),
        updated_at = now()
    returning jsonb_build_object(
        'id', id,
        'nivel_tono', nivel_tono,
        'nivel_tecnico', nivel_tecnico,
        'longitud_respuesta', longitud_respuesta,
        'nivel_urgencia', nivel_urgencia,
        'sensibilidad_precio', sensibilidad_precio,
        'created_at', created_at,
        'updated_at', updated_at
    ) into updated_record;

    return updated_record;
end;
$$; 