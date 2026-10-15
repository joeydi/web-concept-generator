import { z } from "zod";
import { BODY_KEYS, DISPLAY_KEYS } from "./fonts";
import { LayoutSchema, migrateLayout } from "./layout";

export const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PaletteSchema = z.object({
  bg: hex, surface: hex, ink: hex, muted: hex, accent: hex, accentInk: hex,
});
export type Palette = z.infer<typeof PaletteSchema>;

export const StyleSchema = z.object({
  id: z.string(),
  name: z.string(),
  vibe: z.tuple([z.string(), z.string()]),
  // legacy stored styles used a preset name string; migrate those into {name, spec}
  layout: z.preprocess(migrateLayout, LayoutSchema),
  palette: PaletteSchema,
  fonts: z.object({ display: z.enum(DISPLAY_KEYS), body: z.enum(BODY_KEYS) }),
  space: z.number(),
  radius: z.number(),
  custom: z.boolean().optional(),
});
export type Style = z.infer<typeof StyleSchema>;

export const ContentSchema = z.object({
  domain: z.string(),
  name: z.string(),
  nav: z.array(z.string()),
  cta: z.string(),
  homeTitle: z.string(),
  homeBlurb: z.string(),
  facts: z.array(z.object({ value: z.string(), label: z.string() })),
  bannerTitle: z.string(),
  services: z.array(z.object({ name: z.string(), blurb: z.string() })),
  detailTitle: z.string(),
  detailBlurb: z.string(),
  byline: z.object({ name: z.string(), role: z.string() }),
  subhead: z.string(),
  body: z.array(z.string()),
  images: z.object({
    hero: z.string().nullable(),
    banner: z.string().nullable(),
    services: z.array(z.string().nullable()),
    detail: z.string().nullable(),
  }),
});
export type Content = z.infer<typeof ContentSchema>;

/** SSE events shared by both API routes. */
export type StreamEvent =
  | { type: "step"; index: number; status: "running" | "done"; ms?: number }
  | { type: "notice"; message: string }
  | { type: "result"; data: unknown }
  | { type: "error"; message: string };

export const CONTENT_STEPS = ["Loading sitemap", "Analyzing content", "Defining service areas", "Finding images", "Summarizing findings"];
export const STYLE_STEPS = ["Extracting colors", "Defining typography", "Analyzing spacing", "Detecting layout", "Saving aesthetic", "Summarizing design system"];
