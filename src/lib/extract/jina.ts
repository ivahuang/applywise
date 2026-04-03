/**
 * Jina Reader: converts any URL to clean markdown.
 * Free, no API key needed.
 * https://r.jina.ai/
 */

export interface JinaResult {
  ok: boolean;
  title: string;
  markdown: string;
  url: string;
  error?: string;
}

export async function fetchWithJina(url: string): Promise<JinaResult> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  try {
    const res = await fetch(jinaUrl, {
      headers: { Accept: "text/markdown" },
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!res.ok) {
      return { ok: false, title: "", markdown: "", url, error: `Jina returned ${res.status}` };
    }

    const text = await res.text();

    // Jina returns markdown with a title line and URL line at the top
    const titleMatch = text.match(/^Title:\s*(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? "";

    return { ok: true, title, markdown: text, url };
  } catch (err: any) {
    return {
      ok: false,
      title: "",
      markdown: "",
      url,
      error: err.message ?? "Failed to fetch via Jina Reader",
    };
  }
}
