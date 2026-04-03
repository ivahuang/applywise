import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'

const prisma = new PrismaClient()

// GET: list user's applications
export async function GET() {
  try {
    const user = await requireAuth()

    const applications = await prisma.userApplication.findMany({
      where: { userId: user.id },
      include: {
        program: { include: { school: true } }
      },
      orderBy: { addedAt: 'asc' }
    })

    return NextResponse.json(applications)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST: add a program to user's list
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { programId, tier = 'target' } = body

    if (!programId) {
      return NextResponse.json({ error: 'programId required' }, { status: 400 })
    }

    const existing = await prisma.userApplication.findUnique({
      where: { userId_programId: { userId: user.id, programId } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Program already in your list' }, { status: 409 })
    }

    const application = await prisma.userApplication.create({
      data: {
        userId: user.id,
        programId,
        tier,
        tasksState: {},
      },
      include: {
        program: { include: { school: true } }
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'Failed to add program' }, { status: 500 })
  }
}
