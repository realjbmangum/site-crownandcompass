# site-crownandcompass

Crown and Compass public website. Static Astro site deployed to Cloudflare Pages.

## Stack

- **Framework:** Astro 4.x (static output)
- **Styling:** Tailwind CSS 3.x + custom CSS variables in `src/styles/global.css`
- **Hosting:** Cloudflare Pages (auto-deploy from GitHub)
- **Forms:** Web3Forms (join form — free tier, 250/month)
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

## Content Sources

| Page Section | Source File |
|---|---|
| What CC Is, How It Works | `AI/CC/planning/cc-platform-definition.md` |
| Who It's For | `cc-platform-definition.md` section 2 |
| The Compass | `AI/CC/planning/the-compass.md` |
| Brand Voice | `AI/CC/brand/voice.md` |

## Setup

```bash
cd site-crownandcompass
npm install
npm run dev
```

## Web3Forms Setup

1. Go to [web3forms.com](https://web3forms.com/) and get a free access key
2. Replace `YOUR_WEB3FORMS_ACCESS_KEY` in `src/pages/join.astro`
3. Test a form submission before launching

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

### Feb 21, 2026
- Initial build from plan. All 4 pages created.
- Design system: dark atmospheric, EB Garamond + DM Sans, amber accent
- Grain texture via CSS-only SVG turbulence filter
- Sticky sidebar on Compass page (CSS-only, no JS)
- Web3Forms integrated in Join page (needs access key)
- Logo copied from AI/CC/brand/
- TODO: Run npm install + verify build
- TODO: Add Web3Forms access key before launch
- TODO: Test form submission
- TODO: Push to GitHub + connect Cloudflare Pages
