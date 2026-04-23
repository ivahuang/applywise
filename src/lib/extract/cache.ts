// ============================================================
// PROGRAM INTELLIGENCE CACHE
// Shared program library. One extraction serves all users.
// Now saves searchable fields for unified search.
// 2026-04-22
// ============================================================

import prisma from '@/lib/prisma';
import { type SmartExtractResult } from './smart-extract';

export async function checkCache(
  schoolSlug: string,
  programSlug: string,
  cycle: string,
): Promise<SmartExtractResult | null> {
  try {
    const cached = await prisma.programIntelligence.findUnique({
      where: {
        schoolSlug_programSlug_cycle: { schoolSlug, programSlug, cycle },
      },
    });

    if (!cached) return null;

    // Re-extract if older than 30 days
    const age = Date.now() - cached.updatedAt.getTime();
    if (age > 30 * 24 * 60 * 60 * 1000) return null;

    const data = cached.data as any;
    return {
      program: data.program || data,
      crawledPages: data.crawledPages || [],
      confidence: cached.confidence,
      missingFields: data.missingFields || [],
      warnings: (cached.warnings as string[]) || [],
      processingTime: 0,
      schoolSlug: cached.schoolSlug,
      programSlug: cached.programSlug,
      cycle: cached.cycle,
    };
  } catch (e) {
    console.error('Cache check failed:', e);
    return null;
  }
}

export async function saveCache(result: SmartExtractResult, inputUrl?: string): Promise<string | null> {
  try {
    const record = await prisma.programIntelligence.upsert({
      where: {
        schoolSlug_programSlug_cycle: {
          schoolSlug: result.schoolSlug,
          programSlug: result.programSlug,
          cycle: result.cycle,
        },
      },
      update: {
        schoolName: result.program.schoolName || 'Unknown',
        schoolNameZh: result.program.schoolNameZh || null,
        programName: result.program.programName || 'Unknown',
        programNameZh: result.program.programNameZh || null,
        degree: result.program.degree || null,
        field: result.program.field || null,
        data: JSON.parse(JSON.stringify({
          program: result.program,
          crawledPages: result.crawledPages,
          missingFields: result.missingFields,
        })),
        confidence: result.confidence,
        warnings: result.warnings,
        sourceUrls: result.program.sourceUrls || [],
        inputUrl: inputUrl || result.program.programUrl || null,
        crawlDuration: result.processingTime,
        extractedAt: new Date(),
      },
      create: {
        schoolSlug: result.schoolSlug,
        programSlug: result.programSlug,
        cycle: result.cycle,
        schoolName: result.program.schoolName || 'Unknown',
        schoolNameZh: result.program.schoolNameZh || null,
        programName: result.program.programName || 'Unknown',
        programNameZh: result.program.programNameZh || null,
        degree: result.program.degree || null,
        field: result.program.field || null,
        data: JSON.parse(JSON.stringify({
          program: result.program,
          crawledPages: result.crawledPages,
          missingFields: result.missingFields,
        })),
        confidence: result.confidence,
        warnings: result.warnings,
        sourceUrls: result.program.sourceUrls || [],
        inputUrl: inputUrl || result.program.programUrl || null,
        crawlDuration: result.processingTime,
        extractedAt: new Date(),
      },
    });
    return record.id;
  } catch (e) {
    console.error('Cache save failed:', e);
    return null;
  }
}

// Search the shared program library
export async function searchPrograms(query: string, limit = 10) {
  try {
    const results = await prisma.programIntelligence.findMany({
      where: {
        isDeleted: false,
        OR: [
          { schoolName: { contains: query, mode: 'insensitive' } },
          { programName: { contains: query, mode: 'insensitive' } },
          { schoolNameZh: { contains: query, mode: 'insensitive' } },
          { programNameZh: { contains: query, mode: 'insensitive' } },
          { schoolSlug: { contains: query.toLowerCase() } },
          { degree: { contains: query, mode: 'insensitive' } },
          { field: { contains: query, mode: 'insensitive' } },
        ],
      },
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
        cycle: true,
        data: true,
      },
      orderBy: { confidence: 'desc' },
      take: limit,
    });
    return results;
  } catch (e) {
    console.error('Program search failed:', e);
    return [];
  }
}
