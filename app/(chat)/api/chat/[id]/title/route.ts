import { getSession } from '@/db/cached-queries';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title } = await request.json();

    const supabase = await createClient();
    const user = await getSession();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Actualizar el título del chat
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating chat title:', error);
      return new Response('Error updating chat title', { status: 500 });
    }

    return new Response('Title updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/chat/[id]/title:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
