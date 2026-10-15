import type { Content } from "@/lib/types";
import { Img, Nav } from "./shared";

export function Home({ c }: { c: Content }) {
  return (
    <div className="page home">
      <Nav c={c} />
      <section className="hero">
        <div><h1>{c.homeTitle}</h1></div>
        <div><p className="lede">{c.homeBlurb}</p><span className="btn">{c.cta}</span></div>
      </section>
      <Img src={c.images.hero} seed={0} className="hero-img" />
      <div className="facts">
        {c.facts.map((f) => <div key={f.label}><b>{f.value}</b><span>{f.label}</span></div>)}
      </div>
    </div>
  );
}
