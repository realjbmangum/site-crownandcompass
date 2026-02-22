# site-crownandcompass

Crown and Compass public website. Astro hybrid site deployed to Cloudflare Pages.

## Stack

- **Framework:** Astro 4.x (`output: 'hybrid'` — 4 static pages + 1 API route)
- **Adapter:** `@astrojs/cloudflare`
- **Styling:** Tailwind CSS 3.x + custom CSS variables in `src/styles/global.css`
- **Hosting:** Cloudflare Pages (auto-deploy from GitHub)
- **Database:** Cloudflare D1 (`DB` binding) — subscribers table
- **Email:** SendGrid — new subscriber notification to NOTIFICATION_EMAIL
- **Fonts:** EB Garamond + DM Sans via Google Fonts

## Design System

**Colors (CSS variables in global.css):**
- `--bg-base: #0f1117` — near-black body background
- `--bg-card: #1a1a20` — card/section backgrounds
- `--bg-surface: #22222a` — elevated surfaces
- `--text-primary: #f0ebe2` — warm off-white
- `--text-muted: #8a8070` — secondary text
- `--accent: #c9853a` — amber (CTAs, labels, borders)
- `--accent-light: #e8a055` — hover state
- `--border: #2e2c26` — subtle borders

**Typography:**
- Display/Headings: `EB Garamond` (literary, C.S. Lewis-ish)
- Body/UI: `DM Sans` (clean, readable)

**Key utilities:**
- `.grain-bg` — adds subtle grain texture overlay (CSS-only SVG)
- `.btn-amber` — primary amber CTA button
- `.btn-ghost` — ghost outline button
- `.section-pad` — standard section padding
- `.section-container` — centered max-width wrapper
- `.prose-cc` — long-form reading typography
- `.scripture-block` — amber-bordered scripture callout
- `.questions-card` — elevated question list card

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| Homepage | `/` | Front door — all key sections |
| The Compass | `/compass` | Full curriculum, sticky sidebar |
| About | `/about` | Origin story + Brian's role |
| Join | `/join` | Web3Forms contact form |

## Brand

All CC brand content lives in this repo under `brand/`:

| File | What It Is |
|------|-----------|
| `brand/brand-standards.md` | Full design reference — logo, colors, type, graphic language, asset wishlist, AI image prompts |
| `brand/voice.md` | Writing voice guide — tone, character, what NOT to do |

## Content Sources

| Page Section | Source File |
|---|---|
| What CC Is, How It Works | `brand/` or site copy (inline) |
| Brand Voice | `brand/voice.md` |
| Design Decisions | `brand/brand-standards.md` |

## Setup

```bash
cd site-crownandcompass
npm install
npm run dev
```

## Backend Setup (D1 + SendGrid)

### Cloudflare D1
1. `wrangler d1 create crownandcompass` — note the database_id
2. Update `database_id` in `wrangler.toml`
3. `wrangler d1 execute crownandcompass --file=data/schema.sql` — create table
4. In Cloudflare Pages → Settings → Bindings: add D1 binding `DB` → `crownandcompass`

### SendGrid
1. Add `SENDGRID_API_KEY` + `NOTIFICATION_EMAIL` to Cloudflare Pages env vars
2. Test via form submission — Brian receives email, row appears in D1

### Local dev
```bash
npx wrangler pages dev dist --d1=DB
```
Run `npm run build` first, then use wrangler to serve with D1 binding.

## Logo

Logo is at `public/logo.png` (copied from `AI/CC/brand/CrownAndCompass.png`).
If logo needs a transparent background and it has a white bg, update the header to use
a different rendering approach or add `filter: brightness(0) invert(1)` for pure white.

## Deploy to Cloudflare Pages

1. Push to GitHub repo `realjbmangum/site-crownandcompass`
2. Connect in Cloudflare Pages dashboard:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add custom domain when ready

## Session Log

### Feb 21, 2026 — Session 1
- Initial build from plan. All 4 pages created.
- Design system: dark atmospheric, EB Garamond + DM Sans, amber accent
- Grain texture via CSS-only SVG turbulence filter
- Sticky sidebar on Compass page (CSS-only, no JS)
- Web3Forms integrated in Join page
- Logo copied from AI/CC/brand/

### Feb 21, 2026 — Session 2
- Upgraded from `output: 'static'` → `output: 'hybrid'`
- Added `@astrojs/cloudflare` adapter
- Created `wrangler.toml` with D1 binding config
- Created `data/schema.sql` — subscribers table
- Created `src/pages/api/join.ts` — D1 insert + SendGrid notify
- Replaced Web3Forms with first-party `/api/join` endpoint
- Join form: JS fetch with CC-voice success state ("Good. Brian will reach out soon.")
- Added video hero layer to `index.astro` (`hero-bg.mp4`, opacity 0.18, graceful fallback)
- Created `.env.example`
- Created `prompts/hero-video-prompt.md` (Runway, Kling, Luma prompts)
- Build confirmed clean: 4 static + 1 API route
- TODO: Create D1 database (`wrangler d1 create crownandcompass`)
- TODO: Update `database_id` in wrangler.toml
- TODO: Run schema migration
- TODO: Add SendGrid key + NOTIFICATION_EMAIL to Cloudflare Pages env
- TODO: Push to GitHub
- TODO: Generate hero-bg.mp4 using prompts in `prompts/hero-video-prompt.md`
