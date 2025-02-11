-- Habilitar RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can view default prompts" ON public.prompts;

-- Crear políticas de seguridad
CREATE POLICY "Users can view own prompts" ON public.prompts
    FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR 
        is_default = true
    );

CREATE POLICY "Users can create own prompts" ON public.prompts
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE 
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE 
    USING (
        auth.uid() = user_id
    ); 