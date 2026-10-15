import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** True when an IP literal is loopback, private, link-local, CGNAT, multicast, reserved or metadata. */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    if (x === "::" || x === "::1") return true;
    if (x.startsWith("::ffff:")) {
      const tail = x.slice(7);
      if (isIP(tail) === 4) return isPrivateIp(tail);
      return true; // hex form of a mapped v4: treat as unsafe
    }
    return /^(fc|fd|fe[89ab]|ff)/.test(x);
  }
  return true;
}

/** Normalise user input to a bare hostname, or null if it is not a plausible public domain. */
export function normalizeDomain(raw: string): string | null {
  const d = raw.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) || d.length > 253) return null;
  if (isIP(d)) return null;
  const tld = d.split(".").pop()!;
  if (/^\d+$/.test(tld) || ["local", "localhost", "internal", "lan", "test", "invalid"].includes(tld)) return null;
  return d;
}

export class BlockedUrlError extends Error {}

/** Throws unless `url` is http(s) on a hostname that resolves only to public addresses. */
export async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new BlockedUrlError("Only http(s) is allowed");
  if (url.username || url.password) throw new BlockedUrlError("Credentials in URLs are not allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new BlockedUrlError("Address is not public");
    return;
  }
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError("Host could not be resolved");
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new BlockedUrlError("Address is not public");
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
  method?: "GET" | "HEAD";
}

export interface SafeResponse {
  url: string;
  status: number;
  contentType: string;
  contentLength: number | null;
  body: Uint8Array;
}

/**
 * fetch() with SSRF protection: every hop (including redirects) is checked against the
 * public-address rule, redirects are followed manually and capped, and the body is size-capped.
 * Note: DNS is resolved separately from the connect, so a hostile resolver could still rebind;
 * deploy behind an egress policy if that threat model matters.
 */
export async function safeFetch(input: string, opts: SafeFetchOptions = {}): Promise<SafeResponse> {
  const { timeoutMs = 6000, maxBytes = 1_500_000, maxRedirects = 3, method = "GET" } = opts;
  let url = new URL(input);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      await assertPublicUrl(url);
      const res = await fetch(url, {
        method,
        redirect: "manual",
        signal: ctrl.signal,
        headers: {
          "user-agent": "WebConceptGenerator/1.0 (+concept board; contact owner)",
          accept: "text/html,application/xhtml+xml,application/xml,image/*;q=0.9,*/*;q=0.5",
          ...opts.headers,
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        await res.body?.cancel();
        url = new URL(res.headers.get("location")!, url);
        continue;
      }
      const contentType = res.headers.get("content-type") ?? "";
      const len = res.headers.get("content-length");
      const contentLength = len ? Number(len) : null;
      if (method === "HEAD" || !res.body) {
        await res.body?.cancel();
        return { url: url.toString(), status: res.status, contentType, contentLength, body: new Uint8Array() };
      }
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) { await reader.cancel(); break; }
        chunks.push(value);
      }
      const body = new Uint8Array(Math.min(total, maxBytes));
      let off = 0;
      for (const c of chunks) { body.set(c.subarray(0, Math.max(0, body.length - off)), off); off += c.length; }
      return { url: url.toString(), status: res.status, contentType, contentLength, body };
    }
    throw new BlockedUrlError("Too many redirects");
  } finally {
    clearTimeout(timer);
  }
}

export const decode = (b: Uint8Array) => new TextDecoder("utf-8", { fatal: false }).decode(b);
