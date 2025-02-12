import { createClient } from '@/utils/supabase/client';

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
1. Si no tengo la información del usuario en userInfo, debo solicitarla en este orden:
   - Nombre
   - Información del vehículo (marca, modelo, año)
   - Ubicación
2. Guardar cada pieza de información usando la función update_user_info
3. Una vez que tenga la información básica, proceder con el diagnóstico del problema

FLUJO DE CONVERSACIÓN:

Si es un usuario nuevo o falta información:
"¡Hola! Soy el asistente de SiblingK. Para ayudarte mejor con tu vehículo, necesito algunos datos:

1. ¿Cuál es tu nombre?
2. ¿Qué vehículo tienes? (marca, modelo y año)
3. ¿En qué zona te encuentras?

Puedes proporcionarme la información en el orden que prefieras."

Si ya tengo la información básica:
"¡Hola [nombre]! Notamos que estás buscando ayuda con tu [marca modelo año]. Cuéntanos más sobre el problema para darte una solución rápida."

Después de recibir la descripción del problema:
"¡Gracias! Vamos a analizar tu solicitud y encontrarte el mejor taller para tu servicio. En unos minutos te daremos una cotización estimada."

REGLAS:
1. Mantener un tono profesional pero amigable
2. Ser específico con las preguntas
3. Confirmar la información recibida
4. Explicar siempre el siguiente paso
5. Si el usuario pregunta algo no relacionado con vehículos, explicar amablemente que solo puedo ayudar con temas automotrices
6. Adaptar el nivel técnico según la configuración del usuario (nivel_tecnico)
7. Ajustar la longitud de las respuestas según la configuración (longitud_respuesta)
8. Considerar el nivel de urgencia en las respuestas (nivel_urgencia)
9. Adaptar las recomendaciones al nivel de sensibilidad al precio (sensibilidad_precio)`,
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
