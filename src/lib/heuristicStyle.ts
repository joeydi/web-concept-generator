import { brightness, ensureContrast, hexToRgb, mix, normalizePalette, saturation, type RGB } from "./color";
import type { Traits } from "./imageClient";
import type { Layout, Style } from "./types";

/** Offline fallback used when the vision call fails: derives a plausible style from pixel statistics. */
export function heuristicStyle(hints: string[], t: Traits, name: string): Style {
  const cols = hints.map(hexToRgb);
  const dark = t.meanL < 0.42;
  const byL = cols.slice().sort((a, b) => brightness(a) - brightness(b));
  const low = (c: RGB) => saturation(c) < 0.38;
  const bgSrc = (dark ? byL.find(low) : byL.slice().reverse().find(low)) ?? (dark ? byL[0] : byL[byL.length - 1]);
  const bg = dark ? mix(bgSrc, [0, 0, 0], 0.6) : mix(bgSrc, [255, 255, 255], 0.55);
  const inkSrc = dark ? byL[byL.length - 1] : byL[0];
  const ink = ensureContrast(dark ? mix(inkSrc, [255, 255, 255], 0.75) : mix(inkSrc, [0, 0, 0], 0.7), bg, 9);
  const accent = cols.filter((c) => c !== bgSrc).sort((a, b) => saturation(b) - saturation(a))[0] ?? cols[0];
  const hex = (c: RGB) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const palette = normalizePalette({ bg: hex(bg), ink: hex(ink), accent: hex(accent) });

  let layout: Layout;
  if (t.sym > 0.9) layout = "symmetrical";
  else if (t.stdL > 0.27 && t.meanS > 0.42) layout = "avant-garde";
  else if (t.edge < 0.035 && t.meanS < 0.35) layout = "clean";
  else if (t.meanS < 0.28 && t.warmth > 0) layout = "traditional";
  else if (t.edge > 0.1) layout = "overlapping";
  else layout = "asymmetrical";

  const fonts: Record<Layout, Style["fonts"]> = {
    symmetrical: { display: "playfair", body: "source-serif" }, asymmetrical: { display: "fraunces", body: "figtree" },
    clean: { display: "jakarta", body: "jakarta" }, overlapping: { display: "dm-serif", body: "dm-sans" },
    traditional: { display: "playfair", body: "source-serif" }, "avant-garde": { display: "space-grotesk", body: "space-grotesk" },
  };
  return {
    id: "x" + Date.now().toString(36),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    vibe: [dark ? "Moody" : t.meanL > 0.7 ? "Airy" : "Grounded", t.meanS > 0.5 ? "Vivid" : t.warmth > 0.05 ? "Warm" : t.warmth < -0.05 ? "Cool" : "Muted"],
    layout, palette, fonts: dark && layout !== "avant-garde" ? { display: "bebas", body: "inter" } : fonts[layout],
    space: t.edge < 0.05 ? 1.3 : t.edge > 0.1 ? 0.88 : 1,
    radius: { clean: 14, traditional: 2, "avant-garde": 0, overlapping: 20, symmetrical: 6, asymmetrical: 10 }[layout],
    custom: true,
  };
}
