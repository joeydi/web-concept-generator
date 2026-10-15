"use client";
import { useRef } from "react";
import { relativeTime, type HistoryEntry } from "@/lib/history";
import { CONTENT_STEPS } from "@/lib/types";
import { ProgressSteps, type StepState } from "./ProgressSteps";

export type Panel = "none" | "history" | "steps" | "hint";

export function SearchBar({
  value, onChange, onSubmit, onPickHistory, onRemoveHistory, history, activeDomain, panel, setPanel, steps, hint, disabled, invalid,
}: {
  value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; onPickHistory: (h: HistoryEntry) => void; onRemoveHistory: (h: HistoryEntry) => void;
  history: HistoryEntry[]; activeDomain: string | null; panel: Panel; setPanel: (p: Panel) => void; steps: StepState[]; hint: string;
  disabled: boolean; invalid: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const items = history;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setPanel("none"); }
    else if (e.key === "Enter") { e.preventDefault(); onSubmit(value); }
  };

  return (
    <aside className="side" aria-label="Sites">
      <div className="field" data-invalid={invalid ? "" : undefined}>
        <svg className="lucide field-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
        </svg>
        <input
          ref={input} type="text" inputMode="url" autoComplete="off" autoCapitalize="off" spellCheck={false}
          aria-label="Website address"
          placeholder="Enter a website" value={value} disabled={disabled}
          onChange={(e) => { onChange(e.target.value); }}
          onFocus={() => { if (panel === "hint") setPanel("none"); }} onKeyDown={onKey}
        />
        {value.trim() && (
          <button className="go" type="button" aria-label="Generate concepts" onClick={() => onSubmit(value)} disabled={disabled}>
            <svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </button>
        )}
      </div>
      {panel === "steps" && <div className="side-status"><ProgressSteps labels={CONTENT_STEPS} steps={steps} label="Generating concepts" /></div>}
      {panel === "hint" && <p className="pop-hint side-status" role="alert">{hint}</p>}
      {items.length > 0 && <h2 className="side-title">Recent sites</h2>}
      <ul id="history" className="site-list" aria-label="Recent sites">
        {items.map((h) => (
          <li key={h.domain} className="site-item">
            <button type="button" className="row" aria-current={h.domain === activeDomain ? "true" : undefined}
              disabled={disabled} onClick={() => onPickHistory(h)}>
              <svg className="lucide ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
              <span className="txt mono">{h.domain}</span><span className="meta">{relativeTime(h.ts)}</span>
            </button>
            <button type="button" className="site-remove" aria-label={`Remove ${h.domain}`} onClick={() => onRemoveHistory(h)}>
              <svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
