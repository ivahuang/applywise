// ============================================================
// POST /api/smart-extract
// 
// Body: { input: string } — either a .edu URL or a keyword
// Returns: Server-Sent Events stream with progress + final result
//
// Events:
//   data: { type: "progress", step, message, messageZh }
//   data: { type: "result", program, crawledPages, confidence, missingFields, processingTime }
//   data: { type: "error", message }
// ============================================================

import { NextRequest } from 'next/server';
import { smartExtract, type SmartExtractProgress } from '@/lib/extract/smart-extract';

export const runtime = 'nodejs';
export const maxDuration = 60; // extraction can take up to 60s

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return Response.json({ error: 'Input is required' }, { status: 400 });
  }

  // Use SSE for streaming progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await smartExtract(input.trim(), (p: SmartExtractProgress) => {
          send({ type: 'progress', ...p });
        });
        send({ type: 'result', ...result });
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
