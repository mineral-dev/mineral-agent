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
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const payload = body?.data ?? body;
    const task = create(payload);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    const message = err.message || 'Failed to create task';
    const status = message.includes('required') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
