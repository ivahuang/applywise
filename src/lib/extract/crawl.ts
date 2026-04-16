// ============================================================
// MULTI-PAGE CRAWLER v6
// Strategy: find admissions hub, follow its links.
// Link discovery: brute-force URL extraction (split on delimiters,
// filter for same-domain .edu URLs). No markdown regex.
//
// Why brute-force: Jina outputs nested markdown like
//   [![Image](img.webp) Text](real-url)
// which breaks any [text](url) regex. Splitting on ()[]" spaces
// and filtering for .edu URLs catches everything reliably.
//
// 2026-04-16
// ============================================================

const JINA_PREFIX = 'https://r.jina.ai/';

export interface CrawlResult {
  url: string;
  markdown: string;
  pageType: 'program' | 'admissions' | 'requirements' | 'deadlines' | 'financial' | 'faq' | 'unknown';
  score: number;
}

// ---- Classify a URL by its last path segment ----

function classifyUrl(url: string): { type: CrawlResult['pageType']; score: number } {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return { type: 'unknown', score: 0 };
  }

  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  const full = path;

  // Last segment is the most specific signal
  if (/^(faq|frequently-asked|common-questions?|q-and-a)$/.test(last)) return { type: 'faq', score: 9 };
  if (/^(tuition|fees|financial-aid|cost|funding|scholarships?|tuition-and-financial-aid|financing-your-education)$/.test(last)) return { type: 'financial', score: 9 };
  if (/^(deadlines?|dates|timeline|when-to-apply|important-dates)$/.test(last)) return { type: 'deadlines', score: 9 };
  if (/^(requirements|prerequisites|eligibility|checklist|application-requirements)$/.test(last)) return { type: 'requirements', score: 9 };
  if (/^(apply|how-to-apply|application|application-process)$/.test(last)) return { type: 'admissions', score: 10 };
  if (/^(admissions?|prospective-students?)$/.test(last)) return { type: 'admissions', score: 9 };
  if (/^(curriculum|courses|program-overview|explore-program|degree-requirements|academics)$/.test(last)) return { type: 'program', score: 4 };

  // Fall back to path-level patterns
  if (/\/(admissions?|apply|how-to-apply)\//.test(full)) return { type: 'admissions', score: 6 };
  if (/\/(tuition|financial|cost|fees)/.test(full)) return { type: 'financial', score: 6 };
  if (/\/(faq|common-questions|frequently)/.test(full)) return { type: 'faq', score: 6 };

  return { type: 'unknown', score: 2 };
}

// ---- Reject junk URLs ----

function isJunk(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();

    // File extensions
    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|ico|css|js|woff2?|mp4|doc|docx|zip|ttf|eot)\b/.test(path)) return true;

    // CMS assets
    if (/\/(files|sites\/default|images|assets|static|_next)\//.test(path)) return true;

    // Non-content pages
    if (/\/(login|portal|account|dashboard|password|create-your-profile|register|sign-in)\b/.test(path)) return true;
    if (/\/(news|events|blog|press|announcements|stories|media-coverage)\b/.test(path)) return true;
    if (/\/(faculty|staff|directory|people|profiles|our-team)\b/.test(path)) return true;
    if (/\/(research|labs|publications|projects)\b/.test(path)) return true;
    if (/\/(jobs?|careers?|employment|recruiting|job-market|alumni-spotlight|placement)\b/.test(path)) return true;
    if (/\/(donate|giving|diversity|dei|about-us|history|mission|leadership)\b/.test(path)) return true;
    if (/\/(student-life|campus|housing|clubs|organizations|dining)\b/.test(path)) return true;
    if (/\/(contact|visit|tours?|info-session|webinar|open-house)\b/.test(path)) return true;

    // Tracking / analytics
    if (/bat\.bing\.com|analytics\.twitter|t\.co|facebook\.com|linkedin\.com/.test(url)) return true;

    return false;
  } catch {
    return true;
  }
}

// ---- Brute-force URL extraction ----
// Split markdown on delimiter characters, filter for .edu URLs from same domain.
// Catches every URL regardless of markdown nesting.

