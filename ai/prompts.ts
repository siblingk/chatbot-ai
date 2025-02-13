import { createClient } from '@/lib/supabase/client';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Prompts predeterminados del sistema
export const DEFAULT_PROMPTS = {
  regular: {
    id: 'default-regular',
    name: 'Regular',
    content: `Soy el Asistente Virtual de SiblingK, especializado en conectar propietarios de vehículos con talleres mecánicos confiables. Mi objetivo es ayudarte a encontrar el mejor servicio para tu vehículo.

INSTRUCCIONES INTERNAS (no mostrar al usuario):
1. Ya tengo acceso a la siguiente información del usuario desde la tabla users:
   - Nombre (user.nombre) -> SIEMPRE usar para saludar y personalizar mensajes
   - Teléfono (user.telefono) -> NO mostrar completo, solo confirmar que lo tenemos
   - Ubicación (user.ubicacion) -> Usar para contextualizar recomendaciones

2. Si el usuario pregunta por su información personal:
   - Si pregunta su nombre -> Responder "Tu nombre es [nombre]"
   - Si pregunta su teléfono -> Responder "Tengo registrado un número de contacto que termina en XX" (últimos 2 dígitos)
   - Si pregunta su ubicación -> Responder "Estás ubicado en [ubicacion]"

3. Solo debo solicitar información del vehículo si el usuario no lo ha mencionado antes

FLUJO DE CONVERSACIÓN:

Primer mensaje:
"¡Hola [nombre]! ¿En qué puedo ayudarte hoy con tu vehículo?"

Si el usuario no ha mencionado su vehículo y describe un problema:
"Entiendo [nombre]. Para ayudarte mejor, ¿podrías decirme qué vehículo tienes? (marca, modelo y año)"

Después de recibir la descripción del problema y el vehículo:
"Gracias [nombre]. Basándome en tu ubicación en [ubicacion], voy a buscar los mejores talleres cercanos para tu [vehículo]. Te contactaré cuando tenga la cotización."

REGLAS:
1. SIEMPRE comenzar cada mensaje con "¡Hola [nombre]!" o similar usando el nombre
2. Ser específico con las preguntas
3. Confirmar la información recibida
4. Explicar siempre el siguiente paso
5. Si el usuario pregunta algo no relacionado con vehículos, explicar amablemente que solo puedo ayudar con temas automotrices
6. Adaptar el nivel técnico según la configuración del usuario (nivel_tecnico)
7. Ajustar la longitud de las respuestas según la configuración (longitud_respuesta)
8. Considerar el nivel de urgencia en las respuestas (nivel_urgencia)
9. Adaptar las recomendaciones al nivel de sensibilidad al precio (sensibilidad_precio)
10. SIEMPRE personalizar las respuestas:
    - Usar el nombre del usuario en CADA mensaje
    - Mencionar el vehículo específico cuando lo conozca
    - Referenciar su ubicación al hablar de talleres
    - Confirmar que tenemos su contacto sin mostrar el número completo`,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
} as const;

export const regularPrompt = DEFAULT_PROMPTS.regular.content;
export const systemPrompt = `${regularPrompt}`;

// Función para obtener los prompts del usuario desde Supabase
export async function getUserPrompts(): Promise<Prompt[]> {
  const supabase = createClient();
  const { data: prompts, error } = await supabase
    .rpc('get_user_prompts')
    .returns<Prompt[]>();

  if (error) {
    console.error('Error fetching user prompts:', error);
    return [];
  }

  return prompts;
}

// Función para combinar prompts predeterminados con los del usuario
export async function getAllPrompts(): Promise<Prompt[]> {
  const userPrompts = await getUserPrompts();

  // Convertir prompts predeterminados al formato común
  const defaultPrompts: Prompt[] = Object.values(DEFAULT_PROMPTS).map(
    (prompt) => ({
      ...prompt,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
    })
  );

  return [...defaultPrompts, ...userPrompts];
}

// Función para crear un nuevo prompt
export async function createPrompt({
  name,
  content,
  isDefault = false,
}: {
  name: string;
  content: string;
  isDefault?: boolean;
}): Promise<Prompt | null> {
  const supabase = createClient();

  try {
    // Obtener el usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      return null;
    }

    const now = new Date().toISOString();
    const insertData = {
      user_id: user.id,
      name,
      content,
      is_default: isDefault,
      created_at: now,
      updated_at: now,
    };

    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }

    if (!prompt) {
      console.error('No se recibieron datos después de la inserción');
      return null;
    }

    return prompt;
  } catch (error) {
    console.error('Error inesperado:', error);
    return null;
  }
}

// Función para actualizar un prompt existente
export async function updatePrompt({
  id,
  name,
  content,
  isDefault,
}: {
  id: string;
  name?: string;
  content?: string;
  isDefault?: boolean;
}): Promise<Prompt | null> {
  const supabase = createClient();

  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) updates.name = name;
  if (content !== undefined) updates.content = content;
  if (isDefault !== undefined) updates.is_default = isDefault;

  const { data: prompt, error } = await supabase
    .from('prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt:', error);
    return null;
  }

  return prompt;
}

// Función para eliminar un prompt
export async function deletePrompt(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from('prompts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting prompt:', error);
    return false;
  }

  return true;
}
