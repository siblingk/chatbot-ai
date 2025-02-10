import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { defaultConfig } from '@/ai/prompts';
import { Database } from '@/lib/supabase/types';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(defaultConfig);
    }

    if (!session) {
      return NextResponse.json(defaultConfig);
    }

    // Verificar si el usuario es admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('User error:', userError);
      return NextResponse.json(defaultConfig);
    }

    if (!user || user.role !== 'admin') {
      return NextResponse.json(defaultConfig);
    }

    // Obtener la configuración activa
    const { data: config, error: configError } = await supabase
      .from('prompt_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('Config error:', configError);
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(config || defaultConfig);
  } catch (error) {
    console.error('Error in GET /api/admin/prompt-config:', error);
    return NextResponse.json(defaultConfig);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verificar si el usuario es admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    // Si la nueva configuración está activa, desactivar todas las demás
    if (body.is_active) {
      await supabase
        .from('prompt_config')
        .update({ is_active: false })
        .neq('id', body.id || '0');
    }

    // Insertar o actualizar la configuración
    const { data, error } = await supabase
      .from('prompt_config')
      .upsert({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving prompt config:', error);
      return new NextResponse('Error saving config', { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/prompt-config:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
