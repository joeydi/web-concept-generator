"use client";
import { useEffect, useRef } from "react";
import { boardVars } from "@/lib/styleVars";
import type { Content, Style } from "@/lib/types";
import { Details } from "./pages/Details";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";

function ConceptCard({ cls, label, content, children }: { cls: string; label: string; content: Content | null; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => { if (wrap.current) wrap.current.style.transform = `scale(${el.getBoundingClientRect().width / 1440})`; };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [content]);
  return (
    <article ref={ref} className={`concept ${cls}`}>
      {content && <span className="cap">{label}</span>}
      <div className="page-slot">{content && <div ref={wrap} className="page-wrap">{children}</div>}</div>
    </article>
  );
}

export function Board({ content, style }: { content: Content | null; style: Style | null }) {
  const live = content && style;
  return (
    <div className={`board${live ? "" : " is-skeleton"}`} data-layout={style?.layout} style={style ? boardVars(style) : undefined}>
      <ConceptCard cls="main" label="Homepage" content={content}>{content && <Home c={content} />}</ConceptCard>
      <ConceptCard cls="side" label="Landing page" content={content}>{content && <Services c={content} />}</ConceptCard>
      <ConceptCard cls="side" label="Details page" content={content}>{content && <Details c={content} />}</ConceptCard>
    </div>
  );
}
