import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { DEFAULT_PROMPTS } from '@/ai/prompts';

export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    // Obtener las configuraciones del usuario
    const { data: userSettings } = await supabase.rpc('get_user_settings');
    const settings = userSettings?.[0];

    // Usar el prompt por defecto del sistema
    const systemPrompt = {
      ...DEFAULT_PROMPTS.regular,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
    };

    // Construir el prompt base con las configuraciones del usuario
    let basePrompt = systemPrompt.content;

    if (settings) {
      // Agregar información del usuario si está disponible
      const userInfo = [];
      if (settings.nombre_cliente)
        userInfo.push(`Nombre del cliente: ${settings.nombre_cliente}`);
      if (settings.info_vehiculo)
        userInfo.push(`Vehículo: ${settings.info_vehiculo}`);
      if (settings.historial_servicio)
        userInfo.push(`Historial de servicio: ${settings.historial_servicio}`);
      if (settings.ubicacion) userInfo.push(`Ubicación: ${settings.ubicacion}`);

      if (userInfo.length > 0) {
        basePrompt += '\n\nInformación del Usuario:\n' + userInfo.join('\n');
      }

      // Agregar configuraciones de comportamiento
      basePrompt += '\n\nPreferencias de Interacción:';
      basePrompt += `\n- Nivel de tono: ${settings.nivel_tono}/5 (${settings.nivel_tono <= 2 ? 'casual' : settings.nivel_tono >= 4 ? 'muy profesional' : 'profesional moderado'})`;
      basePrompt += `\n- Nivel técnico: ${settings.nivel_tecnico}/5 (${settings.nivel_tecnico <= 2 ? 'básico' : settings.nivel_tecnico >= 4 ? 'muy detallado' : 'moderadamente técnico'})`;
      basePrompt += `\n- Longitud de respuesta: ${settings.longitud_respuesta}/5 (${settings.longitud_respuesta <= 2 ? 'concisa' : settings.longitud_respuesta >= 4 ? 'muy detallada' : 'moderadamente detallada'})`;
      basePrompt += `\n- Sensibilidad al precio: ${settings.sensibilidad_precio}/5 (${settings.sensibilidad_precio <= 2 ? 'enfoque en economía' : settings.sensibilidad_precio >= 4 ? 'enfoque en calidad premium' : 'balance calidad-precio'})`;
      if (settings.nivel_urgencia) {
        basePrompt +=
          '\n- Manejo prioritario: Las respuestas deben ser rápidas y enfocadas en soluciones inmediatas';
      }
    }

    // Obtener el prompt personalizado del usuario
    const { data: userPrompts, error: userPromptError } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .order('created_at', { ascending: false });

    console.log('User Prompts Query:', {
      userPrompts,
      userPromptError,
      userId: user.id,
      count: userPrompts?.length,
    });

    // Si hay un prompt personalizado activo, fusionarlo con el del sistema
    if (userPrompts && userPrompts.length > 0) {
      // Usar el prompt del usuario más reciente
      const userPrompt = userPrompts[0];
      const mergedPrompt = {
        ...systemPrompt,
        content: `${basePrompt}\n\nInstrucciones personalizadas:\n${userPrompt.content}`,
        name: `${systemPrompt.name} + ${userPrompt.name}`,
      };
      return NextResponse.json(mergedPrompt);
    }

    // Si no hay prompt personalizado, usar solo el del sistema con las configuraciones
    return NextResponse.json({
      ...systemPrompt,
      content: basePrompt,
    });
  } catch (error) {
    console.error('Error in GET /api/prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { promptId } = await request.json();

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener el usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    // Obtener el prompt que se va a activar para verificar si es del usuario
    const { data: promptToActivate } = await supabase
      .from('prompts')
      .select('user_id')
      .eq('id', promptId)
      .single();

    // Solo permitir activar prompts del usuario
    if (promptToActivate && promptToActivate.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No puedes activar prompts que no te pertenecen' },
        { status: 403 }
      );
    }

    console.log('Desactivando prompts anteriores del usuario:', user.id);

    // Desactivar todos los prompts del usuario
    const { error: updateError } = await supabase
      .from('prompts')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating prompts:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('Activando nuevo prompt:', promptId);

    // Activar el prompt seleccionado
    const { error: setDefaultError } = await supabase
      .from('prompts')
      .update({ is_default: true })
      .eq('id', promptId);

    if (setDefaultError) {
      console.error('Error setting default prompt:', setDefaultError);
      return NextResponse.json(
        { error: setDefaultError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
