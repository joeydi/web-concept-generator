import type { Content } from "../types";
import type { Copy, Profile } from "./llm";
import type { ImageSlots } from "./images";

const pad = <T,>(arr: T[], n: number, fill: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => arr[i] ?? fill(i));

/** Merge model output into the fixed-shape Content the UI renders, repairing any wrong counts. */
export function buildContent(domain: string, profile: Profile, copy: Copy, images: ImageSlots): Content {
  const services = pad(copy.services, 3, (i) => ({
    name: profile.services[i]?.name ?? "Our services",
    blurb: profile.services[i]?.description ?? profile.summary,
  })).slice(0, 3);
  const facts = pad(copy.facts.length ? copy.facts : profile.facts, 3, () => ({ value: "Local", label: "and independent" })).slice(0, 3);
  return {
    domain,
    name: profile.businessName || domain,
    nav: pad(copy.nav, 4, (i) => ["Services", "About", "Work", "Contact"][i]).slice(0, 4),
    cta: copy.cta,
    homeTitle: copy.homeTitle,
    homeBlurb: copy.homeBlurb,
    facts,
    bannerTitle: copy.bannerTitle,
    services,
    detailTitle: copy.detailTitle,
    detailBlurb: copy.detailBlurb,
    byline: copy.byline,
    subhead: copy.subhead,
    body: pad(copy.body, 2, () => profile.summary).slice(0, 2),
    images: { ...images, services: pad(images.services, 3, () => null).slice(0, 3) },
  };
}
