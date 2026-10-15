"use client";
import { useState } from "react";
import type { Content } from "@/lib/types";

/** Stylised placeholder, also the fallback when a hotlinked image fails to load. */
function Placeholder({ seed }: { seed: number }) {
  const o = seed % 3;
  const sets = [
    ["M0 170 Q100 110 200 160 T400 140 V250 H0Z", "M0 205 Q120 150 240 197 T400 182 V250H0Z", "M0 232 Q150 192 300 226 T400 216 V250H0Z"],
    ["M0 150 Q90 190 200 140 T400 170 V250 H0Z", "M0 190 Q140 140 260 190 T400 165 V250H0Z", "M0 228 Q120 205 280 230 T400 210 V250H0Z"],
    ["M0 185 Q120 120 230 170 T400 120 V250 H0Z", "M0 210 Q100 170 220 205 T400 190 V250H0Z", "M0 238 Q160 205 300 236 T400 222 V250H0Z"],
  ][o];
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle cx={90 + o * 70} cy="72" r="30" fill="var(--c-accent)" opacity=".9" />
      <path d={sets[0]} fill="var(--i1)" /><path d={sets[1]} fill="var(--i2)" /><path d={sets[2]} fill="var(--i3)" />
    </svg>
  );
}

export function Img({ src, seed, className = "" }: { src?: string | null; seed: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const real = src && !failed;
  return (
    <div className={`img${seed % 2 && !real ? " flip" : ""} ${className}`.trim()}>
      {real ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts; hotlinked on purpose
        <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <Placeholder seed={seed} />
      )}
    </div>
  );
}

export function Nav({ c }: { c: Content }) {
  return (
    <header className="nav">
      <span className="brand">{c.name}</span>
      <ul>{c.nav.map((n) => <li key={n}>{n}</li>)}</ul>
      <span className="btn">{c.cta}</span>
    </header>
  );
}
