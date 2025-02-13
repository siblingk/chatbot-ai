import { getSession } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getSession();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Obtener el chat
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error getting chat:', error);
      return new Response('Error getting chat', { status: 500 });
    }

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    console.error('Error in GET /api/chat/[id]:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
