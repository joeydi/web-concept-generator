import { brightness, hexToRgb, kmeans, rgbToHex, saturation, type RGB } from "./color";

export interface PreparedImage { blob: Blob; hints: string[]; traits: Traits; name: string }
export interface Traits { meanL: number; stdL: number; meanS: number; warmth: number; edge: number; sym: number }

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image")); };
    im.src = url;
  });
}

/** Downscale to <=1568px, re-encode as JPEG, and measure palette + traits from a 64px sample. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const im = await load(file);
  const scale = Math.min(1, 1568 / Math.max(im.width, im.height));
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(im.width * scale));
  cv.height = Math.max(1, Math.round(im.height * scale));
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(im, 0, 0, cv.width, cv.height);
  const blob = await new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("Could not encode image"))), "image/jpeg", 0.85));

  const N = 64;
  const sm = document.createElement("canvas");
  sm.width = sm.height = N;
  const sctx = sm.getContext("2d", { willReadFrequently: true })!;
  const sc = Math.max(N / im.width, N / im.height);
  const w = im.width * sc, h = im.height * sc;
  sctx.drawImage(im, (N - w) / 2, (N - h) / 2, w, h);
  const data = sctx.getImageData(0, 0, N, N).data;
  const px: RGB[] = [];
  const gray = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) {
    const p: RGB = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    px.push(p);
    gray[i] = brightness(p);
  }
  const meanL = gray.reduce((a, b) => a + b, 0) / gray.length;
  const stdL = Math.sqrt(gray.reduce((a, b) => a + (b - meanL) ** 2, 0) / gray.length);
  const meanS = px.reduce((a, p) => a + saturation(p), 0) / px.length;
  const warmth = px.reduce((a, p) => a + (p[0] - p[2]), 0) / px.length / 255;
  let edge = 0;
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = y * N + x;
    edge += Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + N] - gray[i - N]);
  }
  edge /= (N - 2) * (N - 2) * 2;
  let sym = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) sym += 1 - Math.abs(gray[y * N + x] - gray[y * N + (N - 1 - x)]);
  sym /= N * (N / 2);

  const hints = kmeans(px, 6).sort((a, b) => b.w - a.w).map((c) => rgbToHex(c.rgb));
  const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim().slice(0, 22) || "Image style";
  return { blob, hints, traits: { meanL, stdL, meanS, warmth, edge, sym }, name };
}

export { hexToRgb };
