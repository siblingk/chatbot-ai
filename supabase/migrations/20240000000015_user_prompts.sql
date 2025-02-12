-- Drop table if exists (to avoid conflicts)
DROP TABLE IF EXISTS public.prompts;

-- Create Prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;

-- Create RLS policies
CREATE POLICY "Users can view prompts" ON public.prompts
    FOR SELECT USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                user_id = auth.uid() OR user_id IS NULL
            ELSE FALSE
        END
    );

CREATE POLICY "Users can create own prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_prompts();

-- Create function to get user's prompts
CREATE OR REPLACE FUNCTION get_user_prompts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    content TEXT,
    is_default BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obtener el ID del usuario actual
    current_user_id := auth.uid();
    
    -- Verificar que el usuario esté autenticado
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.id, p.name, p.content, p.is_default, p.created_at, p.updated_at, p.user_id
    FROM prompts p
    WHERE p.user_id = current_user_id OR p.user_id IS NULL
    ORDER BY 
        CASE WHEN p.user_id IS NULL THEN 1 ELSE 0 END, -- Primero los prompts del usuario
        p.created_at DESC;
END;
$$;

-- Eliminar la tabla de votos si existe
DROP TABLE IF EXISTS votes;

-- Crear la tabla de prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices
CREATE INDEX prompts_user_id_idx ON prompts(user_id);
CREATE INDEX prompts_is_default_idx ON prompts(is_default);

-- Función para obtener los prompts del usuario
CREATE OR REPLACE FUNCTION get_user_prompts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  content TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.content, p.is_default, p.created_at, p.updated_at, p.user_id
  FROM prompts p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC;
END;
$$; 