-- Function to insert default prompts for a user
CREATE OR REPLACE FUNCTION insert_default_prompts(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prompt para Análisis de Código
    INSERT INTO prompts (user_id, name, content, is_default)
    VALUES (
        user_id,
        'Análisis de Código',
        'Por favor, analiza el siguiente código siguiendo estos pasos:

1. Revisión General:
   - Estructura y organización
   - Patrones de diseño utilizados
   - Convenciones de nomenclatura

2. Análisis de Calidad:
   - Complejidad ciclomática
   - Duplicación de código
   - Manejo de errores
   - Seguridad

3. Mejoras Potenciales:
   - Optimización de rendimiento
   - Refactorización sugerida
   - Mejores prácticas
   - Patrones alternativos

4. Documentación:
   - Claridad del código
   - Comentarios necesarios
   - Documentación técnica

Por favor, proporciona el código que deseas analizar.',
        true
    );

    -- Prompt para Revisión de Seguridad
    INSERT INTO prompts (user_id, name, content, is_default)
    VALUES (
        user_id,
        'Revisión de Seguridad',
        'Realizaré una revisión de seguridad siguiendo estos pasos:

1. Análisis de Vulnerabilidades:
   - Inyección SQL
   - XSS (Cross-Site Scripting)
   - CSRF (Cross-Site Request Forgery)
   - Autenticación y Autorización

2. Revisión de Configuración:
   - Headers de seguridad
   - Configuración de CORS
   - Manejo de sesiones
   - Almacenamiento seguro

3. Mejores Prácticas:
   - Validación de entrada
   - Sanitización de datos
   - Control de acceso
   - Logging y monitoreo

4. Recomendaciones:
   - Correcciones prioritarias
   - Mejoras sugeridas
   - Herramientas de seguridad
   - Pruebas de penetración

Por favor, proporciona el código o configuración que deseas revisar.',
        true
    );

    -- Prompt para Optimización de Rendimiento
    INSERT INTO prompts (user_id, name, content, is_default)
    VALUES (
        user_id,
        'Optimización de Rendimiento',
        'Analizaré el rendimiento siguiendo estos pasos:

1. Análisis de Rendimiento:
   - Tiempo de carga
   - Uso de memoria
   - Complejidad algorítmica
   - Consultas a base de datos

2. Identificación de Cuellos de Botella:
   - Operaciones costosas
   - Recursos limitados
   - Concurrencia
   - Caché

3. Optimizaciones Sugeridas:
   - Mejoras de código
   - Estrategias de caché
   - Indexación
   - Paralelización

4. Monitoreo y Métricas:
   - KPIs importantes
   - Herramientas de profiling
   - Alertas y umbrales
   - Plan de seguimiento

Por favor, proporciona el código o sistema que deseas optimizar.',
        true
    );

    -- Prompt para Arquitectura de Software
    INSERT INTO prompts (user_id, name, content, is_default)
    VALUES (
        user_id,
        'Arquitectura de Software',
        'Analizaré la arquitectura siguiendo estos pasos:

1. Análisis de Requisitos:
   - Requisitos funcionales
   - Requisitos no funcionales
   - Restricciones técnicas
   - Casos de uso

2. Diseño Arquitectónico:
   - Patrones arquitectónicos
   - Componentes principales
   - Interfaces y contratos
   - Flujo de datos

3. Evaluación:
   - Escalabilidad
   - Mantenibilidad
   - Seguridad
   - Rendimiento

4. Documentación:
   - Diagramas
   - Decisiones técnicas
   - Trade-offs
   - Guía de implementación

Por favor, describe el sistema que deseas diseñar o analizar.',
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