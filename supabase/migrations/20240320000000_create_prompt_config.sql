-- Create the prompt_config table
create table if not exists public.prompt_config (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    system_config jsonb not null,
    business_rules jsonb not null,
    is_active boolean default false not null,
    constraint system_config_check check (
        jsonb_typeof(system_config) = 'object'
        and (system_config->>'tone')::int between 1 and 5
        and (system_config->>'technicalDepth')::int between 1 and 5
        and (system_config->>'responseLength')::int between 1 and 5
        and (system_config->>'language') in ('"en"', '"es"')
        and (system_config->>'empathyLevel')::int between 1 and 5
        and (system_config->>'urgencyEmphasis')::int between 1 and 5
    ),
    constraint business_rules_check check (
        jsonb_typeof(business_rules) = 'object'
        and (business_rules->>'minQuoteAmount')::numeric >= 0
        and (business_rules->>'maxQuoteAmount')::numeric >= 0
        and (business_rules->>'warrantyPeriod')::numeric >= 0
        and (business_rules->>'maxShopOptions')::numeric between 1 and 10
        and (business_rules->>'priceRangeBuffer')::numeric between 0 and 100
    )
);

-- Create RLS policies
alter table public.prompt_config enable row level security;

create policy "Enable read access for all users"
    on public.prompt_config
    for select
    using (true);

create policy "Enable write access for admin users only"
    on public.prompt_config
    for all
    using (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updated_at
create trigger handle_updated_at
    before update on public.prompt_config
    for each row
    execute procedure public.handle_updated_at(); 