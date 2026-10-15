import { describe, expect, it } from "vitest";
import { contrast, hexToRgb, normalizePalette } from "@/lib/color";
import { PRESETS } from "@/lib/presets";
import { StyleSchema, ContentSchema } from "@/lib/types";

const c = (a: string, b: string) => contrast(hexToRgb(a), hexToRgb(b));

describe("normalizePalette", () => {
  const cases: Record<string, { bg: string; ink: string; accent: string }> = {
    "very dark": { bg: "#050505", ink: "#101010", accent: "#202020" },
    "very light": { bg: "#fefefe", ink: "#fafafa", accent: "#fdfdfd" },
    "mid grey": { bg: "#808080", ink: "#7a7a7a", accent: "#858585" },
    "saturated": { bg: "#ff00ff", ink: "#ff33ff", accent: "#ff66ff" },
  };
  for (const [name, p] of Object.entries(cases)) {
    it(`meets the contrast rules for ${name} input`, () => {
      const n = normalizePalette(p);
      expect(c(n.ink, n.bg)).toBeGreaterThanOrEqual(7);
      expect(c(n.accent, n.bg)).toBeGreaterThanOrEqual(3);
      expect(c(n.accentInk, n.accent)).toBeGreaterThanOrEqual(4.5);
      expect(c(n.muted, n.surface)).toBeGreaterThanOrEqual(4.5);
      for (const v of Object.values(n)) expect(v).toMatch(/^#[0-9a-f]{6}$/);
    });
  }
});

describe("presets", () => {
  it("are valid styles with legible ink and covered layouts", () => {
    for (const s of PRESETS) {
      expect(StyleSchema.safeParse(s).success).toBe(true);
      expect(c(s.palette.ink, s.palette.bg)).toBeGreaterThanOrEqual(7);
    }
    expect(new Set(PRESETS.map((s) => s.layout)).size).toBe(6);
  });
});

describe("schemas", () => {
  it("reject bad hex and unknown fonts, and migrate unknown layout names", () => {
    const ok = PRESETS[0];
    expect(StyleSchema.safeParse({ ...ok, palette: { ...ok.palette, bg: "red" } }).success).toBe(false);
    expect(StyleSchema.safeParse({ ...ok, fonts: { display: "comic-sans", body: "inter" } }).success).toBe(false);
    // an unrecognised legacy layout name is migrated to the default archetype rather than rejected
    expect(StyleSchema.parse({ ...ok, layout: "wobbly" }).layout.name).toBe("Asymmetrical");
  });
  it("content schema accepts null images", () => {
    expect(ContentSchema.safeParse({
      domain: "a.com", name: "A", nav: [], cta: "x", homeTitle: "t", homeBlurb: "b", facts: [], bannerTitle: "b", services: [], detailTitle: "d",
      detailBlurb: "b", byline: { name: "n", role: "r" }, subhead: "s", body: [], images: { hero: null, banner: null, services: [null], detail: null },
    }).success).toBe(true);
  });
});
