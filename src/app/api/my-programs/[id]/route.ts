// PATCH /api/my-programs/[id] — update tier, status, tasksState, notes
// DELETE /api/my-programs/[id] — remove from user's list

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const app = await prisma.userApplication.findUnique({ where: { id } });
    if (!app || app.userId !== user.id) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Build update object — only include fields that were sent
    const update: any = {};
    if (body.tier !== undefined) update.tier = body.tier;
    if (body.status !== undefined) update.status = body.status;
    if (body.tasksState !== undefined) update.tasksState = JSON.parse(JSON.stringify(body.tasksState));
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.result !== undefined) update.result = body.result;

    const updated = await prisma.userApplication.update({
      where: { id },
      data: update,
    });

    return Response.json({ applicationId: updated.id, ...update });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'Unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('PATCH /api/my-programs/[id] error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const app = await prisma.userApplication.findUnique({ where: { id } });
    if (!app || app.userId !== user.id) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.userApplication.delete({ where: { id } });

    return Response.json({ deleted: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'Unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('DELETE /api/my-programs/[id] error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
