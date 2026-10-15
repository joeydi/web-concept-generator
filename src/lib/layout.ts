import { z } from "zod";

/* ───────── schema ───────── */

export const NAV = ["inline", "centered", "masthead", "vertical", "ruled"] as const;
export const ALIGN = ["left", "center"] as const;
export const HERO_MODE = ["split", "stacked", "overlay"] as const;
export const BLURB = ["plain", "card", "accent-tilted"] as const;
export const IMAGE = ["bleed", "inset", "full", "framed", "diagonal"] as const;
export const CARD_LAYOUT = ["equal", "asymmetric", "list"] as const;
export const CARD_CHROME = ["bare", "filled", "outlined"] as const;
export const BANNER = ["overlay", "centered", "plain", "oversize"] as const;
export const DETAIL = ["image-left", "image-right", "stacked", "title-over-image"] as const;
export const BYLINE = ["side", "below", "rail"] as const;

/** Every field is required so the model fills the whole spec (structured outputs cap optional fields). */
export const LayoutSpecSchema = z.object({
  nav: z.enum(NAV).describe("Header style: inline brand+links; centered stack; masthead with double rules; vertical links down the right edge; ruled with a bottom hairline"),
  align: z.enum(ALIGN).describe("Text alignment of hero, cards and article: left or center"),
  heroMode: z.enum(HERO_MODE).describe("split = headline beside intro; stacked = headline above intro; overlay = intro card overlapping the image"),
  heroSplit: z.number().describe("0.3-0.6: width share of the headline column in split/overlay mode"),
  headlineScale: z.number().describe("0.7-2.2: homepage headline size multiplier (1 = 104px)"),
  headlineOverlap: z.number().describe("0-1: how far the headline overlaps the content below it (0 none, 1 strong)"),
  blurb: z.enum(BLURB).describe("Intro paragraph treatment: plain, on a surface card, or an accent-coloured tilted note floating over the hero"),
  dropCap: z.boolean().describe("Large drop cap on the intro paragraph"),
  imageTreatment: z.enum(IMAGE).describe("bleed = flush to the right edge; inset = within margins; full = edge to edge; framed = thick border frame; diagonal = angled cut, cropped"),
  imageHeight: z.number().describe("0.25-0.7: hero image height as a fraction of the page height"),
  imageWidth: z.number().describe("0.4-1.08: hero image width as a fraction of the content width"),
  imageLift: z.number().describe("0-1: pulls the hero image upward under the headline"),
  imageOffset: z.number().describe("0-1: indents the hero image from the left"),
  facts: z.boolean().describe("Show the row of key facts under the hero"),
  cardLayout: z.enum(CARD_LAYOUT).describe("Service cards: equal columns, asymmetric column widths, or a stacked list with side images"),
  stagger: z.number().describe("0-1: vertical stagger between cards"),
  cardOverlap: z.number().describe("0-1: cards overlap the banner above them"),
  tilt: z.number().describe("0-3: degrees of rotation on the outer cards"),
  cardChrome: z.enum(CARD_CHROME).describe("Card container: bare, filled with the surface colour, or outlined"),
  bannerTitle: z.enum(BANNER).describe("Services banner: overlay title bottom-left; centered; plain text with no image; oversize title cropped over the image"),
  bannerHeight: z.number().describe("0.15-0.4: banner height as a fraction of page height"),
  titleScale: z.number().describe("0.7-1.6: size multiplier for banner and details-page titles"),
  detailMode: z.enum(DETAIL).describe("Details page header: image left, image right, stacked, or title overlapping a tilted image"),
  detailSplit: z.number().describe("0.3-0.6: image column share in the details header"),
  byline: z.enum(BYLINE).describe("Author byline: beside the text, below it, or in a right rail"),
});
export type LayoutSpec = z.infer<typeof LayoutSpecSchema>;

export const LayoutSchema = z.object({ name: z.string(), spec: LayoutSpecSchema });
export type Layout = z.infer<typeof LayoutSchema>;

/* ───────── presets (the six archetypes, as specs) ───────── */

export const DEFAULT_SPEC: LayoutSpec = {
  nav: "inline", align: "left", heroMode: "split", heroSplit: 0.4167, headlineScale: 1, headlineOverlap: 0,
  blurb: "plain", dropCap: false, imageTreatment: "bleed", imageHeight: 0.6458, imageWidth: 1, imageLift: 0, imageOffset: 0,
  facts: true, cardLayout: "asymmetric", stagger: 1, cardOverlap: 0, tilt: 0, cardChrome: "bare",
  bannerTitle: "overlay", bannerHeight: 0.3125, titleScale: 1, detailMode: "image-left", detailSplit: 0.4167, byline: "side",
};

