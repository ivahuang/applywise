import { NextResponse } from "next/server";
import { extractProgramData, mergeExtraction } from "@/lib/extract";

/**
 * POST /api/extract
 *
 * Body: { url: string, schoolName?: string, schoolNameZh?: string }
 *
 * Returns extracted + merged program data ready for the frontend.
 * Uses Jina (free) + regex (free) + Claude (if API key + billing).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, schoolName = "", schoolNameZh = "" } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing url in request body" },
        { status: 400 }
      );
    }

    // Validate URL is a .edu domain (safety check)
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".edu")) {
      return NextResponse.json(
        { ok: false, error: "Only .edu URLs are supported for data integrity" },
        { status: 400 }
      );
    }

    // Run extraction pipeline
    const result = await extractProgramData(url, schoolName);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.errors.join("; "),
          claudeAvailable: result.claudeAvailable,
        },
        { status: 422 }
      );
    }

    // Merge into program-shaped object
    const program = mergeExtraction(result, schoolName, schoolNameZh);

    return NextResponse.json({
      ok: true,
      program,
      methods: result.methods,
      claudeAvailable: result.claudeAvailable,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Extraction failed" },
      { status: 500 }
    );
  }
}
