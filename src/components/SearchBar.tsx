"use client";
import { useEffect, useRef } from "react";
import { relativeTime, type HistoryEntry } from "@/lib/history";
import { CONTENT_STEPS } from "@/lib/types";
import { ProgressSteps, type StepState } from "./ProgressSteps";

export type Panel = "none" | "history" | "steps" | "hint";

export function SearchBar({
  value, onChange, onSubmit, onPickHistory, history, panel, setPanel, steps, hint, disabled, invalid,
}: {
  value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; onPickHistory: (h: HistoryEntry) => void;
  history: HistoryEntry[]; panel: Panel; setPanel: (p: Panel) => void; steps: StepState[]; hint: string; disabled: boolean; invalid: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const q = value.trim().toLowerCase();
  const items = history.filter((h) => !q || h.domain.includes(q)).slice(0, 5);
  const active = useRef(-1);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (panel === "steps") return;
      if (!root.current?.contains(e.target as Node)) setPanel("none");
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [panel, setPanel]);

  const select = (i: number) => {
    active.current = i;
    root.current?.querySelectorAll<HTMLElement>("[role=option]").forEach((el, j) => el.setAttribute("aria-selected", String(j === i)));
    if (i >= 0) input.current?.setAttribute("aria-activedescendant", `h${i}`); else input.current?.removeAttribute("aria-activedescendant");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (panel !== "history" && items.length) setPanel("history");
      if (!items.length) return;
      select((active.current + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
    } else if (e.key === "Escape") setPanel("none");
    else if (e.key === "Enter") {
      e.preventDefault();
      const h = items[active.current];
      if (panel === "history" && h) onPickHistory(h); else onSubmit(value);
    }
  };

  const showHistory = panel === "history" && items.length > 0;
  return (
    <header className="search" ref={root}>
      <div className="field" data-invalid={invalid ? "" : undefined}>
        <svg className="lucide field-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
        </svg>
        <input
          ref={input} type="text" inputMode="url" autoComplete="off" autoCapitalize="off" spellCheck={false}
          role="combobox" aria-expanded={showHistory} aria-controls="history" aria-autocomplete="list" aria-label="Website address"
          placeholder="Enter a website, like example.com" value={value} disabled={disabled}
          onChange={(e) => { onChange(e.target.value); select(-1); setPanel("history"); }}
          onFocus={() => setPanel("history")} onKeyDown={onKey}
        />
        {value.trim() && (
          <button className="go" type="button" aria-label="Generate concepts" onClick={() => onSubmit(value)} disabled={disabled}>
            <svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </button>
        )}
      </div>
      {(showHistory || panel === "steps" || panel === "hint") && (
        <div className="popover">
          {showHistory && (
            <ul id="history" role="listbox" aria-label="Recent sites">
              {items.map((h, i) => (
                <li key={h.domain} role="presentation">
                  <button type="button" className="row" role="option" id={`h${i}`} aria-selected="false"
                    onMouseDown={(e) => e.preventDefault()} onClick={() => onPickHistory(h)}>
                    <svg className="lucide ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                    <span className="txt mono">{h.domain}</span><span className="meta">{relativeTime(h.ts)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {panel === "steps" && <ProgressSteps labels={CONTENT_STEPS} steps={steps} label="Generating concepts" />}
          {panel === "hint" && <p className="pop-hint" role="alert">{hint}</p>}
        </div>
      )}
    </header>
  );
}
