// ============================================================
// SMART EXTRACTION ENGINE
// The core intelligence: URL or keyword → complete program data
// 
// v3 (2026-04-09): Deadline cycle detection, slug helpers for
// cache keying, bumped maxPages to 5 for two-pass crawler
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { crawlProgram, buildExtractionContext, type CrawlResult } from './crawl';
import {
  type ExtractedProgram,
  type EssayPrompt,
  resolveSchoolFromUrl,
  calculateConfidence,
  validateExtraction,
} from './schema';

const anthropic = new Anthropic();

// ---- Slug helpers (used for cache keys) ----

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCurrentCycle(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // If we're past August, the current cycle is for next year's enrollment
  // e.g. Sept 2026 → "2027" cycle (applying now for fall 2027)
  // If before August, current cycle is this year
  // e.g. April 2026 → "2026" cycle (deadlines were Jan-Mar 2026, enrolling fall 2026)
  //   BUT most students in April are actually looking at NEXT cycle
  // Simplest: if month >= 5 (May+), assume next year's cycle
  if (month >= 5) {
    return `${year + 1}`;
  }
  return `${year}`;
}

// ---- Step 1: Resolve input to a .edu URL ----

function isValidEduUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.hostname.endsWith('.edu');
  } catch {
    return false;
  }
}

async function resolveKeywordToUrl(keyword: string): Promise<string> {
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: `You are a URL resolver for US graduate programs. Given a keyword or program description, return ONLY the most likely official .edu program page URL. No explanation, just the URL. If unsure, return the school's graduate admissions page. Always return a real .edu URL.`,
    messages: [{ role: 'user', content: keyword }],
  });
  const text = resp.content[0].type === 'text' ? resp.content[0].text.trim() : '';
  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+\.edu[^\s"'<>]*/);
  if (urlMatch) return urlMatch[0];
  throw new Error(`Could not resolve "${keyword}" to a .edu URL. Try pasting the program URL directly.`);
}

// ---- Step 2: Claude extraction prompt ----

