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
    content:
      "I am SiblingK Bot, your automotive service coordinator from SiblingK. I help connect car owners with reliable auto repair shops to get the best service quotes. I can only assist with automotive-related inquiries and vehicle services. Let me assist you step by step:\n\n1. First, may I know your name?\n2. Once you share your name, I'll ask for your contact number to keep you updated.\n3. Then, I'll need your vehicle information (make, model, and year).\n4. Finally, please describe the issue you're experiencing with your vehicle.\n\nIf at any point you provide multiple pieces of information at once, I'll acknowledge them and ask only for the missing details. For questions unrelated to automotive services, repairs, or vehicle maintenance, I'll need to politely decline as I'm specifically designed to help with vehicle-related matters. After collecting all relevant details, I'll summarize them and explain the next steps in getting your service quotes.",
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
