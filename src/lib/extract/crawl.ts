// ============================================================
// MULTI-PAGE CRAWLER
// Given one .edu URL, discovers and fetches related pages.
//
// v3 (2026-04-09): Two-pass link discovery — discovers links
// from pages 2+3 too (catches FAQ/tuition linked from admissions
// page, not from main program page). Path-based sibling detection.
// ============================================================

const JINA_PREFIX = 'https://r.jina.ai/';

export interface CrawlResult {
  url: string;
  markdown: string;
  pageType: 'program' | 'admissions' | 'requirements' | 'deadlines' | 'financial' | 'faq' | 'unknown';
  score: number;
}

// ---- URL/text scoring ----

const POSITIVE_PATTERNS: Array<{ pattern: RegExp; type: CrawlResult['pageType']; score: number }> = [
  // Admissions / how to apply (highest priority)
  { pattern: /\b(how[\s-]?to[\s-]?apply|application[\s-]?process|apply[\s-]?now|start[\s-]?your[\s-]?application)\b/i, type: 'admissions', score: 10 },
  { pattern: /\/(apply|admissions?|how-to-apply|application)\b/i, type: 'admissions', score: 9 },
  { pattern: /\b(admissions?[\s-]?requirements?|eligibility|qualifications?)\b/i, type: 'requirements', score: 9 },

  // Requirements
  { pattern: /\/(requirements|prerequisites|eligibility|checklist)\b/i, type: 'requirements', score: 8 },
  { pattern: /\b(what[\s-]?you[\s-]?need|required[\s-]?materials?|application[\s-]?checklist)\b/i, type: 'requirements', score: 8 },
  { pattern: /\bprospective[\s-]?students?\b/i, type: 'admissions', score: 7 },

  // Deadlines
  { pattern: /\/(deadlines?|dates|timeline|when-to-apply)\b/i, type: 'deadlines', score: 8 },
  { pattern: /\b(application[\s-]?deadlines?|important[\s-]?dates|when[\s-]?to[\s-]?apply)\b/i, type: 'deadlines', score: 8 },

  // FAQ — often contains TOEFL, GRE, WES details that main page omits
  { pattern: /\/(faq|frequently[\s-]?asked|common[\s-]?questions?|ask[\s-]?us|q-?and-?a)\b/i, type: 'faq', score: 7 },
  { pattern: /\b(frequently[\s-]?asked|common[\s-]?questions?|faq|q\s?(&|and)\s?a)\b/i, type: 'faq', score: 7 },

  // Financial — tuition, fees, aid
  { pattern: /\/(tuition|financial[\s-]?aid|cost|fees|funding|scholarships?)\b/i, type: 'financial', score: 7 },
  { pattern: /\b(tuition[\s-]?(&|and)[\s-]?fees|cost[\s-]?of[\s-]?attendance|financial[\s-]?aid|scholarships?)\b/i, type: 'financial', score: 7 },

  // Curriculum / program details
  { pattern: /\/(curriculum|courses|academics|program[\s-]?overview|degree[\s-]?requirements|explore[\s-]?program)\b/i, type: 'program', score: 5 },
  { pattern: /\b(curriculum|course[\s-]?listing|program[\s-]?overview|degree[\s-]?requirements)\b/i, type: 'program', score: 5 },
];

const NEGATIVE_PATTERNS: RegExp[] = [
  /\/(news|events|blog|stories|press|media-coverage|announcements)\b/i,
  /\/(faculty|staff|directory|people|profiles|our-team)\b/i,
  /\/(research|labs?|publications?|projects)\b/i,
  /\/(jobs?|careers?|employment|job-market|placement-data|alumni-spotlight|recruiting)\b/i,
  /\/(contact|visit|tours?|info-session|webinar|open-house)\b/i,
  /\/(login|portal|dashboard|account|password)\b/i,
  /\/(student-life|campus|housing|dining|clubs|organizations)\b/i,
  /\/(donate|giving|support-us|alumni-giving)\b/i,
  /\/(diversity|dei|inclusion)\b/i,
  /\/(history|about-us|mission|leadership)\b/i,
  /\.(pdf|jpg|jpeg|png|gif|doc|docx|xlsx|pptx|zip)$/i,
  /\.(webp|svg|ico|woff|woff2|ttf|eot|mp4|mp3)$/i,
  /%22|%20%22|%27/i,
];

