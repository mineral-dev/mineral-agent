import { NextResponse } from 'next/server';
import { getById, update, move, remove } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const task = await getById(Number(id));
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ data: task });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = body?.data ?? body;
    const task = await update(Number(id), data || {});
    return NextResponse.json({ data: task });
  } catch (err) {
    console.error('PUT /api/tasks/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = body?.data ?? body;
    const result = await move(Number(id), data || {});
    return NextResponse.json({ data: result.task, tasks: result.tasks });
  } catch (err) {
    console.error('PATCH /api/tasks/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await remove(Number(id));
    return NextResponse.json({ data: null });
  } catch (err) {
    console.error('DELETE /api/tasks/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
