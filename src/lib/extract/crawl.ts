// ============================================================
// MULTI-PAGE CRAWLER
// Given one .edu URL, discovers and fetches related pages
// (admissions, requirements, how-to-apply, deadlines, etc.)
// to build a complete picture of the program.
// ============================================================

const JINA_PREFIX = 'https://r.jina.ai/';

export interface CrawlResult {
  url: string;
  markdown: string;
  pageType: 'program' | 'admissions' | 'requirements' | 'deadlines' | 'financial' | 'faq' | 'unknown';
}

// Keywords that signal important linked pages
const ADMISSIONS_KEYWORDS = [
  'admission', 'apply', 'how to apply', 'application', 'requirements',
  'admissions requirements', 'how-to-apply', 'prospective',
];
const DEADLINE_KEYWORDS = ['deadline', 'dates', 'timeline', 'when to apply'];
const FINANCIAL_KEYWORDS = ['tuition', 'financial aid', 'cost', 'fees', 'scholarship', 'funding'];
const REQUIREMENTS_KEYWORDS = ['requirements', 'prerequisites', 'what you need', 'checklist'];

function classifyUrl(url: string, linkText: string): CrawlResult['pageType'] {
  const combined = (url + ' ' + linkText).toLowerCase();
  if (DEADLINE_KEYWORDS.some(k => combined.includes(k))) return 'deadlines';
  if (FINANCIAL_KEYWORDS.some(k => combined.includes(k))) return 'financial';
  if (REQUIREMENTS_KEYWORDS.some(k => combined.includes(k))) return 'requirements';
  if (ADMISSIONS_KEYWORDS.some(k => combined.includes(k))) return 'admissions';
  return 'unknown';
}

// Fetch a single page via Jina Reader
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
    // Jina returns markdown; truncate if huge
    return text.slice(0, 30000);
  } catch {
    return null;
  }
}

// Extract links from markdown that look like related pages on the same domain
function extractRelatedLinks(markdown: string, baseUrl: string): Array<{ url: string; text: string }> {
  const baseDomain = new URL(baseUrl).hostname.replace(/^www\./, '');
  const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const links: Array<{ url: string; text: string }> = [];
  const seen = new Set<string>();

  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const [, text, url] = match;
    try {
      const linkDomain = new URL(url).hostname.replace(/^www\./, '');
      // Same school domain (e.g. sps.columbia.edu matches columbia.edu)
      const baseRoot = baseDomain.split('.').slice(-2).join('.');
      const linkRoot = linkDomain.split('.').slice(-2).join('.');
      if (baseRoot !== linkRoot) continue;
      
      // Skip non-content pages
      if (url.includes('#') || url.endsWith('.pdf') || url.endsWith('.jpg') || url.endsWith('.png')) continue;
      if (url.includes('login') || url.includes('calendar') || url.includes('news') || url.includes('events')) continue;
      
      const normalized = url.split('?')[0].replace(/\/$/, '');
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      const type = classifyUrl(url, text);
      if (type !== 'unknown') {
        links.push({ url: normalized, text });
      }
    } catch { /* invalid URL, skip */ }
  }

  return links;
}

// Main crawl function: start from one URL, discover and fetch up to N related pages
export async function crawlProgram(startUrl: string, maxPages = 4): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];

  // 1. Fetch the starting page
  const mainMarkdown = await fetchPage(startUrl);
  if (!mainMarkdown) {
    throw new Error(`Failed to fetch: ${startUrl}`);
  }
  results.push({ url: startUrl, markdown: mainMarkdown, pageType: 'program' });

  // 2. Find related links on the same domain
  const relatedLinks = extractRelatedLinks(mainMarkdown, startUrl);
  
  // 3. Prioritize: admissions > requirements > deadlines > financial
  const priorityOrder: CrawlResult['pageType'][] = ['admissions', 'requirements', 'deadlines', 'financial'];
  const sortedLinks = relatedLinks.sort((a, b) => {
    const aType = classifyUrl(a.url, a.text);
    const bType = classifyUrl(b.url, b.text);
    return priorityOrder.indexOf(aType) - priorityOrder.indexOf(bType);
  });

  // 4. Fetch top N related pages in parallel
  const toFetch = sortedLinks.slice(0, maxPages - 1);
  const fetched = await Promise.allSettled(
    toFetch.map(async (link) => {
      const md = await fetchPage(link.url);
      if (!md) return null;
      return {
        url: link.url,
        markdown: md,
        pageType: classifyUrl(link.url, link.text),
      } as CrawlResult;
    })
  );

  for (const result of fetched) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  }

  return results;
}

// Combine all crawled pages into a single context string for Claude
export function buildExtractionContext(pages: CrawlResult[]): string {
  let context = '';
  for (const page of pages) {
    context += `\n\n=== PAGE: ${page.url} (type: ${page.pageType}) ===\n\n`;
    context += page.markdown;
  }
  return context;
}