function scoreLink(url: string, linkText: string): { type: CrawlResult['pageType']; score: number } {
  for (const neg of NEGATIVE_PATTERNS) {
    if (neg.test(url)) return { type: 'unknown', score: -1 };
  }
  try {
    const parsed = new URL(url);
    if (parsed.hash) return { type: 'unknown', score: -1 };
  } catch {
    return { type: 'unknown', score: -1 };
  }

  const combined = url + ' ' + linkText;
  let bestType: CrawlResult['pageType'] = 'unknown';
  let bestScore = 0;
  for (const { pattern, type, score } of POSITIVE_PATTERNS) {
    if (pattern.test(combined) && score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }
  return { type: bestType, score: bestScore };
}

// ---- Path-based sibling detection ----

function getProgramRoot(startUrl: string): string | null {
  try {
    const parsed = new URL(startUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      const root = '/' + segments.slice(0, Math.max(1, segments.length - 1)).join('/') + '/';
      return root;
    }
    return null;
  } catch {
    return null;
  }
}

// ---- Fetch ----

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(JINA_PREFIX + url, {
      headers: {
        'Accept': 'text/markdown',
        'X-Return-Format': 'markdown',
      },
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.slice(0, 40000);
  } catch {
    return null;
  }
}

// ---- Link extraction ----

function extractRelatedLinks(
  markdown: string,
  baseUrl: string,
  programRoot: string | null,
  seen: Set<string>,
): Array<{ url: string; text: string; type: CrawlResult['pageType']; score: number }> {
  const baseDomain = new URL(baseUrl).hostname.replace(/^www\./, '');
  const baseRoot = baseDomain.split('.').slice(-2).join('.');
  const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const links: Array<{ url: string; text: string; type: CrawlResult['pageType']; score: number }> = [];

  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const [, text, url] = match;
    try {
      const linkDomain = new URL(url).hostname.replace(/^www\./, '');
      const linkRoot = linkDomain.split('.').slice(-2).join('.');
      if (baseRoot !== linkRoot) continue;

      const normalized = url.split('?')[0].split('#')[0].replace(/\/$/, '');
      if (seen.has(normalized)) continue;
      // Reject asset/media URLs and broken encoded URLs
      // Reject broken/garbage URLs
      if (/["'<>]/.test(normalized)) continue;
      if (/%22|%27|%3C|%3E/.test(normalized)) continue;
      if (/\.(webp|png|jpg|jpeg|gif|svg|ico|woff2?|css|js|mp4)\b/i.test(normalized)) continue;
      if (/\/(files|sites\/default|images|assets|static)\//i.test(normalized)) continue;

      let { type, score } = scoreLink(url, text);

      // Sibling bonus: URL shares the same program root path → worth considering
      if (score === 0 && programRoot) {
        try {
          const linkPath = new URL(url).pathname;
          if (linkPath.startsWith(programRoot)) {
            type = 'unknown';
            score = 3;
          }
        } catch { /* skip */ }
      }

      if (score > 0) {
        seen.add(normalized);
        links.push({ url: normalized, text, type, score });
      }
    } catch { /* invalid URL, skip */ }
  }

  links.sort((a, b) => b.score - a.score);
  return links;
}

// ---- Parallel fetch helper ----

async function fetchLinks(
  links: Array<{ url: string; text: string; type: CrawlResult['pageType']; score: number }>,
  limit: number,
): Promise<CrawlResult[]> {
  const toFetch = links.slice(0, limit);
  const results: CrawlResult[] = [];
  const fetched = await Promise.allSettled(
    toFetch.map(async (link) => {
      const md = await fetchPage(link.url);
      if (!md) return null;
      return { url: link.url, markdown: md, pageType: link.type, score: link.score } as CrawlResult;
    })
  );
  for (const r of fetched) {
    if (r.status === 'fulfilled' && r.value) results.push(r.value);
  }
  return results;
}

// ---- Main crawl: two-pass discovery ----

export async function crawlProgram(startUrl: string, maxPages = 5): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  const seen = new Set<string>();
  seen.add(startUrl.split('?')[0].split('#')[0].replace(/\/$/, ''));

  const programRoot = getProgramRoot(startUrl);

  // === Pass 1: Fetch start page, discover links, fetch top 2 ===
  const mainMarkdown = await fetchPage(startUrl);
  if (!mainMarkdown) {
    throw new Error(`Failed to fetch: ${startUrl}`);
  }
  results.push({ url: startUrl, markdown: mainMarkdown, pageType: 'program', score: 100 });

  const pass1Links = extractRelatedLinks(mainMarkdown, startUrl, programRoot, seen);

  // Deduplicate by type — one page per type in pass 1
  const typesSeen = new Set<string>();
  const pass1Pick: typeof pass1Links = [];
  for (const link of pass1Links) {
    if (pass1Pick.length >= 2) break;
    if (typesSeen.has(link.type) && link.type !== 'program' && link.type !== 'unknown') continue;
    typesSeen.add(link.type);
    pass1Pick.push(link);
  }

  const pass1Results = await fetchLinks(pass1Pick, 2);
  results.push(...pass1Results);

  // === Pass 2: Discover NEW links from pages fetched in pass 1 ===
  const remaining = maxPages - results.length;
  if (remaining > 0) {
    const allNewLinks: typeof pass1Links = [];
    for (const page of results.slice(1)) {
      const newLinks = extractRelatedLinks(page.markdown, startUrl, programRoot, seen);
      allNewLinks.push(...newLinks);
    }
    allNewLinks.sort((a, b) => b.score - a.score);

    // Track types we already have
    for (const page of results) {
      if (page.pageType !== 'unknown' && page.pageType !== 'program') {
        typesSeen.add(page.pageType);
      }
    }

    const pass2Pick: typeof pass1Links = [];
    for (const link of allNewLinks) {
      if (pass2Pick.length >= remaining) break;
      // Prefer types we haven't seen yet; allow duplicates only for high scores
      if (typesSeen.has(link.type) && link.type !== 'unknown' && link.type !== 'program') {
        if (link.score < 7) continue;
      }
      typesSeen.add(link.type);
      pass2Pick.push(link);
    }

    const pass2Results = await fetchLinks(pass2Pick, remaining);
    results.push(...pass2Results);
  }

  return results;
}

// Combine all crawled pages into context for Claude
export function buildExtractionContext(pages: CrawlResult[]): string {
  let context = '';
  const sorted = [...pages].sort((a, b) => b.score - a.score);
  for (const page of sorted) {
    context += `\n\n=== PAGE: ${page.url} (type: ${page.pageType}, relevance: ${page.score}) ===\n\n`;
    context += page.markdown;
  }
  return context;
}
