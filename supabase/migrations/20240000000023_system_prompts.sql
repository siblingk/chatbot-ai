-- Eliminar prompts del sistema existentes
DELETE FROM prompts WHERE user_id IS NULL;

-- Insertar prompts del sistema
INSERT INTO prompts (user_id, name, content, is_default, created_at, updated_at)
VALUES 
    (
        NULL,
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
        true,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    ),
    (
        NULL,
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
        true,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    ),
    (
        NULL,
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
        true,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    ),
    (
        NULL,
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
        true,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    ); 