function extractUrls(markdown: string, baseUrl: string, seen: Set<string>): Array<{ url: string; type: CrawlResult['pageType']; score: number }> {
  const baseRoot = new URL(baseUrl).hostname.replace(/^www\./, '').split('.').slice(-2).join('.');

  // Split on characters that surround URLs in markdown: () [] " ' space newline > <
  const tokens = markdown.split(/[()[\]"'<>\s]+/);

  const results: Array<{ url: string; type: CrawlResult['pageType']; score: number }> = [];

  for (const token of tokens) {
    // Must be a full https URL
    if (!token.startsWith('https://')) continue;

    // Clean trailing punctuation
    const cleaned = token.replace(/[.,;:!?]+$/, '').split('#')[0].split('?')[0].replace(/\/$/, '');

    // Must be .edu and same school
    try {
      const parsed = new URL(cleaned);
      if (!parsed.hostname.endsWith('.edu')) continue;
      const linkRoot = parsed.hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
      if (linkRoot !== baseRoot) continue;
    } catch { continue; }

    // Skip already seen
    if (seen.has(cleaned)) continue;

    // Skip junk
    if (isJunk(cleaned)) continue;
    // Must be under the same program root path
    // /mfin/explore-program → only allow /mfin/*
    try {
      const programRoot = getProgramRoot(baseUrl);
      const linkPath = new URL(cleaned).pathname;
      if (!linkPath.startsWith(programRoot)) continue;
    } catch { continue; }

    seen.add(cleaned);
    const { type, score } = classifyUrl(cleaned);
    results.push({ url: cleaned, type, score });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ---- Fetch a page via Jina ----

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(JINA_PREFIX + url, {
      headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.slice(0, 40000);
  } catch {
    return null;
  }
}

// ---- Fetch batch in parallel ----

async function fetchBatch(
  links: Array<{ url: string; type: CrawlResult['pageType']; score: number }>,
  limit: number,
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  const settled = await Promise.allSettled(
    links.slice(0, limit).map(async (link) => {
      const md = await fetchPage(link.url);
      if (!md || md.length < 500) return null;
      // Soft-404 check
      if (/page\s*not\s*found|404|error/i.test(md.slice(0, 300))) return null;
      return { url: link.url, markdown: md, pageType: link.type, score: link.score } as CrawlResult;
    })
  );
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) results.push(r.value);
  }
  return results;
}

// ---- Get program root path ----

function getProgramRoot(url: string): string {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return '/' + (segments[0] || '');
  return '/' + segments.slice(0, segments.length - 1).join('/');
}

// ---- Find admissions hub ----

async function findAdmissionsHub(
  startUrl: string,
  startPageUrls: Array<{ url: string; type: CrawlResult['pageType']; score: number }>,
  seen: Set<string>,
): Promise<CrawlResult | null> {
  // Strategy A: was an admissions URL found in the start page?
  // Prefer the shortest admissions URL — it's the hub, not a sub-page
  const admLinks = startPageUrls.filter(l => l.type === 'admissions');
  admLinks.sort((a, b) => a.url.length - b.url.length);
  const admLink = admLinks[0];
  if (admLink) {
    const md = await fetchPage(admLink.url);
    if (md && md.length > 500) {
      return { url: admLink.url, markdown: md, pageType: 'admissions', score: admLink.score };
    }
  }

  // Strategy B: probe common paths from program root
  const root = getProgramRoot(startUrl);
  const origin = new URL(startUrl).origin;
  const probes = [
    root + '/admissions',
    root + '/admission',
    root + '/apply',
    root + '/admissions/how-to-apply',
    root + '/how-to-apply',
  ];

  for (const path of probes) {
    const probeUrl = origin + path;
    const normalized = probeUrl.replace(/\/$/, '');
    if (seen.has(normalized)) continue;

    const md = await fetchPage(probeUrl);
    if (md && md.length > 500 && !/page\s*not\s*found|404/i.test(md.slice(0, 300))) {
      seen.add(normalized);
      return { url: normalized, markdown: md, pageType: 'admissions', score: 12 };
    }
  }

  return null;
}

// ---- Pick best links, one per type ----

function pickBest(
  links: Array<{ url: string; type: CrawlResult['pageType']; score: number }>,
  limit: number,
  typesHave: Set<string>,
): Array<{ url: string; type: CrawlResult['pageType']; score: number }> {
  const picked: typeof links = [];
  const typeCount: Record<string, number> = {};
  for (const link of links) {
    if (picked.length >= limit) break;
    const count = typeCount[link.type] || 0;
    // Allow up to 2 admissions pages (hub + how-to-apply with essays)
    const maxPerType = link.type === 'admissions' ? 2 : 1;
    if (typesHave.has(link.type) && count >= maxPerType && link.type !== 'unknown' && link.type !== 'program') continue;
    typesHave.add(link.type);
    typeCount[link.type] = count + 1;
    picked.push(link);
  }
  return picked;
}

// ---- Main crawl ----

export async function crawlProgram(startUrl: string, maxPages = 6): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  const seen = new Set<string>();
  seen.add(startUrl.split('?')[0].split('#')[0].replace(/\/$/, ''));
  const typesHave = new Set<string>();

  // Step 1: Fetch start page
  const startMd = await fetchPage(startUrl);
  if (!startMd) throw new Error(`Failed to fetch: ${startUrl}`);

  const startPath = new URL(startUrl).pathname.toLowerCase();
  const startIsAdmissions = /admissions?|apply|how-to-apply/.test(startPath);
  const startType = startIsAdmissions ? 'admissions' : 'program';

  results.push({ url: startUrl, markdown: startMd, pageType: startType, score: 100 });
  typesHave.add(startType);

  // Extract all URLs from start page
  const startUrls = extractUrls(startMd, startUrl, seen);

  // Step 2: Find admissions hub (if start page isn't already it)
  let hubPage: CrawlResult | null = null;
  if (!startIsAdmissions) {
    hubPage = await findAdmissionsHub(startUrl, startUrls, seen);
    if (hubPage) {
      results.push(hubPage);
      typesHave.add('admissions');
    }
  }

  // Step 3: Extract URLs from admissions hub — this is where the gold is
  const hub = hubPage || (startIsAdmissions ? results[0] : null);
  let hubUrls: typeof startUrls = [];
  if (hub) {
    hubUrls = extractUrls(hub.markdown, startUrl, seen);
  }

  // Step 4: Merge all discovered URLs, pick the best
  const allUrls = [...hubUrls, ...startUrls];
  allUrls.sort((a, b) => b.score - a.score);

  const remaining = maxPages - results.length;
  const toPick = pickBest(allUrls, remaining, typesHave);
  const fetched = await fetchBatch(toPick, remaining);
  results.push(...fetched);

  return results;
}

// ---- Build context for Claude ----

export function buildExtractionContext(pages: CrawlResult[]): string {
  const priority: Record<string, number> = {
    admissions: 5, requirements: 4, faq: 3, financial: 3, deadlines: 3, program: 2, unknown: 1,
  };
  const sorted = [...pages].sort((a, b) => (priority[b.pageType] || 0) - (priority[a.pageType] || 0));

  let ctx = '';
  for (const page of sorted) {
    ctx += `\n\n=== PAGE: ${page.url} (type: ${page.pageType}) ===\n\n`;
    ctx += page.markdown;
  }
  return ctx;
}