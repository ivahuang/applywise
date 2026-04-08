import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/supabase/server'

const prisma = new PrismaClient()

// GET: list user's atoms
export async function GET() {
  try {
    const user = await requireAuth()
    const atoms = await prisma.atom.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(atoms)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Load atoms error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// POST: create atom(s)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    // Support single atom or array
    const atomsData = Array.isArray(body) ? body : [body]

    const created = await Promise.all(
      atomsData.map((a: any) =>
        prisma.atom.create({
          data: {
            userId: user.id,
            content: a.content,
            summary: a.summary || null,
            contentEn: a.contentEn || null,
            category: a.category || 'personal',
            abilityTags: a.abilityTags || [],
            qualityTags: a.qualityTags || [],
            keywords: a.keywords || [],
            source: a.source || 'manual',
            sourceId: a.sourceId || null,
            timeframe: a.timeframe || null,
            dimensionScores: a.dimensionScores || null,
          }
        })
      )
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create atom error:', error)
    return NextResponse.json({ error: 'Failed to create atom' }, { status: 500 })
  }
}
