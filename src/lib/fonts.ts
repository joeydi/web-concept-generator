/* Allowed Google Fonts. Style objects store these keys; the CSS family is resolved
   through the next/font variables declared in fontLoaders.ts. Extend both together. */

export type FontRole = "display" | "body";

export interface FontSpec {
  key: string;
  label: string;
  /** CSS custom property set by next/font */
  cssVar: string;
  fallback: string;
  roles: FontRole[];
  /** display defaults */
  weight: number;
  dcase: "none" | "uppercase";
  dtrack: string;
  /** short descriptor given to the vision model */
  feel: string;
}

export const FONTS: FontSpec[] = [
  { key: "fraunces", label: "Fraunces", cssVar: "--font-fraunces", fallback: "Georgia, serif", roles: ["display"], weight: 600, dcase: "none", dtrack: "-0.02em", feel: "soft, warm, organic serif" },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair", fallback: "Georgia, serif", roles: ["display"], weight: 700, dcase: "none", dtrack: "-0.01em", feel: "high-contrast editorial serif" },
  { key: "dm-serif", label: "DM Serif Display", cssVar: "--font-dm-serif", fallback: "Georgia, serif", roles: ["display"], weight: 400, dcase: "none", dtrack: "-0.01em", feel: "friendly, rounded display serif (midcentury)" },
  { key: "bebas", label: "Bebas Neue", cssVar: "--font-bebas", fallback: "Impact, sans-serif", roles: ["display"], weight: 400, dcase: "uppercase", dtrack: "0.02em", feel: "tall condensed all-caps, poster-like" },
  { key: "space-grotesk", label: "Space Grotesk", cssVar: "--font-space-grotesk", fallback: "system-ui, sans-serif", roles: ["display", "body"], weight: 700, dcase: "uppercase", dtrack: "-0.04em", feel: "quirky geometric grotesk, raw and technical" },
  { key: "jakarta", label: "Plus Jakarta Sans", cssVar: "--font-jakarta", fallback: "system-ui, sans-serif", roles: ["display", "body"], weight: 600, dcase: "none", dtrack: "-0.03em", feel: "clean modern sans, airy" },
  { key: "figtree", label: "Figtree", cssVar: "--font-figtree", fallback: "system-ui, sans-serif", roles: ["body"], weight: 700, dcase: "none", dtrack: "-0.01em", feel: "friendly humanist sans" },
  { key: "source-serif", label: "Source Serif 4", cssVar: "--font-source-serif", fallback: "Georgia, serif", roles: ["body"], weight: 600, dcase: "none", dtrack: "0", feel: "readable text serif" },
  { key: "dm-sans", label: "DM Sans", cssVar: "--font-dm-sans", fallback: "system-ui, sans-serif", roles: ["body"], weight: 700, dcase: "none", dtrack: "-0.01em", feel: "low-contrast geometric sans" },
  { key: "inter", label: "Inter", cssVar: "--font-inter", fallback: "system-ui, sans-serif", roles: ["body"], weight: 700, dcase: "none", dtrack: "-0.01em", feel: "neutral utilitarian sans" },
];

export const DISPLAY_KEYS = FONTS.filter((f) => f.roles.includes("display")).map((f) => f.key) as [string, ...string[]];
export const BODY_KEYS = FONTS.filter((f) => f.roles.includes("body")).map((f) => f.key) as [string, ...string[]];

export function fontByKey(key: string, role: FontRole): FontSpec {
  const f = FONTS.find((x) => x.key === key && x.roles.includes(role));
  return f ?? FONTS.find((x) => x.roles.includes(role))!;
}

export function cssFamily(f: FontSpec): string {
  return `var(${f.cssVar}), ${f.fallback}`;
}
