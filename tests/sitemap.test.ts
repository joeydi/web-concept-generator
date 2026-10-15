import { describe, expect, it } from "vitest";
import { parseSitemap, pickPages, sitemapsFromRobots } from "@/lib/server/sitemap";

describe("parseSitemap", () => {
  it("reads a urlset", () => {
    const r = parseSitemap(`<?xml version="1.0"?><urlset><url><loc>https://a.com/</loc></url><url><loc>https://a.com/services</loc></url></urlset>`);
    expect(r.urls).toEqual(["https://a.com/", "https://a.com/services"]);
  });
  it("reads a single-entry urlset (parser yields an object, not an array)", () => {
    expect(parseSitemap(`<urlset><url><loc>https://a.com/x</loc></url></urlset>`).urls).toEqual(["https://a.com/x"]);
  });
  it("reads a sitemap index", () => {
    const r = parseSitemap(`<sitemapindex><sitemap><loc>https://a.com/p.xml</loc></sitemap><sitemap><loc>https://a.com/q.xml</loc></sitemap></sitemapindex>`);
    expect(r.sitemaps).toHaveLength(2);
    expect(r.urls).toHaveLength(0);
  });
  it("survives garbage", () => expect(parseSitemap("not xml <<<")).toEqual({ urls: [], sitemaps: [] }));
});

describe("sitemapsFromRobots", () => {
  it("finds Sitemap lines case-insensitively", () => {
    expect(sitemapsFromRobots("User-agent: *\nDisallow: /x\nSITEMAP: https://a.com/s.xml\nsitemap: https://a.com/t.xml")).toEqual(["https://a.com/s.xml", "https://a.com/t.xml"]);
  });
});

describe("pickPages navigation and slugs", () => {
  it("boosts nav links and penalises long article slugs", () => {
    const urls = [
      "https://a.com/stay-storm-ready-snow-facts-best-practices-service-insights-from-us/",
      "https://a.com/what-we-do", "https://a.com/our-team",
    ];
    const picked = pickPages("https://a.com", urls, 3, ["https://a.com/what-we-do"]);
    expect(picked[1]).toBe("https://a.com/what-we-do");
    expect(picked).not.toContain("https://a.com/stay-storm-ready-snow-facts-best-practices-service-insights-from-us");
  });
});

describe("pickPages", () => {
  const urls = [
    "https://a.com/", "https://a.com/services/patios", "https://a.com/services", "https://a.com/about-us", "https://a.com/blog/one",
    "https://a.com/blog/two", "https://a.com/blog/three", "https://a.com/contact", "https://a.com/photo.jpg", "https://other.com/services",
  ];
  const picked = pickPages("https://a.com", urls, 6);
  it("starts with the origin and stays on-site", () => {
    expect(picked[0]).toBe("https://a.com");
    expect(picked.every((u) => u.startsWith("https://a.com"))).toBe(true);
  });
  it("prefers services and about, skips assets, caps per section", () => {
    expect(picked).toContain("https://a.com/services");
    expect(picked).toContain("https://a.com/about-us");
    expect(picked.some((u) => u.endsWith(".jpg"))).toBe(false);
    expect(picked.filter((u) => u.includes("/blog/")).length).toBeLessThanOrEqual(2);
  });
});
