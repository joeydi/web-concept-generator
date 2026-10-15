import type { Content } from "@/lib/types";
import { Img, Nav } from "./shared";

export function Services({ c }: { c: Content }) {
  return (
    <div className="page services">
      <Nav c={c} />
      <div className="banner"><Img src={c.images.banner} seed={1} /><h2>{c.bannerTitle}</h2></div>
      <div className="cards">
        {c.services.map((s, i) => (
          <article className="card" key={s.name}>
            <Img src={c.images.services[i]} seed={i + 2} />
            <h3>{s.name}</h3><p>{s.blurb}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
