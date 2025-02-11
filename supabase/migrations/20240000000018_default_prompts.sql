-- Function to insert default prompts for a user
CREATE OR REPLACE FUNCTION insert_default_prompts(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prompt para Chat General
    INSERT INTO prompts (user_id, name, content, is_default)
    VALUES (
        user_id,
        'Chat General',
        'Soy un asistente virtual diseñado para ayudarte con cualquier tarea o consulta. Por favor, dime en qué puedo ayudarte hoy.',
        true
    );

    -- Prompt para Asistente de Código
    INSERT INTO prompts (user_id, name, content, is_default)
    VALUES (
        user_id,
        'Asistente de Código',
        'Soy tu asistente de programación. Puedo ayudarte con:

1. Desarrollo de código
2. Depuración de problemas
3. Revisión de código
4. Explicación de conceptos
5. Mejores prácticas

¿En qué puedo ayudarte hoy?',
        true
    );
END;
$$;

-- Trigger function to insert default prompts for new users
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    
    -- Insert default prompts for the new user
    PERFORM insert_default_prompts(NEW.id);
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION on_auth_user_created(); 