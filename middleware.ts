import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Primero actualizamos la sesión
  const response = await updateSession(request);

  // Proteger la ruta /config
  if (request.nextUrl.pathname.startsWith('/config')) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .single();

      if (error || !data || data.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
