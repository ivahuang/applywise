import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'

const prisma = new PrismaClient()

// PATCH: update tier, status, tasksState, notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const app = await prisma.userApplication.findUnique({ where: { id } })
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const allowedFields: Record<string, any> = {}
    if (body.tier) allowedFields.tier = body.tier
    if (body.status) allowedFields.status = body.status
    if (body.tasksState !== undefined) allowedFields.tasksState = body.tasksState
    if (body.notes !== undefined) allowedFields.notes = body.notes

    const updated = await prisma.userApplication.update({
      where: { id },
      data: allowedFields,
      include: { program: { include: { school: true } } }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE: remove application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const app = await prisma.userApplication.findUnique({ where: { id } })
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.userApplication.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete application error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
