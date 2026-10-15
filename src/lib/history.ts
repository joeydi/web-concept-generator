import type { Content, Style } from "./types";

export interface HistoryEntry { domain: string; ts: number; content: Content }

const HKEY = "wcg.history.v1";
const SKEY = "wcg.styles.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable or full */ }
}

export const loadHistory = (): HistoryEntry[] => read<HistoryEntry[]>(HKEY, []);
export function saveHistoryEntry(content: Content): HistoryEntry[] {
  const next = [{ domain: content.domain, ts: Date.now(), content }, ...loadHistory().filter((h) => h.domain !== content.domain)].slice(0, 12);
  write(HKEY, next);
  return next;
}
export const loadCustomStyles = (): Style[] => read<Style[]>(SKEY, []);
export function saveCustomStyles(styles: Style[]) { write(SKEY, styles.filter((s) => s.custom).slice(0, 12)); }

export function relativeTime(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} d ago`;
}
