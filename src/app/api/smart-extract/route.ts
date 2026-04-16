// ============================================================
// POST /api/smart-extract
// 
// Body: { input: string } — either a .edu URL or a keyword
// Returns: Server-Sent Events stream with progress + final result
//
// Now with caching: checks ProgramIntelligence table first.
// If cache hit → returns instantly. If miss → extracts + saves.
// ============================================================

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
        // Quick cache check for .edu URLs
        const trimmed = input.trim();
        if (trimmed.startsWith('https://') && trimmed.includes('.edu')) {
          const school = resolveSchoolFromUrl(trimmed);
          if (school) {
            const schoolSlug = toSlug(school.name);
            // Use URL path as program slug for cache lookup
            try {
              const urlPath = new URL(trimmed).pathname.replace(/\//g, '-').replace(/^-|-$/g, '');
              const programSlug = toSlug(urlPath);
              const cycle = getCurrentCycle();

              send({ type: 'progress', step: 'resolving', message: 'Checking cache...', messageZh: '检查缓存...' });
              const cached = await checkCache(schoolSlug, programSlug, cycle);

              if (cached) {
                send({ type: 'progress', step: 'complete', message: 'Found cached result', messageZh: '找到缓存结果' });
                send({ type: 'result', ...cached });
                controller.close();
                return;
              }
            } catch { /* cache miss, continue to extract */ }
          }
        }

        // No cache hit — run full extraction
        const result = await smartExtract(trimmed, (p: SmartExtractProgress) => {
          send({ type: 'progress', ...p });
        });

        send({ type: 'result', ...result });

        // Save to cache in background (don't block response)
        saveCache(result).catch(e => console.error('Cache save error:', e));

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