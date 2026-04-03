// src/app/api/user-apps/route.ts
// GET: load user's apps array
// PUT: save user's apps array

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const user = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { appsData: true }
    })

    return NextResponse.json(dbUser?.appsData ?? [])
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Load apps error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const apps = await request.json()

    await prisma.user.update({
      where: { id: user.id },
      data: { appsData: apps }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Save apps error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
