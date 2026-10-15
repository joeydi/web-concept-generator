import { normalizePalette } from "@/lib/color";
import { normalizeLayout } from "@/lib/layout";
import { BODY_KEYS, DISPLAY_KEYS } from "@/lib/fonts";
import { extractStyleFromImage, STYLE_KEY_ORDER } from "@/lib/server/llm";
import { rateLimit } from "@/lib/server/ratelimit";
import { sseResponse, stepper } from "@/lib/server/sse";
import type { Style } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof TYPES)[number];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : (lo + hi) / 2));
const titleCase = (s: string) => s.trim().replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 24);

export async function POST(req: Request) {
  if (!rateLimit(req, "extract", 30)) return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return Response.json({ error: "Attach an image" }, { status: 400 });
  if (!(TYPES as readonly string[]).includes(file.type)) return Response.json({ error: "Use a JPEG, PNG, WebP or GIF image" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Image is larger than 5 MB" }, { status: 413 });
  const hints = String(form?.get("hints") ?? "").split(",").map((s) => s.trim()).filter((s) => /^#[0-9a-fA-F]{6}$/.test(s)).slice(0, 6);
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  return sseResponse(async (send) => {
    const step = stepper(send);
    let current = 0;
    step.start(0);
    const advance = (to: number) => {
      while (current < to) { step.done(current); current++; step.start(current); }
    };

    const raw = await extractStyleFromImage({ base64, mediaType: file.type as MediaType }, hints, (key) => {
      advance(STYLE_KEY_ORDER.indexOf(key));
    });
    advance(4); // saving aesthetic
    advance(5); // summarizing design system

    const palette = normalizePalette(raw.colors);
    const style: Style = {
      id: "x" + Date.now().toString(36),
      name: titleCase(raw.aesthetic.name) || "Image style",
      vibe: [titleCase(raw.aesthetic.vibe1), titleCase(raw.aesthetic.vibe2)],
      layout: { name: titleCase(raw.layout.name) || "Custom", spec: normalizeLayout(raw.layout.spec) },
      palette,
      fonts: {
        display: DISPLAY_KEYS.includes(raw.typography.display) ? raw.typography.display : DISPLAY_KEYS[0],
        body: BODY_KEYS.includes(raw.typography.body) ? raw.typography.body : BODY_KEYS[0],
      },
      space: +clamp(raw.spacing.space, 0.8, 1.4).toFixed(2),
      radius: Math.round(clamp(raw.spacing.radius, 0, 24)),
      custom: true,
    };
    step.done(5);
    send({ type: "result", data: style });
  });
}
