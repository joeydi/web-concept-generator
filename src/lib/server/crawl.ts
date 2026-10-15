import * as cheerio from "cheerio";
import { decode, safeFetch } from "./ssrf";

export interface ImageCandidate {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  /** where it came from; og/hero images are strong signals */
  source: "og" | "img" | "srcset" | "jsonld";
  pageUrl: string;
  order: number;
  nearHeading: string;
}

export interface PageData {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  links: string[];
  images: ImageCandidate[];
  jsonld: string;
}

const num = (v: string | undefined) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : null;
};

function absolutize(src: string | undefined, base: string): string | null {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return null;
  try {
    const u = new URL(src.trim(), base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch { return null; }
}

/** Largest candidate in a srcset ("a.jpg 400w, b.jpg 1200w"). */
function bestSrcset(srcset: string, base: string): { url: string; width: number | null } | null {
  let best: { url: string; width: number | null } | null = null;
  for (const part of srcset.split(",")) {
    const [u, d] = part.trim().split(/\s+/);
    const url = absolutize(u, base);
    if (!url) continue;
    const w = d?.endsWith("w") ? num(d) : null;
    if (!best || (w ?? 0) > (best.width ?? 0)) best = { url, width: w };
  }
  return best;
}

export function parsePage(html: string, url: string): PageData {
  const $ = cheerio.load(html);
  const images: ImageCandidate[] = [];
  let order = 0;
  const push = (c: Omit<ImageCandidate, "pageUrl" | "order">) => images.push({ ...c, pageUrl: url, order: order++ });

  const og = absolutize($('meta[property="og:image"]').attr("content"), url);
  if (og) push({ url: og, alt: "", width: num($('meta[property="og:image:width"]').attr("content")), height: num($('meta[property="og:image:height"]').attr("content")), source: "og", nearHeading: "" });

  const jsonldParts: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (raw && raw.length < 20_000) jsonldParts.push(raw);
  });

  $("script, style, noscript, svg, iframe, form, template").remove();

  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const u = absolutize($(el).attr("href"), url);
    if (u) links.add(u.split("#")[0]);
  });

  let heading = "";
  $("h1, h2, h3, img, picture source").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    if (tag === "h1" || tag === "h2" || tag === "h3") { heading = $el.text().replace(/\s+/g, " ").trim().slice(0, 120); return; }
    if (tag === "source") {
      const b = bestSrcset($el.attr("srcset") ?? "", url);
      if (b) push({ url: b.url, alt: "", width: b.width, height: null, source: "srcset", nearHeading: heading });
      return;
    }
    const lazy = $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("data-original");
    const set = $el.attr("srcset") || $el.attr("data-srcset");
    const best = set ? bestSrcset(set, url) : null;
    const src = best?.url ?? absolutize(lazy || $el.attr("src"), url);
    if (!src) return;
    push({
      url: src, alt: ($el.attr("alt") ?? "").trim(), width: best?.width ?? num($el.attr("width")), height: num($el.attr("height")),
      source: best ? "srcset" : "img", nearHeading: heading,
    });
  });

  const headings = $("h1, h2, h3").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get().filter(Boolean).slice(0, 30);
  $("nav, header, footer, aside").remove();
  const text = ($("main").length ? $("main") : $("body")).text().replace(/\s+/g, " ").trim().slice(0, 6000);

  return {
    url,
    title: $("title").first().text().replace(/\s+/g, " ").trim(),
    description: ($('meta[name="description"]').attr("content") ?? $('meta[property="og:description"]').attr("content") ?? "").trim(),
    headings, text, links: [...links], images,
    jsonld: jsonldParts.join("\n").slice(0, 4000),
  };
}

export async function fetchPage(url: string): Promise<PageData | null> {
  try {
    const r = await safeFetch(url, { timeoutMs: 6000, maxBytes: 1_500_000 });
    if (r.status >= 400 || !/html|xml/i.test(r.contentType)) return null;
    return parsePage(decode(r.body), r.url);
  } catch { return null; }
}
