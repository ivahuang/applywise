// GET /api/programs/search?q=mit+finance
// Searches the shared program library. No auth required.

import { NextRequest } from 'next/server';
import { searchPrograms } from '@/lib/extract/cache';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return Response.json({ results: [] });
  }

  const results = await searchPrograms(q.trim(), 10);

  // Return simplified results for the search UI
  const simplified = results.map(r => ({
    id: r.id,
    schoolName: r.schoolName,
    schoolNameZh: r.schoolNameZh,
    programName: r.programName,
    programNameZh: r.programNameZh,
    degree: r.degree,
    field: r.field,
    confidence: r.confidence,
    extractedAt: r.extractedAt,
    cycle: r.cycle,
  }));

  return Response.json({ results: simplified });
}
