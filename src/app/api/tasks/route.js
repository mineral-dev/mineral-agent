import { NextResponse } from 'next/server';
import { getAll, create } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await getAll();
    return NextResponse.json({ data: tasks });
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const payload = body?.data ?? body;
    const task = await create(payload);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    const message = err.message || 'Failed to create task';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
