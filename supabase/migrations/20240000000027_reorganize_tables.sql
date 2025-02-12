-- Eliminar tablas antiguas
drop table if exists public.user_settings cascade;
drop table if exists public.user_info cascade;
drop table if exists public.chat_settings cascade;

-- Modificar la tabla users para incluir información personal
alter table public.users add column if not exists nombre text;
alter table public.users add column if not exists telefono text;
alter table public.users add column if not exists ubicacion text;

-- Crear tabla para configuraciones de IA
create table if not exists public.ai_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade unique,
    
    -- Configuraciones de IA
    nivel_tono integer default 3 check (nivel_tono between 1 and 5),
    nivel_tecnico integer default 3 check (nivel_tecnico between 1 and 5),
    longitud_respuesta integer default 3 check (longitud_respuesta between 1 and 5),
    nivel_urgencia boolean default false,
    sensibilidad_precio integer default 3 check (sensibilidad_precio between 1 and 5),
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para updated_at en ai_settings
create trigger handle_ai_settings_updated_at
    before update on public.ai_settings
    for each row
    execute function public.handle_updated_at();

-- RLS para ai_settings
alter table public.ai_settings enable row level security;

create policy "Users can view their own AI settings"
    on public.ai_settings for select
    using (auth.uid() = user_id);

create policy "Users can update their own AI settings"
    on public.ai_settings for update
    using (auth.uid() = user_id);

create policy "Users can insert their own AI settings"
    on public.ai_settings for insert
    with check (auth.uid() = user_id);

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
        'nombre', u.nombre,
        'telefono', u.telefono,
        'ubicacion', u.ubicacion,
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
        nombre = coalesce((p_data->>'nombre')::text, nombre),
        telefono = coalesce((p_data->>'telefono')::text, telefono),
        ubicacion = coalesce((p_data->>'ubicacion')::text, ubicacion),
        updated_at = now()
    where id = auth.uid()
    returning jsonb_build_object(
        'id', id,
        'email', email,
        'nombre', nombre,
        'telefono', telefono,
        'ubicacion', ubicacion,
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