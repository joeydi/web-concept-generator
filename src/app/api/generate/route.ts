import { fetchPage, type PageData } from "@/lib/server/crawl";
import { buildContent } from "@/lib/server/content";
import { assignImages } from "@/lib/server/images";
import { extractProfile, writeCopy } from "@/lib/server/llm";
import { rateLimit } from "@/lib/server/ratelimit";
import { discoverUrls, pickPages } from "@/lib/server/sitemap";
import { normalizeDomain } from "@/lib/server/ssrf";
import { sseResponse, stepper } from "@/lib/server/sse";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { domain?: string } | null;
  const domain = body?.domain ? normalizeDomain(body.domain) : null;
  if (!domain) return Response.json({ error: "Enter a website address, like example.com" }, { status: 400 });
  if (!rateLimit(req, "generate", 12)) return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });

  return sseResponse(async (send) => {
    const step = stepper(send);

    // 1. sitemap
    step.start(0);
    let origin = `https://${domain}`;
    const [urls, firstHome] = await Promise.all([discoverUrls(origin), fetchPage(origin)]);
    let home = firstHome;
    if (!home) {
      // some sites only answer on the www host
      const alt = await fetchPage(`https://www.${domain}`);
      if (alt) { home = alt; origin = new URL(alt.url).origin; }
    }
    if (!home) throw new Error(`Couldn't reach ${domain}. Check the address and try again.`);
    const targets = pickPages(origin, urls, 6, home.links).filter((u) => new URL(u).pathname.replace(/\/$/, "") !== new URL(home.url).pathname.replace(/\/$/, ""));
    step.done(0);

    // 2. pages
    step.start(1);
    const rest = (await Promise.all(targets.map(fetchPage))).filter((p): p is PageData => !!p);
    const pages: PageData[] = [home, ...rest];
    step.done(1);

    // 3. profile
    step.start(2);
    const profile = await extractProfile(domain, pages);
    step.done(2);

    // 4. images
    step.start(3);
    const candidates = pages.flatMap((p) => p.images);
    const images = await assignImages(candidates, profile.services.slice(0, 3).map((s) => s.name));
    step.done(3);

    // 5. copy
    step.start(4);
    const copy = await writeCopy(domain, profile, pages);
    step.done(4);

    send({ type: "result", data: buildContent(domain, profile, copy, images) });
  });
}
