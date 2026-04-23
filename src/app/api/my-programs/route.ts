// GET /api/my-programs — list user's applications with full program data
// POST /api/my-programs — add a program to user's list

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { extractedToProgram } from '@/lib/extract/bridge';
import { generateTasks } from '@/lib/tasks';

export async function GET() {
  try {
    const user = await requireAuth();

    const applications = await prisma.userApplication.findMany({
      where: { userId: user.id },
      include: {
        program: {
          select: {
            id: true,
            schoolName: true,
            schoolNameZh: true,
            programName: true,
            programNameZh: true,
            degree: true,
            field: true,
            confidence: true,
            extractedAt: true,
            data: true,
            sourceUrls: true,
            cycle: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    // Merge program data with user's application data
    const result = applications.map(app => {
      const programData = (app.program.data as any)?.program || app.program.data;
      return {
        // Application ID (for updates/deletes)
        applicationId: app.id,
        // Program identity (from shared library)
        programIntelligenceId: app.program.id,
        schoolName: app.program.schoolName,
        schoolNameZh: app.program.schoolNameZh,
        programName: app.program.programName,
        programNameZh: app.program.programNameZh,
        degree: app.program.degree,
        field: app.program.field,
        confidence: app.program.confidence,
        extractedAt: app.program.extractedAt,
        cycle: app.program.cycle,
        // Full extracted data for detail page
        extractedData: programData,
        // User-specific data
        tier: app.tier,
        status: app.status,
        tasksState: app.tasksState,
        notes: app.notes,
        result: app.result,
        addedAt: app.addedAt,
      };
    });

    return Response.json({ programs: result });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'Unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('GET /api/my-programs error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { programIntelligenceId, tier = 'target' } = await req.json();

    if (!programIntelligenceId) {
      return Response.json({ error: 'programIntelligenceId is required' }, { status: 400 });
    }

    // Check program exists
    const program = await prisma.programIntelligence.findUnique({
      where: { id: programIntelligenceId },
    });
    if (!program) {
      return Response.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if already added
    const existing = await prisma.userApplication.findUnique({
      where: {
        userId_programIntelligenceId: {
          userId: user.id,
          programIntelligenceId,
        },
      },
    });
    if (existing) {
      return Response.json({ error: 'Program already in your list', applicationId: existing.id }, { status: 409 });
    }

    // Generate initial task state from extracted data
    const programData = (program.data as any)?.program || program.data;
    let tasksState = {};
    try {
      const bridged = extractedToProgram(programData) as any;
      tasksState = generateTasks(bridged);
    } catch (e) {
      console.error('Task generation failed:', e);
      tasksState = { tasks: [], stages: [] };
    }

    // Create application
    const application = await prisma.userApplication.create({
      data: {
        userId: user.id,
        programIntelligenceId,
        tier,
        tasksState: JSON.parse(JSON.stringify(tasksState)),
      },
    });

    return Response.json({
      applicationId: application.id,
      programIntelligenceId,
      tier,
    }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'Unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('POST /api/my-programs error:', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
