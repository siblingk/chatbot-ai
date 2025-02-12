create table if not exists public.quotes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    vehicle_make text,
    vehicle_model text,
    vehicle_year integer,
    problem_description text,
    ai_analysis text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.quotes enable row level security;

-- Create policy to allow users to read their own quotes
create policy "Users can view their own quotes"
    on quotes for select
    using (auth.uid() = user_id);

-- Create policy to allow users to insert their own quotes
create policy "Users can create their own quotes"
    on quotes for insert
    with check (auth.uid() = user_id);

-- Set up realtime
alter publication supabase_realtime add table quotes; 