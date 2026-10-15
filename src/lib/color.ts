export type RGB = [number, number, number];

export const hexToRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
export const rgbToHex = (c: RGB): string =>
  "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

const lin = (v: number) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
export const luminance = (c: RGB) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
export const contrast = (a: RGB, b: RGB) => {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
export const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;
export const saturation = (c: RGB) => {
  const mx = Math.max(...c), mn = Math.min(...c);
  return mx === 0 ? 0 : (mx - mn) / mx;
};
export const brightness = (c: RGB) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

/** Push `fg` away from `bg` (towards black or white) until it reaches `min` contrast. */
export function ensureContrast(fg: RGB, bg: RGB, min: number): RGB {
  const target: RGB = contrast([10, 10, 10], bg) >= contrast([250, 250, 250], bg) ? [10, 10, 10] : [250, 250, 250];
  let out = fg, t = 0;
  while (contrast(out, bg) < min && t < 1) {
    t += 0.05;
    out = mix(fg, target, t);
  }
  return out;
}

export function kmeans(px: RGB[], k: number): { rgb: RGB; w: number }[] {
  if (!px.length) return [];
  const cs: RGB[] = [];
  for (let i = 0; i < k; i++) cs.push([...px[Math.floor(((i + 0.5) * px.length) / k)]] as RGB);
  const asg = new Array(px.length).fill(0);
  for (let it = 0; it < 8; it++) {
    px.forEach((p, i) => {
      let best = 0, bd = Infinity;
      cs.forEach((c, j) => {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      });
      asg[i] = best;
    });
    const sums = cs.map(() => [0, 0, 0, 0]);
    px.forEach((p, i) => { const s = sums[asg[i]]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
    sums.forEach((s, j) => { if (s[3]) cs[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  const counts = cs.map(() => 0);
  asg.forEach((a) => counts[a]++);
  return cs.map((c, j) => ({ rgb: c, w: counts[j] / px.length })).filter((c) => c.w > 0);
}

export interface RawPalette { bg: string; surface?: string; ink: string; muted?: string; accent: string }

/** Deterministically enforce the contrast rules, whatever the model proposed. */
export function normalizePalette(p: RawPalette): import("./types").Palette {
  let bg = hexToRgb(p.bg);
  // A mid-tone background can't reach 7:1 with any text colour: nudge it towards the better extreme.
  const black: RGB = [10, 10, 10], white: RGB = [250, 250, 250];
  const toward = contrast(black, bg) >= contrast(white, bg) ? white : black;
  for (let t = 0.05; Math.max(contrast(black, bg), contrast(white, bg)) < 8 && t <= 1; t += 0.05) bg = mix(hexToRgb(p.bg), toward, t);
  const dark = luminance(bg) < 0.4;
  const ink = ensureContrast(hexToRgb(p.ink), bg, 7);
  const surface = p.surface ? hexToRgb(p.surface) : mix(bg, ink, dark ? 0.08 : 0.07);
  // surface must stay close enough to bg that ink on it still reads
  const safeSurface = contrast(ink, surface) >= 7 ? surface : mix(bg, ink, dark ? 0.08 : 0.07);
  const muted = ensureContrast(p.muted ? hexToRgb(p.muted) : mix(ink, bg, 0.35), safeSurface, 4.5);
  const accent = ensureContrast(hexToRgb(p.accent), bg, 3);
  const accentInk: RGB = contrast([255, 255, 255], accent) >= contrast([10, 10, 10], accent) ? [255, 255, 255] : [10, 10, 10];
  return {
    bg: rgbToHex(bg), surface: rgbToHex(safeSurface), ink: rgbToHex(ink),
    muted: rgbToHex(muted), accent: rgbToHex(accent), accentInk: rgbToHex(accentInk),
  };
}
