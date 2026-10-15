"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { heuristicStyle } from "@/lib/heuristicStyle";
import { loadCustomStyles, loadHistory, saveCustomStyles, saveHistoryEntry, type HistoryEntry } from "@/lib/history";
import { prepareImage } from "@/lib/imageClient";
import { PRESETS } from "@/lib/presets";
import { streamPost } from "@/lib/sse";
import { CONTENT_STEPS, STYLE_STEPS, type Content, type Style, type StreamEvent } from "@/lib/types";
import { Board } from "./Board";
import { ProgressSteps, type StepState } from "./ProgressSteps";
import { SearchBar, type Panel } from "./SearchBar";
import { StyleStrip } from "./StyleStrip";

type Phase = "idle" | "loading" | "loaded" | "extracting";

const pending = (n: number): StepState[] => Array.from({ length: n }, () => ({ status: "pending" }));
const applyStep = (prev: StepState[], e: Extract<StreamEvent, { type: "step" }>): StepState[] =>
  prev.map((s, i) => (i === e.index ? { status: e.status, ms: e.ms } : s));

function withTransition(fn: () => void) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) return fn();
  const t = document.startViewTransition(() => flushSync(fn));
  [t.ready, t.finished, t.updateCallbackDone].forEach((p) => p.catch(() => {}));
}

