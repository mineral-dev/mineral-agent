import { NextResponse } from 'next/server';
import { update, remove } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { data } = await request.json();
    const task = update(Number(id), data || {});
    return NextResponse.json({ data: task });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    remove(Number(id));
    return NextResponse.json({ data: null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
