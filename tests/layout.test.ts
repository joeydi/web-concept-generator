import { describe, expect, it } from "vitest";
import { DEFAULT_SPEC, LAYOUT_PRESETS, LayoutSchema, LayoutSpecSchema, layoutAttrs, migrateLayout, normalizeLayout } from "@/lib/layout";
import { PRESETS } from "@/lib/presets";
import { parseStoredStyles } from "@/lib/history";
import { StyleSchema } from "@/lib/types";

describe("normalizeLayout", () => {
  it("fills every field from defaults when given nothing", () => {
    expect(normalizeLayout(undefined)).toEqual(DEFAULT_SPEC);
    expect(normalizeLayout({})).toEqual(DEFAULT_SPEC);
    expect(LayoutSpecSchema.safeParse(normalizeLayout(null)).success).toBe(true);
  });

  it("clamps numbers into range and ignores non-numbers", () => {
    const s = normalizeLayout({ headlineScale: 9, heroSplit: -3, tilt: 50, imageHeight: "tall", stagger: Number.NaN, imageWidth: 5 });
    expect(s.headlineScale).toBe(2.2);
    expect(s.heroSplit).toBe(0.3);
    expect(s.tilt).toBe(3);
    expect(s.imageHeight).toBe(DEFAULT_SPEC.imageHeight);
    expect(s.stagger).toBe(DEFAULT_SPEC.stagger);
    expect(s.imageWidth).toBe(1.08);
  });

  it("snaps unknown enums to defaults", () => {
    const s = normalizeLayout({ nav: "sideways", heroMode: 7, cardChrome: "neon", imageTreatment: "wobbly" });
    expect(s.nav).toBe(DEFAULT_SPEC.nav);
    expect(s.heroMode).toBe(DEFAULT_SPEC.heroMode);
    expect(s.cardChrome).toBe(DEFAULT_SPEC.cardChrome);
    expect(s.imageTreatment).toBe(DEFAULT_SPEC.imageTreatment);
  });

  it("is idempotent", () => {
    const messy = normalizeLayout({ headlineScale: 2, heroMode: "split", headlineOverlap: 1, imageHeight: 0.3, cardLayout: "list", cardChrome: "outlined", tilt: 2 });
    expect(normalizeLayout(messy)).toEqual(messy);
  });

  describe("repairs", () => {
    it("keeps text left-aligned with a vertical nav", () => {
      expect(normalizeLayout({ nav: "vertical", align: "center" }).align).toBe("left");
    });
    it("gives an overlapping headline an image tall enough to absorb it", () => {
      expect(normalizeLayout({ headlineOverlap: 0.8, imageHeight: 0.3 }).imageHeight).toBe(0.4);
    });
    it("stacks a huge headline instead of wrapping it into the intro column", () => {
      expect(normalizeLayout({ headlineScale: 2, heroMode: "split", blurb: "plain" }).heroMode).toBe("stacked");
      // ...but a tilted note floating over a split hero is the one exception
      expect(normalizeLayout({ headlineScale: 2, heroMode: "split", blurb: "accent-tilted" }).heroMode).toBe("split");
    });
    it("forces split mode for a tilted accent note", () => {
      expect(normalizeLayout({ blurb: "accent-tilted", heroMode: "overlay" }).heroMode).toBe("split");
    });
    it("flattens list cards", () => {
      const s = normalizeLayout({ cardLayout: "list", stagger: 1, tilt: 3, cardOverlap: 1, cardChrome: "outlined" });
      expect([s.stagger, s.tilt, s.cardOverlap, s.cardChrome]).toEqual([0, 0, 0, "bare"]);
    });
    it("drops card overlap under a plain banner and enlarges short banners", () => {
      expect(normalizeLayout({ cardOverlap: 1, bannerTitle: "plain" }).cardOverlap).toBe(0);
      expect(normalizeLayout({ cardOverlap: 1, bannerHeight: 0.15 }).bannerHeight).toBe(0.25);
    });
    it("unframes the image behind a title-over-image header", () => {
      expect(normalizeLayout({ detailMode: "title-over-image", imageTreatment: "framed" }).imageTreatment).toBe("inset");
    });
    it("pairs centered text with a below-byline", () => {
      expect(normalizeLayout({ align: "center", byline: "side" }).byline).toBe("below");
    });
    it("widens diagonal and full-bleed images", () => {
      expect(normalizeLayout({ imageTreatment: "diagonal", imageWidth: 0.5 }).imageWidth).toBe(1);
    });
  });
});

describe("presets", () => {
  it("every preset spec is already normalised and schema-valid", () => {
    for (const [key, l] of Object.entries(LAYOUT_PRESETS)) {
      expect(normalizeLayout(l.spec), key).toEqual(l.spec);
      expect(LayoutSchema.safeParse(l).success, key).toBe(true);
    }
  });
  it("the six presets are distinct", () => {
    const sigs = new Set(Object.values(LAYOUT_PRESETS).map((l) => JSON.stringify(l.spec)));
    expect(sigs.size).toBe(6);
  });
  it("built-in styles parse", () => {
    for (const s of PRESETS) expect(StyleSchema.safeParse(s).success, s.id).toBe(true);
  });
});

describe("migrateLayout", () => {
  it("maps legacy enum strings to preset layouts", () => {
    expect(migrateLayout("clean")).toEqual(LAYOUT_PRESETS.clean);
    expect(migrateLayout("avant-garde").spec.nav).toBe("vertical");
  });
  it("falls back for unknown strings and junk", () => {
    expect(migrateLayout("nonsense")).toEqual(LAYOUT_PRESETS.asymmetrical);
    expect(migrateLayout(42)).toEqual(LAYOUT_PRESETS.asymmetrical);
  });
  it("normalises a partial stored object", () => {
    const l = migrateLayout({ name: "Mine", spec: { headlineScale: 99 } });
    expect(l.name).toBe("Mine");
    expect(l.spec.headlineScale).toBe(2.2);
  });
  it("lets StyleSchema accept legacy stored styles", () => {
    const legacy = { ...PRESETS[0], layout: "traditional" };
    const parsed = StyleSchema.parse(legacy);
    expect(parsed.layout.name).toBe("Traditional");
  });
});

describe("layoutAttrs", () => {
  it("emits attributes and variables for the renderer", () => {
    const { attrs, vars } = layoutAttrs(LAYOUT_PRESETS.overlapping.spec);
    expect(attrs["data-hero-mode"]).toBe("overlay");
    expect(attrs["data-card-overlap"]).toBe("on");
    expect(attrs["data-title-overlap"]).toBe("on");
    expect(vars["--hero-cols"]).toBe("58.30fr 41.70fr");
    expect(vars["--tilt"]).toBe("0deg");
  });
});

describe("parseStoredStyles", () => {
  it("migrates legacy string layouts, keeps new ones and drops junk", () => {
    const out = parseStoredStyles([
      { ...PRESETS[0], id: "a", layout: "clean", custom: true },
      { ...PRESETS[1], id: "b", custom: true },
      { id: "broken" },
      null,
    ]);
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
    expect(out[0].layout.spec.nav).toBe("ruled");
    expect(out.every((s) => s.custom)).toBe(true);
  });
  it("returns [] for non-arrays", () => { expect(parseStoredStyles({})).toEqual([]); expect(parseStoredStyles(undefined)).toEqual([]); });
});
