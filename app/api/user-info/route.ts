import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    const { data: userInfo, error } = await supabase.rpc('get_user_info');

    if (error) {
      console.error('Error fetching user info:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(userInfo || {});
  } catch (error) {
    console.error('Error in GET /api/user-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    const userData = await request.json();

    const { data: updatedInfo, error } = await supabase.rpc(
      'update_user_info',
      {
        p_data: userData,
      }
    );

    if (error) {
      console.error('Error updating user info:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedInfo || {});
  } catch (error) {
    console.error('Error in PUT /api/user-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
