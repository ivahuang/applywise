// ============================================================
// SMART EXTRACTION ENGINE
// The core intelligence: URL or keyword → complete program data
// 
// Flow:
//   1. Input: URL or keyword
//   2. If keyword → web search → find .edu program page
//   3. Validate .edu domain → resolve school name
//   4. Multi-page crawl (program + admissions + requirements)
//   5. Claude extracts structured data from all pages
//   6. Calculate confidence, flag missing fields
//   7. Return ExtractedProgram ready for task generation
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { crawlProgram, buildExtractionContext, type CrawlResult } from './crawl';
import {
  type ExtractedProgram,
  type EssayPrompt,
  resolveSchoolFromUrl,
  calculateConfidence,
} from './schema';

const anthropic = new Anthropic();

// ---- Step 1: Resolve input to a .edu URL ----

function isValidEduUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.hostname.endsWith('.edu');
  } catch {
    return false;
  }
}

// If user typed a keyword like "Columbia strategic communications masters",
// use Claude to generate the most likely .edu URL
async function resolveKeywordToUrl(keyword: string): Promise<string> {
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: `You are a URL resolver for US graduate programs. Given a keyword or program description, return ONLY the most likely official .edu program page URL. No explanation, just the URL. If unsure, return the school's graduate admissions page. Always return a real .edu URL.`,
    messages: [{ role: 'user', content: keyword }],
  });
  const text = resp.content[0].type === 'text' ? resp.content[0].text.trim() : '';
  // Extract URL from response
  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+\.edu[^\s"'<>]*/);
  if (urlMatch) return urlMatch[0];
  throw new Error(`Could not resolve "${keyword}" to a .edu URL. Try pasting the program URL directly.`);
}

// ---- Step 2: Claude extraction prompt ----

const EXTRACTION_SYSTEM_PROMPT = `You are a precise data extractor for US graduate program information. 
You will receive content crawled from one or more .edu pages about a specific program.

Extract ALL available information into a JSON object. Be thorough — check every page for different pieces of info.

CRITICAL RULES:
- Only extract information explicitly stated on the pages. Never guess or infer.
- For fields you cannot find, use null.
- For essay prompts, extract the EXACT prompt text as written.
- For deadlines, use ISO date format (YYYY-MM-DD). If only "January 15" with no year, assume the next upcoming cycle.
- For costs, use USD numbers only (no $ sign, no commas).
- For boolean fields, only set true/false if explicitly stated. Otherwise null.
- Return ONLY valid JSON, no markdown fences, no explanation.

Required JSON structure:
{
  "schoolName": string,
  "schoolNameZh": string | null,
  "programName": string (official program name as listed),
  "programNameZh": string | null,
  "department": string | null,
  "degree": "MS" | "MA" | "PhD" | "MBA" | "MPA" | "MPP" | "MFA" | ...,
  "field": string (one of: communications, data_science, computer_science, public_policy, business, engineering, education, psychology, economics, statistics, information_science, other),
  "duration": string | null,
  "totalCredits": number | null,
  "format": "full-time" | "part-time" | "hybrid" | null,
  "curriculum": [string] | null (list key courses, concentrations, or tracks),
  "costPerCredit": number | null,
  "estimatedTotalTuition": number | null,
  "applicationFee": number | null,
  "toeflMin": number | null,
  "toeflMedian": number | null,
  "ieltsMin": number | null,
  "greRequired": boolean | null,
  "greMin": number | null,
  "gmatAccepted": boolean | null,
  "gpaMin": number | null,
  "wesRequired": boolean | null,
  "wesEvalType": "course-by-course" | "document-by-document" | null,
  "recsRequired": number | null,
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
      "prompt": string (exact text),
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
  "employmentRate": number | null,
  "avgStartingSalary": number | null,
  "admissionsUrl": string | null (the "how to apply" page URL if found),
  "portalUrl": string | null (the actual application portal URL),
  "financialAidUrl": string | null
}`;

async function extractWithClaude(context: string, programUrl: string): Promise<Partial<ExtractedProgram>> {
  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Extract program information from the following crawled .edu pages:\n\n${context}`,
    }],
  });

  const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
  // Strip any markdown fences
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

// ---- Step 3: Main orchestrator ----

export interface SmartExtractResult {
  program: ExtractedProgram;
  crawledPages: Array<{ url: string; pageType: string }>;
  confidence: number;
  missingFields: string[];
  processingTime: number; // ms
}

export interface SmartExtractProgress {
  step: 'resolving' | 'crawling' | 'extracting' | 'complete' | 'error';
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
  
  // 3. Multi-page crawl
  progress({ step: 'crawling', message: 'Crawling program pages...', messageZh: '正在抓取项目页面...' });
  let pages: CrawlResult[];
  try {
    pages = await crawlProgram(url, 4);
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

  // 6. Calculate confidence
  const { confidence, missingFields } = calculateConfidence(extracted);
  extracted.confidence = confidence;
  extracted.missingFields = missingFields;
  extracted.sourceUrls = pages.map(p => p.url);

  progress({ step: 'complete', message: 'Extraction complete', messageZh: '提取完成' });

  return {
    program: extracted as ExtractedProgram,
    crawledPages: pages.map(p => ({ url: p.url, pageType: p.pageType })),
    confidence,
    missingFields,
    processingTime: Date.now() - startTime,
  };
}
