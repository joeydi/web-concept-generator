import type { ImageCandidate } from "./crawl";
import { safeFetch } from "./ssrf";

const JUNK = /(logo|icon|sprite|favicon|avatar|badge|placeholder|spacer|pixel|blank|loading|spinner|arrow|button|banner-ad|payment|visa|mastercard|paypal|star|rating|social|facebook|twitter|instagram|linkedin|yelp|google|bbb|seal|trust|flag|emoji|gravatar|1x1)/i;
const BAD_EXT = /\.(svg|gif|ico|bmp|tiff?)(\?|$)/i;

/** Score a candidate; <= 0 means discard. Pure. */
export function scoreImage(c: ImageCandidate): number {
  const u = c.url.toLowerCase();
  if (BAD_EXT.test(u)) return 0;
  const name = u.split("/").pop() ?? "";
  if (JUNK.test(name) || JUNK.test(c.alt)) return 0;
  if ((c.width !== null && c.width < 300) || (c.height !== null && c.height < 180)) return 0;
  let s = 10;
  if (c.source === "og") s += 25;
  if (c.width) s += Math.min(c.width, 2000) / 100;
  if (c.height && c.width) {
    const r = c.width / c.height;
    if (r < 0.6 || r > 3.2) s -= 8; // very tall/wide strips make poor card art
  }
  if (c.alt.length > 8) s += 3;
  s -= Math.min(c.order, 40) * 0.15; // earlier on the page is more prominent
  if (/wp-content\/uploads|\/images?\/|cdn|cloudinary|imgix|squarespace-cdn|wixstatic/.test(u)) s += 2;
  return s;
}

export function rankImages(cands: ImageCandidate[]): (ImageCandidate & { score: number })[] {
  const seen = new Set<string>();
  const out: (ImageCandidate & { score: number })[] = [];
  for (const c of cands) {
    // collapse WordPress-style size suffixes so -300x200 variants dedupe
    const key = c.url.replace(/-(scaled|\d{2,4}x\d{2,4})(?=\.\w+(\?|$))/, "").split("?")[0];
    if (seen.has(key)) continue;
    const score = scoreImage(c);
    if (score <= 0) continue;
    seen.add(key);
    out.push({ ...c, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** HEAD-check that a candidate is really a reasonably sized image. */
export async function verifyImage(url: string): Promise<boolean> {
  try {
    const r = await safeFetch(url, { method: "HEAD", timeoutMs: 4000 });
    if (r.status >= 400) return false;
    if (!/^image\/(jpe?g|png|webp|avif)/i.test(r.contentType)) return false;
    if (r.contentLength !== null && (r.contentLength < 8_000 || r.contentLength > 12_000_000)) return false;
    return true;
  } catch { return false; }
}

export interface ImageSlots {
  hero: string | null;
  banner: string | null;
  services: (string | null)[];
  detail: string | null;
}

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? []);

/**
 * Assign ranked, verified images to board slots. Services prefer an image whose alt/heading
 * overlaps the service name; everything else falls back to overall rank. Never reuses an image.
 */
export async function assignImages(cands: ImageCandidate[], services: string[]): Promise<ImageSlots> {
  const ranked = rankImages(cands).slice(0, 24);
  const verified: typeof ranked = [];
  await Promise.all(
    ranked.map(async (c) => { if (await verifyImage(c.url)) verified.push(c); }),
  );
  verified.sort((a, b) => b.score - a.score);
  const pool = [...verified];
  const take = (pred?: (c: (typeof pool)[number]) => boolean): string | null => {
    const i = pred ? pool.findIndex(pred) : 0;
    if (i < 0 || !pool.length) return null;
    return pool.splice(i, 1)[0].url;
  };
  const wide = (c: (typeof pool)[number]) => !c.width || !c.height || c.width / c.height > 1.3;
  const hero = take(wide) ?? take();
  const banner = take(wide) ?? take();
  const svc = services.map((name) => {
    const w = words(name);
    const match = take((c) => [...words(c.alt + " " + c.nearHeading)].some((x) => w.has(x)));
    return match ?? take();
  });
  const detail = take() ;
  return { hero, banner, services: svc, detail };
}