const EXTRACTION_SYSTEM_PROMPT = `You are a precise data extractor for US graduate program admissions information.

You will receive content from MULTIPLE .edu pages about a specific program. Each page is marked with its URL and type (program, admissions, requirements, deadlines, financial, faq).

YOUR TASK: Extract every available piece of information into a single JSON object. Be thorough.

CRITICAL INSTRUCTIONS:
1. READ ALL PAGES. Different pages contain different information:
   - The main program page often has: program name, degree, duration, curriculum, faculty
   - The admissions/requirements page has: TOEFL, GRE, recs, essays, deadlines
   - The financial page has: tuition, fees, financial aid
   - The FAQ page often clarifies: "Is GRE required?" "Can I apply with IELTS?" "Is WES required?"
   You MUST cross-reference all pages. Do not stop after the first page.

2. ONLY extract what is EXPLICITLY stated. Never guess. If a field isn't mentioned on any page, use null.

3. ESSAY PROMPTS: Extract the EXACT text of every essay question. These are critical. Look for:
   - "Statement of Purpose" or "Statement of Academic Purpose"
   - "Personal Statement" or "Personal History"
   - "Cohort essay" or "What will you contribute"
   - "Writing sample" requirements
   - "Video essay" requirements
   - Any program-specific supplemental essays
   Each essay should include: the full prompt text, word/page limit if stated, and whether it's required.

4. DEADLINES: Use ISO format YYYY-MM-DD. Common patterns to handle:
   - "January 15" with no year → assume the next upcoming January 15 (for 2025-26 cycle, that's 2026-01-15)
   - "Priority deadline: November 1 / Final deadline: February 1" → put first in deadlineEarly, second in deadlineRegular
   - "Rolling admissions" → set deadlineNotes to "Rolling admissions", leave date fields null
   - If dates appear to be from a past application cycle, still extract them and note "Dates from [year] cycle" in deadlineNotes

5. COSTS: Extract as USD numbers only. No $ sign, no commas.
   - "tuition is $2,640 per credit" → costPerCredit: 2640
   - "total program cost is approximately $95,000" → estimatedTotalTuition: 95000

6. BOOLEAN FIELDS: 
   - "GRE is required" → greRequired: true
   - "GRE is optional" or "GRE is not required" → greRequired: false
   - "GRE scores may be submitted" or "GRE waiver available" → greRequired: false, note in deadlineNotes
   - No mention of GRE at all → greRequired: null

7. WES: Look for "credential evaluation", "WES", "World Education Services", "course-by-course evaluation"

8. URLS: If you find links to the application portal (often "Apply Now" buttons), admissions page, or financial aid page, include them.

Return ONLY valid JSON matching this structure:
{
  "schoolName": string,
  "schoolNameZh": string | null,
  "programName": string (official name as listed on the page),
  "programNameZh": string | null,
  "department": string | null (e.g. "School of Professional Studies"),
  "degree": string (e.g. "MS", "MA", "PhD", "MBA", "MPA", "MPP", "MFA", "MEng", "MFin"),
  "field": string (one of: "communications", "data_science", "computer_science", "public_policy", "business", "engineering", "education", "psychology", "economics", "statistics", "information_science", "law", "health", "finance", "arts", "other"),
  "duration": string | null (e.g. "3 semesters", "2 years", "18 months"),
  "totalCredits": number | null,
  "format": "full-time" | "part-time" | "hybrid" | null,
  "curriculum": [string] | null (list of key courses, concentrations, tracks, or specializations),
  "costPerCredit": number | null,
  "estimatedTotalTuition": number | null,
  "applicationFee": number | null,
  "toeflRequired": boolean | null (IMPORTANT: set to false if the program says TOEFL/IELTS is "not required", "waived", "optional", or "not needed". Only set true if explicitly required. null if not mentioned at all.),
  "toeflMin": number | null (the minimum score, typically 79-110),
  "toeflMedian": number | null,
  "ieltsMin": number | null (typically 6.0-7.5),
  "greRequired": boolean | null,
  "greMin": number | null,
  "gmatAccepted": boolean | null,
  "gpaMin": number | null (typically on 4.0 scale),
  "wesRequired": boolean | null,
  "wesEvalType": "course-by-course" | "document-by-document" | null,
  "recsRequired": number | null (typically 2-3),
  "recsAcademicMin": number | null,
  "recsProfessionalOk": boolean | null,
  "deadlineEarly": "YYYY-MM-DD" | null,
  "deadlineRegular": "YYYY-MM-DD" | null,
  "deadlineFinal": "YYYY-MM-DD" | null,
  "deadlineNotes": string | null,
  "essays": [
    {
      "type": "sop" | "personal_statement" | "cohort" | "writing_sample" | "program_specific" | "video_essay" | "other",
      "typeZh": string,
      "prompt": string (the EXACT prompt text as written on the site),
      "promptZh": string | null,
      "wordLimit": number | null,
      "required": boolean
    }
  ] | null,
  "resumeRequired": boolean | null,
  "writingSampleRequired": boolean | null,
  "writingSampleDetails": string | null,
  "portfolioRequired": boolean | null,
  "interviewRequired": boolean | null,
  "interviewFormat": string | null,
  "videoEssayRequired": boolean | null,
  "videoEssayDetails": string | null,
  "transcriptsRequired": boolean | null,
  "careerOutcomes": string | null,
  "employmentRate": number | null (as percentage, e.g. 95),
  "avgStartingSalary": number | null,
  "admissionsUrl": string | null,
  "portalUrl": string | null,
  "financialAidUrl": string | null
}

EXAMPLE of expected output quality:
{
  "schoolName": "Columbia University",
  "schoolNameZh": "哥伦比亚大学",
  "programName": "M.S. in Strategic Communications",
  "department": "School of Professional Studies",
  "degree": "MS",
  "field": "communications",
  "duration": "3 semesters",
  "totalCredits": 36,
  "costPerCredit": 2640,
  "estimatedTotalTuition": 95040,
  "applicationFee": 95,
  "toeflMin": 100,
  "ieltsMin": 7.0,
  "greRequired": false,
  "gpaMin": 3.0,
  "wesRequired": true,
  "wesEvalType": "course-by-course",
  "recsRequired": 2,
  "recsProfessionalOk": true,
  "deadlineEarly": "2026-01-15",
  "deadlineRegular": "2026-03-15",
  "deadlineNotes": "Priority deadline January 15 for scholarship consideration",
  "essays": [
    {
      "type": "sop",
      "typeZh": "学术目标陈述",
      "prompt": "What do you hope to gain from the Strategic Communication program and where would you like to be professionally in five years? (500 word limit)",
      "wordLimit": 500,
      "required": true
    },
    {
      "type": "cohort",
      "typeZh": "群体贡献文书",
      "prompt": "What unique contributions will you bring to the program and to your fellow students? (250 word max)",
      "wordLimit": 250,
      "required": true
    }
  ],
  "resumeRequired": true,
  "writingSampleRequired": true,
  "writingSampleDetails": "A report, press release, news article, or academic paper. Max 10 pages.",
  "videoEssayRequired": true,
  "videoEssayDetails": "One-minute video answering a randomized prompt",
  "careerOutcomes": "PR, corporate communications, media strategy at agencies and Fortune 500 companies",
  "admissionsUrl": "https://sps.columbia.edu/academics/masters/strategic-communication/admissions",
  "portalUrl": "https://apply.sps.columbia.edu"
}

Return ONLY valid JSON. No markdown fences, no explanation.`;

async function extractWithClaude(context: string, programUrl: string): Promise<Partial<ExtractedProgram>> {
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `I have crawled ${context.split('=== PAGE:').length - 1} pages from a .edu site. Please extract ALL program information by reading EVERY page carefully.\n\n${context}`,
    }],
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  const clean = text.replace(/```json\s*|```/g, '').trim();

  try {
    const data = JSON.parse(clean);
    return {
      ...data,
      programUrl,
      extractedAt: new Date().toISOString(),
    };
  } catch (e) {
    throw new Error(`Failed to parse Claude's extraction output: ${(e as Error).message}`);
  }
}

