import { NextResponse } from 'next/server';

import { getUserRole } from '@/db/cached-queries';

export async function GET() {
  try {
    const role = await getUserRole();
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error getting user role:', error);
    return NextResponse.json({ role: 'user' }, { status: 500 });
  }
}
