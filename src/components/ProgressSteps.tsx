export type StepState = { status: "pending" | "running" | "done"; ms?: number };

const Dashed = ({ children, spin }: { children?: React.ReactNode; spin?: boolean }) => (
  <svg className="step-ico" viewBox="0 0 24 24" aria-hidden="true">
    <circle className={spin ? "spin" : undefined} cx="12" cy="12" r="10" strokeDasharray="3.3 3.3" />
    {children}
  </svg>
);

export function ProgressSteps({ labels, steps, label }: { labels: string[]; steps: StepState[]; label: string }) {
  return (
    <ol className="steps" aria-label={label} aria-live="polite">
      {labels.map((l, i) => {
        const s = steps[i] ?? { status: "pending" };
        return (
          <li key={l} className={`row state-${s.status}`}>
            <span className="ico">
              {s.status === "done" ? <Dashed><path d="m8.5 12.4 2.5 2.5 4.5-5" /></Dashed>
                : s.status === "running" ? <Dashed spin><path d="M12 7v5l3.2 2" /></Dashed> : <Dashed />}
            </span>
            <span className="txt">{l}</span>
            <span className="meta">{s.status === "done" && s.ms !== undefined ? `${(s.ms / 1000).toFixed(1)}s` : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}
