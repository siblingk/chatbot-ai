-- Create user_settings table
create table if not exists public.user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade unique,
    nombre_cliente text,
    info_vehiculo text,
    historial_servicio text,
    ubicacion text,
    idioma text default 'es',
    nivel_tono integer default 3 check (nivel_tono between 1 and 5),
    nivel_tecnico integer default 3 check (nivel_tecnico between 1 and 5),
    longitud_respuesta integer default 3 check (longitud_respuesta between 1 and 5),
    nivel_urgencia boolean default false,
    sensibilidad_precio integer default 3 check (sensibilidad_precio between 1 and 5),
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

-- Create RLS policies
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

-- Create function to get user settings
create or replace function public.get_user_settings()
returns table (
    id uuid,
    nombre_cliente text,
    info_vehiculo text,
    historial_servicio text,
    ubicacion text,
    idioma text,
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
        s.nombre_cliente,
        s.info_vehiculo,
        s.historial_servicio,
        s.ubicacion,
        s.idioma,
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