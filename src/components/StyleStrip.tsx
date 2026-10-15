"use client";
import { useRef } from "react";
import { cardVars } from "@/lib/styleVars";
import type { Style } from "@/lib/types";

export function StyleStrip({
  styles, selectedId, ready, phase, dragging, newId, onSelect, onRemove, onPickFile,
}: {
  styles: Style[]; selectedId: string | null; ready: boolean; phase: string; dragging: boolean; newId: string | null;
  onSelect: (s: Style) => void; onRemove: (s: Style) => void; onPickFile: (f: File) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const cards = [...(strip.current?.querySelectorAll<HTMLButtonElement>(".style-card") ?? [])];
    const i = cards.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const n = cards[(i + (e.key === "ArrowRight" ? 1 : -1) + cards.length) % cards.length];
    n.focus(); n.click(); e.preventDefault();
  };

  return (
    <section className={`styles${dragging ? " drag" : ""}`} aria-label="Styles">
      <button className="dz-hint" type="button" onClick={() => file.current?.click()} disabled={!ready || phase === "extracting"}>
        <svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.3" /><path d="m14 19.5 3-3 3 3" /><path d="M17 22v-5.5" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
        </svg>
        <span>Drop an image to extract a style</span>
      </button>
      <div className="strip" ref={strip} role="radiogroup" aria-label="Style" onKeyDown={onKey}>
        {ready ? styles.map((s) => (
          <div key={s.id} className="style-item">
          <button
            type="button" role="radio" aria-checked={s.id === selectedId}
            className={`style-card${s.id === newId ? " is-new" : ""}`} style={cardVars(s)}
            aria-label={`${s.name}, ${s.vibe.join(", ")}, ${s.layout.name} layout`}
            onClick={() => phase !== "extracting" && onSelect(s)}
          >
            <div className="sw"><i className="s1" /><i className="s2" /><i className="s3" /></div>
            <div className="aa"><b>Aa</b><span>Aa</span></div>
            <footer><span className="nm">{s.name}</span><span className="chip">{s.layout.name}</span></footer>
          </button>
          {s.custom && (
            <button type="button" className="style-remove" aria-label={`Remove ${s.name}`} onClick={() => onRemove(s)}>
              <svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          )}
          </div>
        )) : Array.from({ length: 6 }, (_, i) => <div key={i} className="style-skel" />)}
      </div>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ""; }} />
    </section>
  );
}
