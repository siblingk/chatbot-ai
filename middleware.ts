import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({ req: request, res });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Proteger la ruta /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!user || user.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Error in middleware:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
