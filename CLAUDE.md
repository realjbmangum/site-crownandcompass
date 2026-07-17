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

### July 12, 2026 — Go-live migration (PR #4)
- **Root cause of "old site still showing":** the redesign lived in `prototype/`,
  which Astro never builds — it only builds `src/pages/` and copies `public/`
  verbatim to `dist/`. Merging PR #3 updated the repo but not the deployed output.
- **Fix (chosen over an Astro-component rebuild for reliability):** serve the new
  site as static HTML from `public/`. Ported all 40 prototype pages into
  `public/` (home = `public/index.html`; internal `home.html` links → `/`),
  moved `proto.css` + `img/` + `assets/` alongside them, and deleted the
  `prototype/` folder.
- **Removed the old build source:** `src/pages/{index,about,books,compass,join}.astro`,
  `BaseLayout`, `Header/Footer/PillarCard/AvatarCard/SEOHead`, `global.css`,
  `books.json`, plus duplicate public-root media. **Kept the backend:**
  `src/pages/api/*` (`join`, `newsletter/send`, `unsubscribe`), `src/lib/*`,
  `src/pages/admin/newsletter.astro`.
- **Wired the Join + Contact forms** to the existing `/api/join` (D1 `subscribers`
  + SendGrid); CC-voice success/error states. Added `public/favicon.ico`.
- Build verified: 40 pages in `dist`, 0 old-brand markers, all routes 200.
- **Architecture note:** the site is now static-HTML-in-`public/` on top of the
  Astro/Cloudflare shell (whose only job is the API routes + admin). A future
  proper Astro-component rebuild is optional, not required. Assets still move to
  R2 at scale; the member app still gets its own repo.
- Next: merge PR #4 → Cloudflare rebuilds `main` → new site live. Then member-app
  architecture + user stories.

### July 12, 2026 — Remove the old newsletter subsystem (security + old brand)
- **Two problems in the merged go-live:** (1) `/admin/newsletter` shipped as a
  **publicly reachable, unauthenticated page** — only the *send* was secret-gated,
  the composer itself loaded for anyone with the URL. Never acceptable. (2) The
  newsletter **email + unsubscribe page were still on the OLD brand** (`#0f1117`,
  EB Garamond / DM Sans, "The Walk. Long. Slow. Together.").
- **Audited every page in `public/` and `src/` for old branding.** Result: the
  **public site is clean** — all old-brand code was confined to the newsletter
  subsystem in `src/`. (The only `public/` hits were false positives: a chart
  color var `amber2` in the `app-admin` mockup, and a `.btn-amber` alias in
  `proto.css` deliberately mapped to the *new* ember.)
- **Removed the whole subsystem:** `src/pages/admin/newsletter.astro`,
  `src/pages/api/newsletter/send.ts`, `src/pages/api/unsubscribe.ts`,
  `src/lib/site.ts`, `src/lib/unsubscribe.ts` (self-contained; nothing else
  imported them). **Kept** `src/pages/api/join.ts` + `src/lib/html.ts` (shared).
  Only API route left is `/api/join`. Trimmed `.env.example` to just the two
  SendGrid vars.
- **The newsletter is NOT gone as a capability — it moves.** Per Brian: newsletters
  get **drafted with Claude inside the member-app admin** (behind real auth), and
  he already has the newsletter **design ready**. SendGrid stays as the send
  vehicle only. We build that engine fresh during the app work; `ADMIN_SECRET` /
  `SITE_URL` / `MAILING_ADDRESS` return then, not before.
- Build verified: succeeds, `/admin/newsletter` gone from the SSR bundle, **0
  old-brand markers** in `dist`. PR opened off `main`.

### July 14, 2026 — overnight audit sweep (dead forms, mobile nav, current-book, copy)

Two-agent read-only audit of the public site (bugs + copy), then hand-fixes +
live verification in a real browser. Commits `141a7fe` + `2c6274e` on `main`.

- **Newsletter was dead site-wide.** Every subscribe form (13 pages) plus the two
  homepage forms (newsletter + Join CTA) were `onsubmit="return false"` with no
  handler, silently discarding every email. Added `src/pages/api/subscribe.ts`
  (email-only upsert into `subscribers`, does not clobber an existing name;
  optional SendGrid confirmation) and a new shared **`public/site.js`** that
  wires every `.news-form` / `.join-form`. Verified live: a submit returns
  "You are on the list." (left one test row `audit-delete-me@example.com` — delete it).
- **No mobile nav.** Below 940px the header links + whole "More" menu were hidden
  with no hamburger. `site.js` injects a hamburger + drop panel (built from the
  existing nav) and a click/touch toggle for "More"; CSS in `proto.css`. **Note:**
  the CSS additions required bumping the cache-buster **`proto.css?v=8 → ?v=9`**
  across all 37 pages, or returning visitors keep the old cached stylesheet and
  the mobile nav does not apply. Any future `proto.css` change must bump this.
- **Current-book display is now fully dynamic from D1.** `/api/current-book`
  returns `cover_url`; the reading-list "Now Reading" swaps cover + buy link +
  hides the guide button when `guide_url` is null, and the blurb is now
  book-agnostic. `reading-guide.html` had its dynamic hooks stripped so it stays
  the honest Disciplines guide (its whole six-week body is Disciplines-specific).
  `resources.html` current-book card made static + its two wrong guide links fixed.
- **Copy:** removed the placeholder find-a-chapter map caption and the shipped
  "Alternate state…" prototype annotation (+ its contradictory always-on
  between-books box); replaced hardcoded "Brian" in join + start-a-chapter with
  generic voice (blog bylines kept); fixed a spaced-hyphen dash + en-dash ranges;
  `_headers` now points at the real hero video.
- **`site.js` loads on all 37 pages** (a shared behavior layer; new file, no
  cache-buster needed). `data/` (Ty's Waymaker `.docx`) stays untracked — commit
  with `git add src public`, never `-A`.

### July 15-17, 2026 — reading list from D1 + guide links + WCAG contrast

- **Design/security review Tier 1** (impeccable + design + security skills, both
  repos): the ember accent failed WCAG AA as small text and as the button fill
  everywhere. Retokenized `proto.css` — `--ember-dark` for small text/buttons on
  light grounds, `--ember-light` for small text on dark grounds; darkened
  `--muted-2`. Swept per-page inline labels, rhythm grid, planner, directory pill.
  Also: hide `.signin` under 940px (390px header was overcrowded), skip-to-content
  link via `site.js`, removed the 100-day-planner side-stripe, baseline security
  headers + form length caps. **Bumped `proto.css?v=9 → v=10`.**
- **Reading list is dynamic from D1.** New `/api/reading-list` (current book +
  "where we've been" shelf = books with a past cycle OR a blurb, except current).
  `reading-list.html` rebuilds the shelf from it (hardcoded cards = no-JS
  fallback); a slug→site-guide map + `has_guide` from D1 keep guide links right.
  The current-book "Reading Guide" button links to the **app** guide
  (`app.thecrownandcompass.org/guide/<slug>`) when a guide is published there.
- Current-book cover uses `background-size: contain` (was cropping square covers).
- The `books.description` column + `book_guides` table live in the shared D1
  (owned by the app repo's schema). Applied via `wrangler --remote`.
- **Reminder: any `proto.css` change must bump the `?v=` on all 37 pages.**
