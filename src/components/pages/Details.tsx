import type { Content } from "@/lib/types";
import { Img, Nav } from "./shared";

export function Details({ c }: { c: Content }) {
  return (
    <div className="page details">
      <Nav c={c} />
      <section className="d-top">
        <Img src={c.images.detail} seed={2} />
        <div><h1>{c.detailTitle}</h1><p>{c.detailBlurb}</p></div>
      </section>
      <section className="d-body">
        <div className="byline">
          <span className="avatar">{c.byline.name.charAt(0)}</span>
          <div><b>{c.byline.name}</b><span>{c.byline.role}</span></div>
        </div>
        <div className="prose"><p>{c.body[0]}</p><h4>{c.subhead}</h4><p>{c.body[1]}</p></div>
      </section>
    </div>
  );
}
