// ============================================================
// PROGRAM INTELLIGENCE CACHE
// Check/save extraction results per program per cycle.
// Same program = instant result for all users.
//
// Created: 2026-04-09
// ============================================================

import prisma from '@/lib/prisma';
import { type SmartExtractResult } from './smart-extract';

// Check if we already have a cached extraction for this program
export async function checkCache(
  schoolSlug: string,
  programSlug: string,
  cycle: string,
): Promise<SmartExtractResult | null> {
  try {
    const cached = await prisma.programIntelligence.findUnique({
      where: {
        schoolSlug_programSlug_cycle: {
          schoolSlug,
          programSlug,
          cycle,
        },
      },
    });

    if (!cached) return null;

    // Check freshness — re-extract if older than 30 days
    const age = Date.now() - cached.updatedAt.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (age > thirtyDays) return null;

    const data = cached.data as any;
    return {
      program: data.program,
      crawledPages: data.crawledPages || [],
      confidence: cached.confidence,
      missingFields: data.missingFields || [],
      warnings: (cached.warnings as string[]) || [],
      processingTime: 0, // cached = instant
      schoolSlug: cached.schoolSlug,
      programSlug: cached.programSlug,
      cycle: cached.cycle,
    };
  } catch (e) {
    // Cache miss is not an error — just extract fresh
    console.error('Cache check failed:', e);
    return null;
  }
}

// Save extraction result to cache
export async function saveCache(result: SmartExtractResult): Promise<void> {
  try {
    await prisma.programIntelligence.upsert({
      where: {
        schoolSlug_programSlug_cycle: {
          schoolSlug: result.schoolSlug,
          programSlug: result.programSlug,
          cycle: result.cycle,
        },
      },
      update: {
        data: JSON.parse(JSON.stringify({
          program: result.program,
          crawledPages: result.crawledPages,
          missingFields: result.missingFields,
        })),
        confidence: result.confidence,
        warnings: result.warnings,
        sourceUrls: result.program.sourceUrls || [],
        extractedAt: new Date(),
      },
      create: {
        schoolSlug: result.schoolSlug,
        programSlug: result.programSlug,
        cycle: result.cycle,
        data: JSON.parse(JSON.stringify({
          program: result.program,
          crawledPages: result.crawledPages,
          missingFields: result.missingFields,
        })),
        confidence: result.confidence,
        warnings: result.warnings,
        sourceUrls: result.program.sourceUrls || [],
        extractedAt: new Date(),
      },
    });
  } catch (e) {
    // Cache save failure should not break the user flow
    console.error('Cache save failed:', e);
  }
}
