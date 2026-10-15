# Web concept generator

Enter a website and get homepage, landing page and details page concepts built from that site's real content and images. Restyle them by dropping a reference image on the style strip: a vision model extracts colours, fonts, spacing, layout and vibe.

- `src/` Next.js app (App Router, TypeScript)
  - `app/api/generate` crawls the site (sitemap, pages), extracts a business profile, picks images, and writes concept copy. Streams progress as SSE.
  - `app/api/extract-style` sends a downscaled image to Claude (vision) and returns a style; palettes are contrast-clamped server-side.
- `prototype/` the original clickable mockup (design reference, not part of the app)
- `wireframes/` the source wireframes

## Run

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm install
npm run dev
```

`npm test` runs the unit tests (SSRF guard, sitemap/image parsing, colour rules, schemas).

## Notes

- Fonts are all Google Fonts via `next/font` (UI: Hanken Grotesk + JetBrains Mono; concept styles: the list in `src/lib/fonts.ts`).
- Outbound fetches go through an SSRF guard (`src/lib/server/ssrf.ts`). Page text is passed to the model as fenced, untrusted data.
- History and custom styles are stored in `localStorage`; there is no database.
- Rate limiting is in memory and best-effort on serverless.
