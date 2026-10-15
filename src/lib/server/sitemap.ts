import { XMLParser } from "fast-xml-parser";
import { decode, safeFetch } from "./ssrf";

const parser = new XMLParser({ ignoreAttributes: true });
const asArray = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Pure parser: returns page URLs and any nested sitemap URLs found in one sitemap document. */
export function parseSitemap(xml: string): { urls: string[]; sitemaps: string[] } {
  type Loc = { loc?: unknown };
  let doc: { urlset?: { url?: Loc | Loc[] }; sitemapindex?: { sitemap?: Loc | Loc[] } } | undefined;
  try { doc = parser.parse(xml); } catch { return { urls: [], sitemaps: [] }; }
  const urls = asArray(doc?.urlset?.url).map((u) => String(u?.loc ?? "")).filter(Boolean);
  const sitemaps = asArray(doc?.sitemapindex?.sitemap).map((s) => String(s?.loc ?? "")).filter(Boolean);
  return { urls, sitemaps };
}

export function sitemapsFromRobots(txt: string): string[] {
  return [...txt.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
}

const SECTION_HINTS: [RegExp, number][] = [
  [/(service|what-we-do|solutions|offerings|capabilit)/i, 6],
  [/(about|our-story|team|who-we-are|company)/i, 5],
  [/(project|portfolio|work|gallery|case-stud)/i, 4],
  [/(blog|news|article|post|guide|resource)/i, 3],
  [/(contact|location|areas?-served|service-area)/i, 2],
];

/**
 * Choose a small, varied set of pages: the home page first, then pages whose first path segment
 * looks like a services/about/work section. Links found in the home page's own navigation get a
 * boost, and long article-style slugs are penalised so we don't read six blog posts.
 */
export function pickPages(origin: string, urls: string[], limit = 6, navLinks: string[] = []): string[] {
  const host = new URL(origin).hostname.replace(/^www\./, "");
  const norm = (u: string) => { try { const p = new URL(u); p.hash = ""; p.search = ""; return p.toString().replace(/\/$/, ""); } catch { return ""; } };
  const nav = new Set(navLinks.map(norm));
  const seen = new Set<string>();
  const cands: { url: string; score: number }[] = [];
  for (const u of [...navLinks, ...urls]) {
    const key = norm(u);
    if (!key || seen.has(key)) continue;
    const p = new URL(key);
    if (p.hostname.replace(/^www\./, "") !== host) continue;
    if (/\.(jpe?g|png|gif|webp|svg|pdf|zip|xml|css|js)$/i.test(p.pathname)) continue;
    seen.add(key);
    if (p.pathname === "/" || p.pathname === "") continue;
    const segs = p.pathname.split("/").filter(Boolean);
    let score = 0;
    for (const [re, s] of SECTION_HINTS) if (re.test(segs[0])) score = Math.max(score, s);
    if (!score) for (const [re, s] of SECTION_HINTS) if (re.test(p.pathname)) score = Math.max(score, s / 3);
    score -= (segs.length - 1) * 0.6;
    if (nav.has(key)) score += 2;
    const slug = segs[segs.length - 1];
    if (slug.split("-").length > 5 || slug.length > 40) score -= 4;
    cands.push({ url: key, score });
  }
  cands.sort((a, b) => b.score - a.score);
  const perSection = new Map<string, number>();
  const out = [origin];
  for (const c of cands) {
    if (out.length >= limit) break;
    const sec = new URL(c.url).pathname.split("/")[1] ?? "";
    const n = perSection.get(sec) ?? 0;
    if (n >= 2) continue;
    perSection.set(sec, n + 1);
    out.push(c.url);
  }
  return out;
}

/** Collect candidate page URLs from robots.txt / sitemap.xml (bounded). */
export async function discoverUrls(origin: string): Promise<string[]> {
  const queue: string[] = [];
  try {
    const r = await safeFetch(new URL("/robots.txt", origin).toString(), { timeoutMs: 4000, maxBytes: 200_000 });
    if (r.status === 200) queue.push(...sitemapsFromRobots(decode(r.body)));
  } catch { /* ignore */ }
  if (!queue.length) queue.push(new URL("/sitemap.xml", origin).toString(), new URL("/sitemap_index.xml", origin).toString());
  const urls: string[] = [];
  const done = new Set<string>();
  while (queue.length && done.size < 6 && urls.length < 500) {
    const sm = queue.shift()!;
    if (done.has(sm)) continue;
    done.add(sm);
    try {
      const r = await safeFetch(sm, { timeoutMs: 5000, maxBytes: 2_000_000 });
      if (r.status !== 200) continue;
      const p = parseSitemap(decode(r.body));
      urls.push(...p.urls);
      queue.push(...p.sitemaps.slice(0, 4));
    } catch { /* ignore */ }
  }
  return urls;
}
