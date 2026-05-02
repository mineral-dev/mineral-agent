import { NextResponse } from 'next/server';
import { getAll, create } from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json({ data: getAll() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const task = create(body.data || body);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create task' }, { status: 500 });
  }
}
