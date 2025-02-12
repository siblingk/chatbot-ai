-- Create user_settings table
create table if not exists public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade unique,
    
    -- Variables de Configuración
    nivel_tono integer default 3 check (nivel_tono between 1 and 5),
    nivel_tecnico integer default 3 check (nivel_tecnico between 1 and 5),
    longitud_respuesta integer default 3 check (longitud_respuesta between 1 and 5),
    nivel_urgencia boolean default false,
    sensibilidad_precio integer default 3 check (sensibilidad_precio between 1 and 5),
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_info table for storing personal information
create table if not exists public.user_info (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade unique,
    
    -- Información Personal (proporcionada por el usuario durante el chat)
    nombre_cliente text,
    info_vehiculo text,
    historial_servicio text,
    ubicacion text,
    idioma text default 'es',
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_user_settings_updated_at
    before update on public.user_settings
    for each row
    execute function public.handle_updated_at();

create trigger handle_user_info_updated_at
    before update on public.user_info
    for each row
    execute function public.handle_updated_at();

-- Create RLS policies for user_settings
alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);

create policy "Users can update their own settings"
    on public.user_settings for update
    using (auth.uid() = user_id);

create policy "Users can insert their own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);

-- Create RLS policies for user_info
alter table public.user_info enable row level security;

create policy "Users can view their own info"
    on public.user_info for select
    using (auth.uid() = user_id);

create policy "Users can update their own info"
    on public.user_info for update
    using (auth.uid() = user_id);

create policy "Users can insert their own info"
    on public.user_info for insert
    with check (auth.uid() = user_id);

-- Create function to get user settings
create or replace function public.get_user_settings()
returns table (
    id uuid,
    nivel_tono integer,
    nivel_tecnico integer,
    longitud_respuesta integer,
    nivel_urgencia boolean,
    sensibilidad_precio integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) security definer
set search_path = public
language plpgsql
as $$
begin
    return query
    select 
        s.id,
        s.nivel_tono,
        s.nivel_tecnico,
        s.longitud_respuesta,
        s.nivel_urgencia,
        s.sensibilidad_precio,
        s.created_at,
        s.updated_at
    from public.user_settings s
    where s.user_id = auth.uid();
end;
$$;

-- Create function to get user info
create or replace function public.get_user_info()
returns table (
    id uuid,
    nombre_cliente text,
    info_vehiculo text,
    historial_servicio text,
    ubicacion text,
    idioma text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) security definer
set search_path = public
language plpgsql
as $$
begin
    return query
    select 
        i.id,
        i.nombre_cliente,
        i.info_vehiculo,
        i.historial_servicio,
        i.ubicacion,
        i.idioma,
        i.created_at,
        i.updated_at
    from public.user_info i
    where i.user_id = auth.uid();
end;
$$;

-- Create function to update user info
create or replace function public.update_user_info(
    p_nombre_cliente text default null,
    p_info_vehiculo text default null,
    p_historial_servicio text default null,
    p_ubicacion text default null,
    p_idioma text default null
)
returns void
security definer
language plpgsql
as $$
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
        coalesce(p_nombre_cliente, nombre_cliente),
        coalesce(p_info_vehiculo, info_vehiculo),
        coalesce(p_historial_servicio, historial_servicio),
        coalesce(p_ubicacion, ubicacion),
        coalesce(p_idioma, idioma)
    )
    on conflict (user_id)
    do update set
        nombre_cliente = coalesce(excluded.nombre_cliente, user_info.nombre_cliente),
        info_vehiculo = coalesce(excluded.info_vehiculo, user_info.info_vehiculo),
        historial_servicio = coalesce(excluded.historial_servicio, user_info.historial_servicio),
        ubicacion = coalesce(excluded.ubicacion, user_info.ubicacion),
        idioma = coalesce(excluded.idioma, user_info.idioma),
        updated_at = now();
end;
$$; 