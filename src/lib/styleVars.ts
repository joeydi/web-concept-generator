import type { CSSProperties } from "react";
import { cssFamily, fontByKey } from "./fonts";
import type { Style } from "./types";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** CSS custom properties that drive the concept pages (see styles/app.css). */
export function boardVars(s: Style): Vars {
  const d = fontByKey(s.fonts.display, "display");
  const b = fontByKey(s.fonts.body, "body");
  const p = s.palette;
  return {
    "--c-bg": p.bg, "--c-surface": p.surface, "--c-ink": p.ink, "--c-muted": p.muted,
    "--c-accent": p.accent, "--c-accent-ink": p.accentInk,
    "--f-display": cssFamily(d), "--f-body": cssFamily(b),
    "--dw": d.weight, "--dcase": d.dcase, "--dtrack": d.dtrack,
    "--space": s.space, "--radius": `${s.radius}px`,
  };
}

/** Variables for a style card in the strip. */
export function cardVars(s: Style): Vars {
  const d = fontByKey(s.fonts.display, "display");
  const b = fontByKey(s.fonts.body, "body");
  const p = s.palette;
  return { "--bg": p.bg, "--surface": p.surface, "--ink": p.ink, "--accent": p.accent, "--fd": cssFamily(d), "--fb": cssFamily(b), "--dw": d.weight };
}
