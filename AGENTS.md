<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: web concept generator

Enter a website, get homepage / landing / details page concepts built from its real content and images, then restyle them by dropping a reference image. Everything else about the app is derivable from the code; this section records what is not.

### Commands

```bash
npm run dev      # may already be running on :3001 (Next refuses a second dev server in this dir)
npm test         # vitest, tests/*.test.ts
npm run lint && npx tsc --noEmit && npm run build
```

`ANTHROPIC_API_KEY` goes in `.env.local` (git-ignored; see `.env.example`). Without it the routes return a clean "no API key" error and the UI falls back to a local style estimate.

### Layout of the code

- `src/lib/types.ts` shared zod schemas (`Style`, `Content`) and SSE event type. `src/lib/layout.ts` the layout spec: schema, six preset archetypes, `normalizeLayout` (clamp and repair), `layoutAttrs`.
- `src/lib/server/*` server only: `ssrf.ts` (all outbound fetches), `sitemap.ts`, `crawl.ts`, `images.ts`, `llm.ts` (the three Claude calls), `sse.ts`, `ratelimit.ts`.
- `src/app/api/generate` and `/api/extract-style` stream progress as SSE; `src/components/Tool.tsx` is the client state machine.
- `src/styles/app.css` holds the Meerkat-based chrome and the concept-page CSS. `prototype/` is the original static mockup, kept as a design reference only; `wireframes/` are the source wireframes.

### Conventions and gotchas

- **Layout is data, not a preset name.** A style's `layout` is `{name, spec}`. The CSS in `app.css` reads `data-*` attributes and CSS variables derived from the spec. To add a layout option: extend `LayoutSpecSchema` and `DEFAULT_SPEC`, add the CSS rule, and add a repair rule in `normalizeLayout` if some combinations break. Every spec field is required in the schema on purpose (structured outputs cap optional fields), so the model always fills the whole spec.
- **Never trust model output for validity.** Palettes go through `normalizePalette` (contrast: ink 7:1, muted 4.5:1, accent 3:1) and layouts through `normalizeLayout`; fonts are snapped to the allowed list in `src/lib/fonts.ts`. Structured outputs do not enforce numeric ranges, so ranges live in the field descriptions and in the clamps.
- **Fonts are Google Fonts only.** UI and concepts load through `next/font` (`src/lib/fontLoaders.ts`). Adding a concept font means adding it to both `fonts.ts` and `fontLoaders.ts`. Do not commit font files.
- **SSRF.** Every outbound fetch must go through `safeFetch` in `ssrf.ts`; never call `fetch` on a user-influenced URL directly. Fetched page text is untrusted: it is fenced in `<page>` tags in prompts and the system prompt says to ignore instructions inside it.
- **Models.** Default is `claude-sonnet-5-5` (override with `ANTHROPIC_MODEL`). On this model forced `tool_choice` and `thinking: disabled` return 400, so JSON comes from `output_config.format` (`zodOutputFormat`), never forced tools. Load the `claude-api` skill before changing SDK usage.
- **Stored data.** History and custom styles live in `localStorage` (`wcg.history.v1`, `wcg.styles.v1`). Parse stored styles through `StyleSchema` (`parseStoredStyles`), which migrates legacy values; never read them raw.
- **Concept pages are 1440px frames** scaled to the card width, with an assumed page height of 960px (`--ih`, `--bh` are fractions of it). Hotlinked images use `referrerPolicy="no-referrer"` and fall back to a drawn placeholder on error.
- Rate limiting is in memory (30 style extractions and 12 generations per IP per hour); it resets when the server module reloads, so restart to clear it when testing.

### Verifying UI changes

- Layout regressions: the quickest check is geometry, not screenshots. Compare element rects across presets before and after a CSS change, and run a text-overlap audit over generated styles (this caught a real bug the screenshots missed).
- The in-app browser can capture a cropped corner at some viewport sizes; reset to the desktop preset, then re-emulate (e.g. 1440x1000), before trusting a screenshot.
- Live checks need a real key. Use varied images (photos, flat graphics, minimal, collage, monochrome) and look at the spread of layouts, not one result.