// ---- Step 3: Deadline cycle detection ----

function detectDeadlineCycle(data: Partial<ExtractedProgram>): void {
  const now = new Date();
  const deadlineFields = ['deadlineEarly', 'deadlineRegular', 'deadlineFinal'] as const;
  let allPast = true;
  let hasAnyDeadline = false;

  for (const field of deadlineFields) {
    const dateStr = data[field];
    if (dateStr) {
      hasAnyDeadline = true;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date > now) {
        allPast = false;
      }
    }
  }

  if (hasAnyDeadline && allPast) {
    const existingNotes = data.deadlineNotes || '';
    const cycleNote = 'Deadlines appear to be from a previous application cycle. Next cycle dates likely similar, shifted +1 year. Please verify on the official website.';
    data.deadlineNotes = existingNotes ? `${existingNotes} | ${cycleNote}` : cycleNote;
  }
}

// ---- Step 4: Main orchestrator ----

export interface SmartExtractResult {
  program: ExtractedProgram;
  crawledPages: Array<{ url: string; pageType: string; score: number }>;
  confidence: number;
  missingFields: string[];
  warnings: string[];
  processingTime: number;
  schoolSlug: string;
  programSlug: string;
  cycle: string;
}

export interface SmartExtractProgress {
  step: 'resolving' | 'crawling' | 'extracting' | 'validating' | 'complete' | 'error';
  message: string;
  messageZh: string;
}

export async function smartExtract(
  input: string,
  onProgress?: (p: SmartExtractProgress) => void,
): Promise<SmartExtractResult> {
  const startTime = Date.now();
  const progress = onProgress || (() => {});

  // 1. Resolve input to URL
  let url: string;
  if (isValidEduUrl(input)) {
    url = input;
    progress({ step: 'resolving', message: 'Valid .edu URL detected', messageZh: '检测到 .edu 链接' });
  } else if (input.startsWith('http')) {
    throw new Error('Only .edu URLs are supported. Please paste the official program page URL.');
  } else {
    progress({ step: 'resolving', message: `Searching for "${input}"...`, messageZh: `正在搜索 "${input}"...` });
    url = await resolveKeywordToUrl(input);
    progress({ step: 'resolving', message: `Found: ${url}`, messageZh: `找到: ${url}` });
  }

  // 2. Resolve school name from domain
  const school = resolveSchoolFromUrl(url);

  // 3. Multi-page crawl (now up to 5 pages with two-pass discovery)
  progress({ step: 'crawling', message: 'Crawling program pages...', messageZh: '正在抓取项目页面...' });
  let pages: CrawlResult[];
  try {
    pages = await crawlProgram(url, 5);
  } catch (e) {
    throw new Error(`Failed to crawl ${url}: ${(e as Error).message}`);
  }
  progress({
    step: 'crawling',
    message: `Crawled ${pages.length} pages`,
    messageZh: `已抓取 ${pages.length} 个页面`,
  });

  // 4. Build context and extract with Claude
  progress({ step: 'extracting', message: 'AI is reading and extracting...', messageZh: 'AI 正在阅读和提取信息...' });
  const context = buildExtractionContext(pages);
  const extracted = await extractWithClaude(context, url);

  // 5. Enrich with domain-resolved school name if Claude missed it
  if (school) {
    if (!extracted.schoolName || extracted.schoolName === 'Unknown') {
      extracted.schoolName = school.name;
    }
    if (!extracted.schoolNameZh) {
      extracted.schoolNameZh = school.nameZh;
    }
  }

  // 6. Deadline cycle detection
  detectDeadlineCycle(extracted);

  // 7. Post-extraction validation
  progress({ step: 'validating', message: 'Validating extracted data...', messageZh: '正在验证提取的数据...' });
  const warnings = validateExtraction(extracted);

  // 8. Calculate confidence
  const { confidence, missingFields } = calculateConfidence(extracted);
  extracted.confidence = confidence;
  extracted.missingFields = missingFields;
  extracted.sourceUrls = pages.map(p => p.url);

  // 9. Generate slugs for cache keying
  const schoolSlug = toSlug(extracted.schoolName || school?.name || 'unknown');
  const programSlug = toSlug(extracted.programName || 'unknown');
  const cycle = getCurrentCycle();

  progress({ step: 'complete', message: 'Extraction complete', messageZh: '提取完成' });

  return {
    program: extracted as ExtractedProgram,
    crawledPages: pages.map(p => ({ url: p.url, pageType: p.pageType, score: p.score })),
    confidence,
    missingFields,
    warnings,
    processingTime: Date.now() - startTime,
    schoolSlug,
    programSlug,
    cycle,
  };
}