export function Tool() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [panel, setPanel] = useState<Panel>("none");
  const [hint, setHint] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [content, setContent] = useState<Content | null>(null);
  const [custom, setCustom] = useState<Style[]>([]);
  const [styleId, setStyleId] = useState<string>(PRESETS[0].id);
  const [newId, setNewId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [steps, setSteps] = useState<StepState[]>(pending(CONTENT_STEPS.length));
  const [styleSteps, setStyleSteps] = useState<StepState[]>(pending(STYLE_STEPS.length));
  const [dragging, setDragging] = useState(false);
  const phaseRef = useRef<Phase>("idle");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const styles = [...custom, ...PRESETS];
  const style = styles.find((s) => s.id === styleId) ?? PRESETS[0];

  useEffect(() => {
    // localStorage only exists in the browser, so hydrate after mount to keep SSR markup stable
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
    setCustom(loadCustomStyles());
  }, []);

  const flash = useCallback((message: string, ms = 0) => {
    setHint(message);
    setPanel("hint");
    if (ms) setTimeout(() => setPanel((p) => (p === "hint" ? "none" : p)), ms);
  }, []);

  /* ───── generate content ───── */
  const generate = useCallback(async (raw: string) => {
    if (phaseRef.current === "loading" || phaseRef.current === "extracting") return;
    if (!raw.trim()) { setInvalid(true); flash("Enter a website address, like example.com"); return; }
    setInvalid(false);
    setPhase("loading");
    setContent(null);
    setSteps(pending(CONTENT_STEPS.length));
    setPanel("steps");
    const out: { result: Content | null; error: string } = { result: null, error: "" };
    try {
      await streamPost("/api/generate", { headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: raw }) }, (e) => {
        if (e.type === "step") setSteps((p) => applyStep(p, e));
        else if (e.type === "result") out.result = e.data as Content;
        else if (e.type === "error") out.error = e.message;
      });
    } catch (err) {
      out.error = err instanceof Error ? err.message : "Request failed";
    }
    const done = out.result;
    if (!done) {
      setPhase("idle");
      setInvalid(true);
      flash(out.error || "Could not generate concepts for that site");
      return;
    }
    setInput(done.domain);
    setHistory(saveHistoryEntry(done));
    setPanel("none");
    withTransition(() => { setContent(done); setPhase("loaded"); });
  }, [flash]);

  const pickHistory = useCallback((h: HistoryEntry) => {
    if (phaseRef.current === "loading" || phaseRef.current === "extracting") return;
    setInput(h.domain);
    setInvalid(false);
    setPanel("none");
    withTransition(() => { setContent(h.content); setPhase("loaded"); });
  }, []);

  /* ───── extract style from an image ───── */
  const addStyle = useCallback((s: Style) => {
    withTransition(() => {
      setCustom((prev) => { const next = [s, ...prev]; saveCustomStyles(next); return next; });
      setStyleId(s.id);
      setNewId(s.id);
    });
    document.querySelector(".strip")?.scrollTo({ left: 0 });
  }, []);

  const extract = useCallback(async (file: File) => {
    if (phaseRef.current !== "loaded" || !file.type.startsWith("image/")) return;
    setPhase("extracting");
    setStyleSteps(pending(STYLE_STEPS.length));
    let prepared: Awaited<ReturnType<typeof prepareImage>>;
    try {
      prepared = await prepareImage(file);
    } catch (err) {
      setPhase("loaded");
      flash(err instanceof Error ? err.message : "Could not read that image", 3000);
      return;
    }
    const form = new FormData();
    form.append("image", new File([prepared.blob], "reference.jpg", { type: "image/jpeg" }));
    form.append("hints", prepared.hints.join(","));
    const out: { result: Style | null; error: string } = { result: null, error: "" };
    try {
      await streamPost("/api/extract-style", { body: form }, (e) => {
        if (e.type === "step") setStyleSteps((p) => applyStep(p, e));
        else if (e.type === "result") out.result = e.data as Style;
        else if (e.type === "error") out.error = e.message;
      });
    } catch (err) {
      out.error = err instanceof Error ? err.message : "Request failed";
    }
    let style: Style;
    if (out.result) {
      style = { ...out.result, name: out.result.name || prepared.name };
    } else {
      style = heuristicStyle(prepared.hints, prepared.traits, prepared.name);
      setStyleSteps(STYLE_STEPS.map(() => ({ status: "done" as const })));
      flash(`${out.error || "Vision analysis failed"}. Used a local estimate instead.`, 4500);
    }
    setPhase("loaded");
    addStyle(style);
  }, [addStyle, flash]);

  /* ───── global drag and drop ───── */
  useEffect(() => {
    let depth = 0;
    const has = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes("Files");
    const enter = (e: DragEvent) => { if (has(e)) { depth++; if (phaseRef.current === "loaded") setDragging(true); } };
    const leave = (e: DragEvent) => { if (has(e) && --depth <= 0) { depth = 0; setDragging(false); } };
    const over = (e: DragEvent) => { if (has(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!has(e)) return;
      e.preventDefault(); depth = 0; setDragging(false);
      const f = e.dataTransfer?.files[0];
      if (f) void extract(f);
    };
    const paste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      const f = item?.getAsFile();
      if (f) void extract(f);
    };
    window.addEventListener("dragenter", enter); window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over); window.addEventListener("drop", drop); document.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("dragenter", enter); window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over); window.removeEventListener("drop", drop); document.removeEventListener("paste", paste);
    };
  }, [extract]);

  return (
    <div className="app" data-phase={phase}>
      <SearchBar
        value={input} onChange={(v) => { setInput(v); setInvalid(false); }} onSubmit={generate} onPickHistory={pickHistory}
        history={history} panel={panel} setPanel={setPanel} steps={steps} hint={hint} disabled={phase === "loading"} invalid={invalid}
      />
      <section className="board-wrap" aria-label="Concept board">
        <Board content={content} style={content ? style : null} />
        {phase === "extracting" && (
          <div className="popover pop-board"><ProgressSteps labels={STYLE_STEPS} steps={styleSteps} label="Extracting style" /></div>
        )}
      </section>
      <StyleStrip
        styles={styles} selectedId={styleId} ready={!!content} phase={phase} dragging={dragging} newId={newId}
        onSelect={(s) => withTransition(() => setStyleId(s.id))} onPickFile={(f) => void extract(f)}
      />
    </div>
  );
}
