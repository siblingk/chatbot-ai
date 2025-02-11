-- Paso 1: Modificar la tabla prompts para permitir user_id NULL
DO $$ 
BEGIN
    -- Solo intentar modificar la columna si aún es NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'prompts'
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.prompts ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;

-- Paso 2: Actualizar las políticas RLS para manejar el caso del prompt del sistema
DROP POLICY IF EXISTS "Users can view own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can view prompts" ON public.prompts;

-- Paso 3: Crear nuevas políticas que incluyan el manejo del prompt del sistema
CREATE POLICY "Users can view prompts" ON public.prompts
    FOR SELECT USING (
        auth.uid() = user_id -- Prompts del usuario
        OR 
        user_id IS NULL -- Prompts del sistema
    );

CREATE POLICY "Users can create own prompts" ON public.prompts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id -- Solo pueden crear prompts asociados a su usuario
        OR 
        (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') AND user_id IS NULL) -- Admins pueden crear prompts del sistema
    );

CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE USING (
        auth.uid() = user_id -- Solo pueden actualizar sus propios prompts
        OR 
        (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') AND user_id IS NULL) -- Admins pueden actualizar prompts del sistema
    );

CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE USING (
        auth.uid() = user_id -- Solo pueden eliminar sus propios prompts
        OR 
        (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') AND user_id IS NULL) -- Admins pueden eliminar prompts del sistema
    );

-- Paso 4: Insertar el prompt predeterminado del sistema si no existe
DO $$ 
BEGIN
    -- Solo insertar si no existe un prompt del sistema predeterminado
    IF NOT EXISTS (
        SELECT 1 FROM public.prompts 
        WHERE user_id IS NULL AND is_default = true
    ) THEN
        INSERT INTO prompts (id, user_id, name, content, is_default, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            NULL, -- Prompt del sistema
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