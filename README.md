# Web concept generator

Enter a website and get homepage, landing page and details page concepts built from that site's real content and images. Drop a reference image on the style strip and a vision model extracts a style from it: colours, fonts, spacing, vibe, and a page layout.

## How it works

**Generate** (`POST /api/generate`, streamed as SSE). Reads the site's sitemap, fetches a handful of pages (home page navigation is weighted over blog posts), then:

1. extracts a business profile (name, services, facts, a real named person if the site has one),
2. finds images in the crawled HTML and assigns them to board slots,
3. writes concept copy grounded in the site, with no invented facts.

Images are only ever taken from the crawled site; missing ones fall back to a drawn placeholder.

**Extract a style** (`POST /api/extract-style`, streamed as SSE). The image is downscaled in the browser and sent to Claude with its measured dominant colours as hints. The model returns colours, a headline and body font from an allowed Google Fonts list, spacing and radius, a vibe, and a layout spec.

**Layouts are generated, not picked.** A style carries a layout spec of 25 parameters (nav style, hero mode, headline scale and overlap, image treatment, card layout, tilt, banner, details arrangement and so on). The page CSS reads the spec through `data-*` attributes and CSS variables, so any combination renders and switching styles is instant. The six archetypes (symmetrical, asymmetrical, clean, overlapping, traditional, avant-garde) are example specs and the built-in styles. Colours and layouts are clamped and repaired server-side, so model output can't produce unreadable text or broken combinations.

## Run it

```bash
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm install
npm run dev
```

Open the URL Next prints. Optional: set `ANTHROPIC_MODEL` to change the model (default `claude-sonnet-5-5`).

Without a key the routes return a clear error, and dropping an image falls back to a local, pixel-based style estimate.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (SSRF guard, sitemap and image parsing, colour rules, layout spec, schemas, stored-style migration) |
| `npm run lint` | ESLint |

## Project layout

```
src/app/            page, layout, and the two API routes
src/components/     Tool (state machine), Board, StyleStrip, SearchBar, concept pages
src/lib/            shared types, layout spec, fonts, colour maths, presets, history
src/lib/server/     SSRF guard, sitemap, crawl, image ranking, Claude calls, SSE, rate limit
src/styles/         Meerkat design tokens and all CSS
tests/              vitest
prototype/          the original static mockup (design reference only)
wireframes/         source wireframes
```

## Safety and limits

- Outbound fetches go through an SSRF guard: http(s) only, every hop (including redirects) must resolve to a public address, size and time capped.
- Page text is passed to the model as fenced, untrusted data.
- Uploaded images: JPEG, PNG, WebP or GIF, up to 5 MB.
- Rate limits are in memory and best-effort on serverless: 12 generations and 30 style extractions per IP per hour.
- History and custom styles are stored in the browser's `localStorage`. There is no database, so nothing is shared between devices.

## Deploying

Built for Vercel. Both routes run on the Node runtime with a 60 second limit; a typical site takes 15-20 seconds. Set `ANTHROPIC_API_KEY` in the project's environment.

## Fonts

All fonts are Google Fonts loaded with `next/font`: Hanken Grotesk and JetBrains Mono for the interface, and the list in `src/lib/fonts.ts` for concept styles. The interface uses the Meerkat design tokens.
