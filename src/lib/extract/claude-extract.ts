/**
 * Claude API extraction: sends Jina markdown to Claude,
 * returns perfectly structured program data.
 *
 * Requires: ANTHROPIC_API_KEY env var + billing enabled.
 * Cost: ~$0.01-0.03 per extraction (using Haiku for cost efficiency).
 */

export interface ClaudeExtractResult {
  ok: boolean;
  data: ExtractedProgram | null;
  error?: string;
  model?: string;
  cost_estimate?: string;
}

export interface ExtractedProgram {
  program: string;
  program_zh: string;
  degree: string;
  department: string | null;
  field: string;
  duration: string | null;
  toefl_min: number | null;
  gre_required: boolean;
  recs_required: number;
  recs_academic_min: number;
  recs_notes: string | null;
  wes_required: boolean;
  wes_eval_type: string | null;
  application_fee: number | null;
  interview_required: boolean;
  interview_format: string | null;
  deadline: string | null;
  deadline_early: string | null;
  essays: {
    title: string;
    title_zh: string;
    word_limit: number | null;
    prompt: string | null;
    type: string;
  }[];
  portal_url: string | null;
  admissions_url: string | null;
  notes: string | null;
}

const SYSTEM_PROMPT = `You are a graduate school admissions data extractor. Given markdown content from a university program page, extract structured admissions data as JSON.

IMPORTANT RULES:
- Only extract information explicitly stated on the page. Do NOT guess or infer.
- If a field is not mentioned, use null.
- For essays, extract the EXACT prompt text and word limit if given.
- For deadlines, use YYYY-MM-DD format.
- For field classification, use one of: communications, computer_science, data_science, statistics, public_policy, international_relations, education, financial_engineering, business_analytics, information_science, hci, journalism, social_work, public_health, urban_planning, electrical_engineering, economics, social_science, media_technology, other
- For essay type, use one of: sop, personal_statement, cohort, writing_sample, program_specific, video
- For interview_format, use one of: kira, zoom, alumni, in_person, or null
- For wes_eval_type, use: course-by-course, document-by-document, or null
- Respond ONLY with a JSON object, no markdown backticks, no explanation.`;

const USER_PROMPT_TEMPLATE = `Extract graduate program admissions data from this university page content.

URL: {URL}
School: {SCHOOL}

Page content (markdown):
---
{CONTENT}
---

Return a JSON object with these fields:
{
  "program": "Full program name in English",
  "program_zh": "Program name in Chinese",
  "degree": "MS/MA/MEng/MPP/MPA/PhD/etc",
  "department": "Department or school name",
  "field": "Field classification (see rules)",
  "duration": "e.g. 3 semesters, 1 year",
  "toefl_min": number or null,
  "gre_required": true/false,
  "recs_required": number,
  "recs_academic_min": number,
  "recs_notes": "Any specific rec requirements",
  "wes_required": true/false,
  "wes_eval_type": "course-by-course" or null,
  "application_fee": number or null,
  "interview_required": true/false,
  "interview_format": "kira/zoom/alumni/in_person" or null,
  "deadline": "YYYY-MM-DD" or null,
  "deadline_early": "YYYY-MM-DD" or null,
  "essays": [
    {
      "title": "Essay title",
      "title_zh": "Chinese title",
      "word_limit": number or null,
      "prompt": "Full prompt text if available",
      "type": "sop/personal_statement/cohort/writing_sample/program_specific/video"
    }
  ],
  "portal_url": "Application portal URL if found",
  "admissions_url": "Admissions requirements page URL if found",
  "notes": "Any important notes about the program"
}`;

export async function claudeExtract(
  markdown: string,
  url: string,
  schoolName: string
): Promise<ClaudeExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { ok: false, data: null, error: "ANTHROPIC_API_KEY not configured" };
  }

  // Truncate markdown to avoid token limits (keep first ~6000 words)
  const truncated = markdown.split(/\s+/).slice(0, 6000).join(" ");

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{URL}", url)
    .replace("{SCHOOL}", schoolName)
    .replace("{CONTENT}", truncated);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Cheapest model, good enough for extraction
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      // Check for billing error specifically
      if (res.status === 403 || errBody.includes("billing")) {
        return {
          ok: false,
          data: null,
          error: "API billing not enabled. Add a payment method at console.anthropic.com/settings/billing",
        };
      }
      return { ok: false, data: null, error: `Claude API error ${res.status}: ${errBody}` };
    }

    const body = await res.json();
    const text = body.content?.[0]?.text ?? "";

    // Parse the JSON response
    const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
    const data = JSON.parse(cleaned) as ExtractedProgram;

    return {
      ok: true,
      data,
      model: body.model,
      cost_estimate: "~$0.01",
    };
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      error: err.message ?? "Claude extraction failed",
    };
  }
}

/** Check if Claude API is available (has key + can make requests) */
export function isClaudeAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
