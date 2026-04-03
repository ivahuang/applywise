/**
 * Pattern-based extraction from .edu page markdown.
 * Always free, no LLM needed. Gets ~60-70% of fields.
 * Returns partial data — nulls for things it can't find.
 */

export interface RegexExtractResult {
  toefl_min: number | null;
  gre_required: boolean | null;
  application_fee: number | null;
  deadline: string | null;
  wes_required: boolean | null;
  recs_required: number | null;
  program_name: string | null;
  degree: string | null;
  department: string | null;
  duration: string | null;
  /** Confidence: how many fields were successfully extracted */
  fieldsExtracted: number;
  fieldsTotal: number;
}

export function regexExtract(markdown: string): RegexExtractResult {
  const text = markdown.toLowerCase();
  let fieldsExtracted = 0;
  const fieldsTotal = 10;

  // ── TOEFL minimum ──────────────────────────────────────
  let toefl_min: number | null = null;
  const toeflPatterns = [
    /toefl[^.]*?minimum[^.]*?(\d{2,3})/i,
    /minimum[^.]*?toefl[^.]*?(\d{2,3})/i,
    /toefl[^.]*?score[^.]*?(\d{2,3})/i,
    /toefl[^.]*?(?:ibt|internet)[^.]*?(\d{2,3})/i,
    /toefl[:\s]+(\d{2,3})/i,
  ];
  for (const pat of toeflPatterns) {
    const m = markdown.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 60 && val <= 120) { toefl_min = val; fieldsExtracted++; break; }
    }
  }

  // ── GRE required ───────────────────────────────────────
  let gre_required: boolean | null = null;
  if (/gre[^.]*?(?:not required|optional|not accepted|waived|no longer)/i.test(markdown)) {
    gre_required = false; fieldsExtracted++;
  } else if (/gre[^.]*?(?:required|must submit|scores are required)/i.test(markdown)) {
    gre_required = true; fieldsExtracted++;
  }

  // ── Application fee ────────────────────────────────────
  let application_fee: number | null = null;
  const feePatterns = [
    /application fee[^.]*?\$(\d{2,3})/i,
    /fee[^.]*?\$(\d{2,3})/i,
    /\$(\d{2,3})[^.]*?(?:application|fee)/i,
  ];
  for (const pat of feePatterns) {
    const m = markdown.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 25 && val <= 300) { application_fee = val; fieldsExtracted++; break; }
    }
  }

  // ── Deadline ───────────────────────────────────────────
  let deadline: string | null = null;
  // Match patterns like "January 15, 2026" or "Jan 15, 2026" near "deadline"
  const deadlinePatterns = [
    /deadline[^.]*?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})[^.]*?deadline/i,
    /deadline[^.]*?(\d{1,2})\/(\d{1,2})\/(\d{4})/i,
  ];
  const monthMap: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  for (const pat of deadlinePatterns) {
    const m = markdown.match(pat);
    if (m) {
      try {
        if (m[1] && monthMap[m[1].toLowerCase()]) {
          const mo = monthMap[m[1].toLowerCase()];
          const day = m[2].padStart(2, "0");
          deadline = `${m[3]}-${mo}-${day}`;
          fieldsExtracted++;
        } else if (m[1] && m[2] && m[3]) {
          // MM/DD/YYYY format
          deadline = `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
          fieldsExtracted++;
        }
        break;
      } catch {}
    }
  }

  // ── WES required ───────────────────────────────────────
  let wes_required: boolean | null = null;
  if (/wes|credential\s*evaluat|world\s*education\s*services/i.test(markdown)) {
    wes_required = true; fieldsExtracted++;
  }

  // ── Recommendations count ──────────────────────────────
  let recs_required: number | null = null;
  const recPatterns = [
    /(\d)\s*(?:letters?\s*of\s*recommend|recommend\w*\s*letters?)/i,
    /recommend\w*[^.]*?(\d)\s*(?:letters?|required)/i,
  ];
  for (const pat of recPatterns) {
    const m = markdown.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 1 && val <= 5) { recs_required = val; fieldsExtracted++; break; }
    }
  }

  // ── Program name ───────────────────────────────────────
  let program_name: string | null = null;
  const progPatterns = [
    /(?:master\s*of\s*(?:science|arts|engineering|public\s*\w+)|m\.?s\.?|m\.?a\.?|m\.?eng\.?|m\.?p\.?p\.?)\s*(?:in\s+)?([A-Z][^.|\n]{5,60})/,
  ];
  for (const pat of progPatterns) {
    const m = markdown.match(pat);
    if (m) { program_name = m[0].trim(); fieldsExtracted++; break; }
  }

  // ── Degree type ────────────────────────────────────────
  let degree: string | null = null;
  if (/master\s*of\s*science|m\.?s\.?\s/i.test(markdown)) { degree = "MS"; fieldsExtracted++; }
  else if (/master\s*of\s*arts|m\.?a\.?\s/i.test(markdown)) { degree = "MA"; fieldsExtracted++; }
  else if (/master\s*of\s*engineering|m\.?eng/i.test(markdown)) { degree = "MEng"; fieldsExtracted++; }
  else if (/master\s*of\s*public\s*policy|m\.?p\.?p/i.test(markdown)) { degree = "MPP"; fieldsExtracted++; }
  else if (/master\s*of\s*public\s*admin|m\.?p\.?a/i.test(markdown)) { degree = "MPA"; fieldsExtracted++; }

  // ── Department ─────────────────────────────────────────
  let department: string | null = null;
  const deptPatterns = [
    /(?:school|college|department|faculty|institute)\s+of\s+([A-Z][^.|\n]{3,50})/,
  ];
  for (const pat of deptPatterns) {
    const m = markdown.match(pat);
    if (m) { department = m[0].trim(); fieldsExtracted++; break; }
  }

  // ── Duration ───────────────────────────────────────────
  let duration: string | null = null;
  const durPatterns = [
    /(\d+)[- ](?:year|semester|month|term)\s*(?:program|degree|full[- ]time)?/i,
  ];
  for (const pat of durPatterns) {
    const m = markdown.match(pat);
    if (m) { duration = m[0].trim(); fieldsExtracted++; break; }
  }

  return {
    toefl_min, gre_required, application_fee, deadline,
    wes_required, recs_required, program_name, degree,
    department, duration, fieldsExtracted, fieldsTotal,
  };
}
