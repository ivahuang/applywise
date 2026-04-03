/**
 * Program data extraction pipeline.
 *
 * Flow: URL → Jina Reader → Regex extraction (free) → Claude extraction (paid, optional)
 *
 * Always returns something useful. Claude layer adds depth but isn't required.
 */

import { fetchWithJina } from "./jina";
import { regexExtract, type RegexExtractResult } from "./regex-extract";
import { claudeExtract, isClaudeAvailable, type ExtractedProgram } from "./claude-extract";

export interface ExtractionResult {
  ok: boolean;
  url: string;
  school: string;

  /** Regex-extracted data (always available if page fetched) */
  basic: RegexExtractResult | null;

  /** Claude-extracted data (only if API available + billing enabled) */
  full: ExtractedProgram | null;

  /** Which extraction methods succeeded */
  methods: ("jina" | "regex" | "claude")[];

  /** Page title from Jina */
  pageTitle: string;

  /** Raw markdown (for debugging / manual review) */
  markdown: string;

  /** Errors encountered */
  errors: string[];

  /** Is Claude API available? If not, show upgrade prompt */
  claudeAvailable: boolean;
}

export async function extractProgramData(
  url: string,
  schoolName: string
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    ok: false,
    url,
    school: schoolName,
    basic: null,
    full: null,
    methods: [],
    pageTitle: "",
    markdown: "",
    errors: [],
    claudeAvailable: isClaudeAvailable(),
  };

  // ── Step 1: Fetch with Jina ─────────────────────────────
  const jina = await fetchWithJina(url);

  if (!jina.ok) {
    result.errors.push(`Jina fetch failed: ${jina.error}`);
    return result;
  }

  result.methods.push("jina");
  result.pageTitle = jina.title;
  result.markdown = jina.markdown;

  // ── Step 2: Regex extraction (always, free) ─────────────
  try {
    result.basic = regexExtract(jina.markdown);
    result.methods.push("regex");
    result.ok = true; // We have at least basic data
  } catch (err: any) {
    result.errors.push(`Regex extraction failed: ${err.message}`);
  }

  // ── Step 3: Claude extraction (if available) ────────────
  if (isClaudeAvailable()) {
    const claude = await claudeExtract(jina.markdown, url, schoolName);
    if (claude.ok && claude.data) {
      result.full = claude.data;
      result.methods.push("claude");
    } else if (claude.error) {
      result.errors.push(`Claude: ${claude.error}`);
    }
  }

  return result;
}

/**
 * Merge extraction results into a seed-programs.json compatible object.
 * Prefers Claude data when available, falls back to regex.
 */
export function mergeExtraction(
  result: ExtractionResult,
  schoolName: string,
  schoolNameZh: string
): Record<string, unknown> {
  const full = result.full;
  const basic = result.basic;

  if (full) {
    // Claude gave us everything
    return {
      school: schoolName,
      school_zh: schoolNameZh,
      program: full.program,
      program_zh: full.program_zh,
      degree: full.degree,
      department: full.department,
      field: full.field,
      duration: full.duration,
      toefl_min: full.toefl_min,
      gre_required: full.gre_required,
      recs_required: full.recs_required,
      recs_academic_min: full.recs_academic_min,
      recs_notes: full.recs_notes,
      wes_required: full.wes_required,
      wes_eval_type: full.wes_eval_type,
      application_fee: full.application_fee,
      interview_required: full.interview_required,
      interview_format: full.interview_format,
      deadline: full.deadline,
      essays: full.essays,
      portal_url: full.portal_url,
      program_url: result.url,
      admissions_url: full.admissions_url,
      notes: full.notes,
      verified_at: null, // Always null until human verifies
      country: "US",
      _extraction: {
        method: "claude",
        extracted_at: new Date().toISOString(),
        page_title: result.pageTitle,
      },
    };
  }

  // Regex-only fallback
  return {
    school: schoolName,
    school_zh: schoolNameZh,
    program: basic?.program_name ?? result.pageTitle ?? "Unknown Program",
    program_zh: "",
    degree: basic?.degree ?? "MS",
    department: basic?.department,
    field: "other",
    duration: basic?.duration,
    toefl_min: basic?.toefl_min,
    gre_required: basic?.gre_required ?? false,
    recs_required: basic?.recs_required ?? 3,
    recs_academic_min: 2,
    recs_notes: null,
    wes_required: basic?.wes_required ?? false,
    wes_eval_type: null,
    application_fee: basic?.application_fee,
    interview_required: false,
    interview_format: null,
    deadline: basic?.deadline,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    portal_url: null,
    program_url: result.url,
    admissions_url: null,
    notes: `Auto-extracted (regex only, ${basic?.fieldsExtracted ?? 0}/${basic?.fieldsTotal ?? 0} fields). Needs verification.`,
    verified_at: null,
    country: "US",
    _extraction: {
      method: "regex",
      fields_extracted: basic?.fieldsExtracted ?? 0,
      extracted_at: new Date().toISOString(),
      page_title: result.pageTitle,
    },
  };
}