const P = (o: Partial<LayoutSpec>): LayoutSpec => ({ ...DEFAULT_SPEC, ...o });

export const LAYOUT_PRESETS: Record<string, Layout> = {
  symmetrical: { name: "Symmetrical", spec: P({
    nav: "centered", align: "center", heroMode: "stacked", headlineScale: 1.19, imageTreatment: "inset", imageHeight: 0.4167, imageWidth: 1,
    facts: false, cardLayout: "equal", stagger: 0, bannerTitle: "centered", detailMode: "image-left", detailSplit: 0.5, byline: "below" }) },
  asymmetrical: { name: "Asymmetrical", spec: P({}) },
  clean: { name: "Clean", spec: P({
    nav: "ruled", heroMode: "stacked", headlineScale: 0.85, imageTreatment: "inset", imageHeight: 0.29, imageWidth: 0.7, facts: false,
    cardLayout: "list", stagger: 0, bannerTitle: "plain", bannerHeight: 0.156, titleScale: 0.85, detailMode: "stacked", byline: "below" }) },
  overlapping: { name: "Overlapping", spec: P({
    heroMode: "overlay", heroSplit: 0.583, headlineScale: 1.44, headlineOverlap: 1, blurb: "card", imageTreatment: "inset", imageHeight: 0.54,
    imageWidth: 1, imageLift: 1, imageOffset: 1, facts: false, cardLayout: "equal", stagger: 0.6, cardOverlap: 1, cardChrome: "filled",
    detailMode: "image-left", detailSplit: 0.5, titleScale: 0.95 }) },
  traditional: { name: "Traditional", spec: P({
    nav: "masthead", heroMode: "split", heroSplit: 0.5, headlineScale: 0.85, dropCap: true, imageTreatment: "framed", imageHeight: 0.375,
    imageWidth: 1, facts: false, cardLayout: "equal", stagger: 0, cardChrome: "outlined", bannerTitle: "centered", bannerHeight: 0.25,
    titleScale: 0.92, detailMode: "image-left", detailSplit: 0.5, byline: "rail" }) },
  "avant-garde": { name: "Avant-garde", spec: P({
    nav: "vertical", headlineScale: 2.12, blurb: "accent-tilted", imageTreatment: "diagonal", imageHeight: 0.54, imageWidth: 1.08, imageLift: 0.375,
    facts: false, cardLayout: "asymmetric", stagger: 1, tilt: 2, bannerTitle: "oversize", titleScale: 1.4, detailMode: "title-over-image", byline: "side" }) },
};

export const LEGACY_LAYOUT_KEYS = Object.keys(LAYOUT_PRESETS);

/** Convert a pre-spec stored value ("clean", …) into a Layout. */
export function migrateLayout(v: unknown): Layout {
  if (typeof v === "string") return LAYOUT_PRESETS[v] ?? LAYOUT_PRESETS.asymmetrical;
  const parsed = LayoutSchema.safeParse(v);
  if (parsed.success) return { name: parsed.data.name, spec: normalizeLayout(parsed.data.spec) };
  const partial = z.object({ name: z.string().optional(), spec: z.unknown().optional() }).safeParse(v);
  if (partial.success) return { name: partial.data.name || "Custom", spec: normalizeLayout(partial.data.spec) };
  return LAYOUT_PRESETS.asymmetrical;
}

/* ───────── normalise ───────── */

const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
  const x = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(hi, Math.max(lo, x));
};
const snap = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
const r2 = (n: number) => Math.round(n * 10000) / 10000;

/**
 * Clamp numbers, snap enums, fill gaps from DEFAULT_SPEC and repair combinations that would
 * overlap text or overflow the page frame. Idempotent.
 */
