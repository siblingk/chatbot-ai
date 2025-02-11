-- Eliminar la función existente
DROP FUNCTION IF EXISTS get_user_prompts();

-- Crear la nueva función get_user_prompts
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
    
    -- Log para depuración
    RAISE NOTICE 'get_user_prompts ejecutándose para el usuario: %', current_user_id;
    
    -- Contar prompts antes de filtrar
    RAISE NOTICE 'Total de prompts en la tabla: %', (SELECT COUNT(*) FROM prompts);
    
    -- Contar prompts del usuario
    RAISE NOTICE 'Prompts del usuario: %', (
        SELECT COUNT(*) 
        FROM prompts 
        WHERE user_id = current_user_id
    );
    
    -- Contar prompts del sistema
    RAISE NOTICE 'Prompts del sistema: %', (
        SELECT COUNT(*) 
        FROM prompts 
        WHERE user_id IS NULL
    );

    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.content, 
        p.is_default, 
        p.created_at, 
        p.updated_at,
        p.user_id
    FROM prompts p
    WHERE p.user_id = current_user_id OR p.user_id IS NULL
    ORDER BY p.created_at DESC;

    -- Log del resultado
    RAISE NOTICE 'Consulta completada';
END;
$$;

-- Actualizar las políticas RLS
DROP POLICY IF EXISTS "Users can view prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;

-- Recrear las políticas
CREATE POLICY "Users can view prompts" ON public.prompts
    FOR SELECT USING (
        auth.uid() = user_id -- Prompts del usuario
        OR 
        user_id IS NULL -- Prompts del sistema
    );

CREATE POLICY "Users can create own prompts" ON public.prompts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id -- Solo pueden crear prompts asociados a su usuario
    );

CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE USING (
        auth.uid() = user_id -- Solo pueden actualizar sus propios prompts
    );

CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE USING (
        auth.uid() = user_id -- Solo pueden eliminar sus propios prompts
    );

-- Asegurarse de que existe el prompt del sistema
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.prompts 
        WHERE user_id IS NULL AND is_default = true
    ) THEN
        INSERT INTO prompts (id, user_id, name, content, is_default, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            NULL,
            'SiblingK Bot',
            'I am SiblingK Bot, your automotive service coordinator from SiblingK. I help connect car owners with reliable auto repair shops to get the best service quotes. I can only assist with automotive-related inquiries and vehicle services. Let me assist you step by step:

1. First, may I know your name?
2. Once you share your name, I''ll ask for your contact number to keep you updated.
3. Then, I''ll need your vehicle information (make, model, and year).
4. Finally, please describe the issue you''re experiencing with your vehicle.

If at any point you provide multiple pieces of information at once, I''ll acknowledge them and ask only for the missing details. For questions unrelated to automotive services, repairs, or vehicle maintenance, I''ll need to politely decline as I''m specifically designed to help with vehicle-related matters. After collecting all relevant details, I''ll summarize them and explain the next steps in getting your service quotes.',
            true,
            TIMEZONE('utc', NOW()),
            TIMEZONE('utc', NOW())
        );
    END IF;
END $$; 