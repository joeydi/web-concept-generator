import { describe, expect, it } from "vitest";
import { parsePage, type ImageCandidate } from "@/lib/server/crawl";
import { rankImages, scoreImage } from "@/lib/server/images";

const cand = (o: Partial<ImageCandidate>): ImageCandidate => ({ url: "https://a.com/wp-content/uploads/patio.jpg", alt: "stone patio", width: 1200, height: 800, source: "img", pageUrl: "https://a.com", order: 0, nearHeading: "", ...o });

describe("scoreImage", () => {
  it("rejects logos, icons, svg/gif and tiny images", () => {
    expect(scoreImage(cand({ url: "https://a.com/img/logo.png" }))).toBe(0);
    expect(scoreImage(cand({ url: "https://a.com/img/facebook-icon.png" }))).toBe(0);
    expect(scoreImage(cand({ url: "https://a.com/hero.svg" }))).toBe(0);
    expect(scoreImage(cand({ url: "https://a.com/anim.gif" }))).toBe(0);
    expect(scoreImage(cand({ width: 120, height: 90 }))).toBe(0);
  });
  it("scores a good photo and prefers og:image and larger sizes", () => {
    expect(scoreImage(cand({}))).toBeGreaterThan(0);
    expect(scoreImage(cand({ source: "og" }))).toBeGreaterThan(scoreImage(cand({})));
    expect(scoreImage(cand({ width: 2000, height: 1300 }))).toBeGreaterThan(scoreImage(cand({ width: 500, height: 330 })));
  });
});

describe("rankImages", () => {
  it("dedupes WordPress size variants and orders by score", () => {
    const r = rankImages([
      cand({ url: "https://a.com/u/patio-300x200.jpg", width: 300, height: 200 }),
      cand({ url: "https://a.com/u/patio.jpg", width: 1600, height: 900 }),
      cand({ url: "https://a.com/u/logo.png" }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].url).toBe("https://a.com/u/patio-300x200.jpg");
  });
});

describe("parsePage", () => {
  const html = `<html><head><title>Acme Landscaping</title><meta name="description" content="We build yards"><meta property="og:image" content="/og.jpg">
    <script type="application/ld+json">{"@type":"LocalBusiness","name":"Acme"}</script></head>
    <body><nav><a href="/services">Services</a></nav><main><h1>Landscape design</h1>
    <img src="/img/a.jpg" alt="Garden" width="900" height="600"><img data-src="/img/lazy.jpg" srcset="/s-400.jpg 400w, /s-1200.jpg 1200w">
    <img src="data:image/gif;base64,AAA"><script>ignored()</script><p>Real text here.</p></main></body></html>`;
  const p = parsePage(html, "https://acme.com/");
  it("extracts metadata and text, drops scripts", () => {
    expect(p.title).toBe("Acme Landscaping");
    expect(p.description).toBe("We build yards");
    expect(p.text).toContain("Real text here.");
    expect(p.text).not.toContain("ignored");
    expect(p.jsonld).toContain("LocalBusiness");
    expect(p.links).toContain("https://acme.com/services");
  });
  it("collects og, img and best srcset candidates with absolute URLs and skips data URIs", () => {
    const urls = p.images.map((i) => i.url);
    expect(urls).toContain("https://acme.com/og.jpg");
    expect(urls).toContain("https://acme.com/img/a.jpg");
    expect(urls).toContain("https://acme.com/s-1200.jpg");
    expect(urls.some((u) => u.startsWith("data:"))).toBe(false);
    expect(p.images.find((i) => i.url.endsWith("a.jpg"))?.nearHeading).toBe("Landscape design");
  });
});