export function normalizeLayout(raw: unknown): LayoutSpec {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SPEC;
  const s: LayoutSpec = {
    nav: snap(r.nav, NAV, d.nav),
    align: snap(r.align, ALIGN, d.align),
    heroMode: snap(r.heroMode, HERO_MODE, d.heroMode),
    heroSplit: clamp(r.heroSplit, 0.3, 0.6, d.heroSplit),
    headlineScale: clamp(r.headlineScale, 0.7, 2.2, d.headlineScale),
    headlineOverlap: clamp(r.headlineOverlap, 0, 1, d.headlineOverlap),
    blurb: snap(r.blurb, BLURB, d.blurb),
    dropCap: typeof r.dropCap === "boolean" ? r.dropCap : d.dropCap,
    imageTreatment: snap(r.imageTreatment, IMAGE, d.imageTreatment),
    imageHeight: clamp(r.imageHeight, 0.25, 0.7, d.imageHeight),
    imageWidth: clamp(r.imageWidth, 0.4, 1.08, d.imageWidth),
    imageLift: clamp(r.imageLift, 0, 1, d.imageLift),
    imageOffset: clamp(r.imageOffset, 0, 1, d.imageOffset),
    facts: typeof r.facts === "boolean" ? r.facts : d.facts,
    cardLayout: snap(r.cardLayout, CARD_LAYOUT, d.cardLayout),
    stagger: clamp(r.stagger, 0, 1, d.stagger),
    cardOverlap: clamp(r.cardOverlap, 0, 1, d.cardOverlap),
    tilt: clamp(r.tilt, 0, 3, d.tilt),
    cardChrome: snap(r.cardChrome, CARD_CHROME, d.cardChrome),
    bannerTitle: snap(r.bannerTitle, BANNER, d.bannerTitle),
    bannerHeight: clamp(r.bannerHeight, 0.15, 0.4, d.bannerHeight),
    titleScale: clamp(r.titleScale, 0.7, 1.6, d.titleScale),
    detailMode: snap(r.detailMode, DETAIL, d.detailMode),
    detailSplit: clamp(r.detailSplit, 0.3, 0.6, d.detailSplit),
    byline: snap(r.byline, BYLINE, d.byline),
  };

  // ── repairs ──
  // a vertical nav hugs the right edge, so keep text left-aligned
  if (s.nav === "vertical") s.align = "left";
  // the headline can only overlap what sits below it if there is an image tall enough to absorb it
  if (s.headlineOverlap > 0 && s.imageHeight < 0.4) s.imageHeight = 0.4;
  if (s.headlineOverlap > 0 && s.heroMode === "stacked" && s.align === "center") s.headlineOverlap = Math.min(s.headlineOverlap, 0.3);
  // huge headlines need a stacked/overlay hero or they wrap into the intro column
  if (s.headlineScale > 1.5 && s.heroMode === "split" && s.blurb !== "accent-tilted") s.heroMode = "stacked";
  // a tilted accent note needs a split hero to float over
  if (s.blurb === "accent-tilted" && s.heroMode !== "split") s.heroMode = "split";
  // list cards are a single column: staggering and outlines make no sense there
  if (s.cardLayout === "list") { s.stagger = 0; s.tilt = 0; s.cardOverlap = 0; if (s.cardChrome === "outlined") s.cardChrome = "bare"; }
  // overlapping cards need a banner with an image and a title that moves out of the way
  if (s.cardOverlap > 0 && s.bannerTitle === "plain") s.cardOverlap = 0;
  if (s.cardOverlap > 0 && s.bannerHeight < 0.25) s.bannerHeight = 0.25;
  // text over a tilted/clipped image needs room: title-over-image requires an unframed, tall-enough header
  if (s.detailMode === "title-over-image" && s.imageTreatment === "framed") s.imageTreatment = "inset";
  // centered text pairs with a below-byline (a side rail would look lopsided)
  if (s.align === "center" && s.byline === "side") s.byline = "below";
  // diagonal crops and full bleed need to run wide to look intentional
  if ((s.imageTreatment === "diagonal" || s.imageTreatment === "full") && s.imageWidth < 0.9) s.imageWidth = 1;

  for (const k of Object.keys(s) as (keyof LayoutSpec)[]) if (typeof s[k] === "number") (s as Record<string, unknown>)[k] = r2(s[k] as number);
  return s;
}

/* ───────── rendering ───────── */

export function layoutAttrs(spec: LayoutSpec): { attrs: Record<string, string>; vars: Record<string, string | number> } {
  const fr = (a: number) => `${(a * 100).toFixed(2)}fr ${((1 - a) * 100).toFixed(2)}fr`;
  return {
    attrs: {
      "data-nav": spec.nav, "data-align": spec.align, "data-hero-mode": spec.heroMode, "data-blurb": spec.blurb,
      "data-drop-cap": spec.dropCap ? "on" : "off", "data-image": spec.imageTreatment, "data-facts": spec.facts ? "on" : "off",
      "data-cards": spec.cardLayout, "data-chrome": spec.cardChrome, "data-banner": spec.bannerTitle,
      "data-detail": spec.detailMode, "data-byline": spec.byline,
      "data-card-overlap": spec.cardOverlap > 0 ? "on" : "off", "data-title-overlap": spec.headlineOverlap > 0 ? "on" : "off",
    },
    vars: {
      "--hero-cols": fr(spec.heroSplit), "--detail-cols": fr(spec.detailSplit), "--hsc": spec.headlineScale, "--ho": spec.headlineOverlap,
      "--ih": spec.imageHeight, "--iw": spec.imageWidth, "--il": spec.imageLift, "--io": spec.imageOffset,
      "--stg": spec.stagger, "--cov": spec.cardOverlap, "--tilt": `${spec.tilt}deg`, "--bh": spec.bannerHeight, "--ts": spec.titleScale,
    },
  };
}
