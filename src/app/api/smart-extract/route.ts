// POST /api/smart-extract
// Extracts program data from .edu URL or keyword.
// Checks cache first → if hit, returns instantly with programIntelligenceId.
// If miss → extracts → saves → returns with programIntelligenceId.
// 2026-04-22

import { NextRequest } from 'next/server';
import { smartExtract, type SmartExtractProgress } from '@/lib/extract/smart-extract';
import { checkCache, saveCache } from '@/lib/extract/cache';
import { toSlug, getCurrentCycle } from '@/lib/extract/smart-extract';
import { resolveSchoolFromUrl } from '@/lib/extract/schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return Response.json({ error: 'Input is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const trimmed = input.trim();

        // Quick cache check for .edu URLs
        if (trimmed.startsWith('https://') && trimmed.includes('.edu')) {
          const school = resolveSchoolFromUrl(trimmed);
          if (school) {
            const schoolSlug = toSlug(school.name);
            try {
              const urlPath = new URL(trimmed).pathname.replace(/\//g, '-').replace(/^-|-$/g, '');
              const programSlug = toSlug(urlPath);
              const cycle = getCurrentCycle();

              send({ type: 'progress', step: 'resolving', message: 'Checking library...', messageZh: '检查项目库...' });
              const cached = await checkCache(schoolSlug, programSlug, cycle);

              if (cached) {
                send({ type: 'progress', step: 'complete', message: 'Found in library', messageZh: '已在项目库中找到' });
                // Look up the programIntelligenceId
                const { default: prisma } = await import('@/lib/prisma');
                const record = await prisma.programIntelligence.findUnique({
                  where: { schoolSlug_programSlug_cycle: { schoolSlug, programSlug, cycle } },
                  select: { id: true },
                });
                send({ type: 'result', ...cached, programIntelligenceId: record?.id, fromCache: true });
                controller.close();
                return;
              }
            } catch { /* cache miss, continue */ }
          }
        }

        // No cache hit — run full extraction
        const result = await smartExtract(trimmed, (p: SmartExtractProgress) => {
          send({ type: 'progress', ...p });
        });

        // Save to cache and get the record ID
        const programIntelligenceId = await saveCache(result, trimmed);

        send({
          type: 'result',
          ...result,
          programIntelligenceId,
          fromCache: false,
        });

      } catch (e) {
        send({ type: 'error', message: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
