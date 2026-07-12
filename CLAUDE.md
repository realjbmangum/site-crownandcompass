# site-crownandcompass

Crown and Compass public website. Astro hybrid site deployed to Cloudflare Pages.

> [!important] Current direction (updated July 2026)
> The brand and design have been rebuilt on the official **Brand & Identity Field Manual** (Ink / Bone / Ember, Zilla Slab / Spectral / IBM Plex Mono, a heraldic seal). The **source of truth right now is the local prototype in `prototype/`** — a full clickable mockup of the public site and the member app, pending Brian's sign-off before the Astro rebuild. When we build, follow the prototype plus `brand/voice.md` and `brand/redesign-spec.md`. The sections below marked _(superseded)_ describe the OLD deployed build and are kept only as a record.

## Stack

- **Framework:** Astro 4.x (`output: 'hybrid'` — 4 static pages + 1 API route)
- **Adapter:** `@astrojs/cloudflare`
- **Styling:** Tailwind CSS 3.x + custom CSS variables in `src/styles/global.css`
- **Hosting:** Cloudflare Pages (auto-deploy from GitHub)
- **Database:** Cloudflare D1 (`DB` binding) — subscribers table
- **Email:** SendGrid — new subscriber notification to NOTIFICATION_EMAIL
- **Fonts:** Zilla Slab (display) + Spectral (body) + IBM Plex Mono (labels) via Google Fonts

## Design System (official Field Manual brand)

The live prototype design system is in `prototype/proto.css` (CSS variables), to be ported to the Astro build.

**Palette:**
- `--ink: #16130D` — primary text + the mark
- `--bone: #F1EBDC` — primary paper ground
- `--bone-2: #E7DEC9` — second paper tone (alternating sections)
- `--charcoal: #2C2B29` — depth: dark blocks, footer, quotes
- `--ember: #C0552A` — accent: labels, rules, primary buttons (kept rare, reserved for actions)
- `--ember-dark: #A5451E` — accent hover / on-bone label

**Typography:**
- Display/Headings: `Zilla Slab` (slab serif)
- Body/reading: `Spectral` (literary serif)
- Labels/eyebrows: `IBM Plex Mono` (uppercase, letter-spaced)

Square corners (no border-radius), hairline rules, mono kicker labels, atmospheric photography. Tagline: "Point True."

**Key classes (`prototype/proto.css`):**
- `.kicker` / `.kicker-rule` — mono uppercase eyebrow with ember rule
- `.btn-ember` / `.btn-ghost` — square primary + ghost buttons
- `.card` / `.grid` — hairline cards and 1px-gap grids
- `.section` + ground classes `.bone` / `.bone2` / `.charcoal` / `.ink`
- `.prose` — long-form reading typography; `.site-header` / `.site-footer` — ink header, slim charcoal footer

_(superseded)_ The original deployed build used `#0f1117` + EB Garamond / DM Sans with `.grain-bg` / `.btn-amber` / `.scripture-block` utilities in `src/styles/global.css`. That system is being replaced.

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

The mark is the heraldic **Crown & Compass seal**, a transparent PNG in these colorways:
- `public/cc-white.png` — primary, for dark grounds (header, footer, hero)
- `public/cc-black.png` — for light / cream backgrounds
- `public/cc-orange.png` — ember accent (favicon, social avatar, one-off spots)
- `public/cc.png` — the original gold seal

For the build, export sized versions (a small header mark, a hero-size one) in an optimized format; the source PNGs are ~0.5-2 MB. The orange seal reads best as a favicon at tab size. Old `public/logo.png` is superseded.

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

### July 12, 2026 — Brand + prototype rebuild
- Rebuilt the whole brand on the official Field Manual (Ink / Bone / Ember, Zilla Slab / Spectral / IBM Plex Mono, heraldic seal). Full clickable prototype of the public site + member app in `prototype/` (see `prototype/sitemap.md` and `prototype/index.html`).
- Home hero uses a looping video (`public/hero-bg.mp4`) with the seal large on the right. Logo colorways added (`public/cc-*.png`); adopted white-on-dark / black-on-light as the logo system.
- Removed the Stories and Support pages; rolled a "More" dropdown nav across all public pages; slimmed the footer and dropped the "Point True" tagline line.
- Ran design (impeccable) + copy (voice) quality passes: reports in `prototype/_review-design.md` and `prototype/_review-copy.md`. Fixed AI-slop side-stripe borders and light-touch voice/litotes edits.
- Current book placeholder aligned to *Disciplines of a Godly Man* across all pages.
- Pending: Brian's sign-off, then the Astro rebuild from the prototype. Move image/video assets to R2 at go-live; the member app gets its own repo (`app-crownandcompass`).
