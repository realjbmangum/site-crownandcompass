# Crown and Compass — Brand Standards

> Reference for all design, content, and asset decisions. Keep this file current.
> Last updated: Feb 21, 2026

---

## 1. Brand Essence

**Who we are:** A peer-led Christian men's community built around reading, honest conversation, and The Walk.

**Positioning:** Not performance. Not a platform. A table where men sit as equals.

**Tone:** Contemplative. Honest. Quietly confident. Like a letter from an older brother, not a TED Talk.

**Primary reference:** C.S. Lewis, Dallas Willard, Thomas à Kempis — literary, unhurried, weighty.

---

## 2. Logo

### Current State
The logo mark is an inline SVG compass rose rendered in `--accent` amber. No external file dependency. No white background. Renders cleanly on any dark surface.

**Source:** `src/components/Header.astro` (inline SVG — the authoritative version)

### Logo Mark Description
- Circle border (compass perimeter)
- Four cardinal point arrows — North dominant (full amber), others at 55% opacity
- Inner ring at 35% opacity
- Center dot
- All paths use `currentColor` — inherits amber from CSS

### Logo Lockup (header)
```
[compass rose mark 28×28] Crown & Compass
```
- Mark: `color: var(--accent)` (#c9853a amber)
- Wordmark: EB Garamond 600, `var(--text-primary)` (#f0ebe2)
- Gap: 0.625rem

### Future Vector Logo (for print, social, large format)

When Brian is ready to commission or build a real vector logo, use this brief:

**Brief for designer/Figma:**
- Concept: Crown sitting atop or integrated into a compass rose. The crown should not be decorative — it should feel earned.
- Style: Clean geometric. Not ornate. Think Filson, not Harry Potter.
- Palette: Amber (#c9853a) mark on transparent background. Works on dark and light.
- Variants needed:
  - Horizontal lockup (mark + wordmark) — primary
  - Mark-only (square, for social avatars, favicons)
  - Stacked (mark above wordmark) — for print/patches
- Clear space: 1× mark height on all sides
- Minimum size: 24px mark height (do not render smaller)
- File formats: SVG source, PNG @1x/2x/3x transparent, favicon.ico

---

## 3. Color Palette

| Role | Variable | Hex | Usage |
|------|----------|-----|-------|
| Background | `--bg-base` | `#0f1117` | Page background, hero |
| Card | `--bg-card` | `#1a1a20` | Content cards, section alt-bg |
| Surface | `--bg-surface` | `#22222a` | Elevated elements, questions card |
| Text primary | `--text-primary` | `#f0ebe2` | Headings, body text |
| Text muted | `--text-muted` | `#8a8070` | Secondary text, nav links |
| Amber (accent) | `--accent` | `#c9853a` | CTAs, labels, borders, logo |
| Amber hover | `--accent-light` | `#e8a055` | Hover states |
| Border | `--border` | `#2e2c26` | Section dividers, card borders |

**Atmosphere:** Near-black backgrounds with amber warmth. Like firelight in a dark room.

---

## 4. Typography

### Display / Headings
- Font: **EB Garamond**
- Weights: 400 (italic), 500, 600, 700
- Character: Literary. C.S. Lewis-era. Slows the reader down.
- Use for: Hero headline, section headings, pull quotes, avatar numbers, nav drawer links

### Body / UI
- Font: **DM Sans**
- Weights: 300 (body), 400, 500 (labels/buttons)
- Character: Clean, readable. Does not compete with Garamond.
- Use for: Body paragraphs, nav links, buttons, labels, metadata

### Scale
```
h1: clamp(2.5rem, 6vw, 5rem)
h2: clamp(1.75rem, 4vw, 2.5rem)
h3: clamp(1.25rem, 2.5vw, 1.5rem)
body: 1.0625rem / 1.7
```

### Rules
- Headings: Garamond only
- All caps labels: DM Sans 500, letter-spacing 0.08–0.1em, amber color
- No mixing weights within a typographic role

---

## 5. Graphic Language

### Grain Texture
CSS-only SVG turbulence filter applied via `.grain-bg` utility. Opacity: 0.035. Adds analog warmth — references old paper, leather, woodgrain. Use on hero sections.

### Amber Border Accent
Left border on scripture blocks, pull quotes. 3px solid `--accent`. Visual anchor for important content.

### Compass Rose Motif
The compass is the brand mark. Use sparingly as decorative element:
- Section dividers (small centered compass SVG)
- Watermarks at low opacity on image sections
- Do NOT overuse — it loses meaning if it appears on every element

### Numbers / Ordinals
Large Garamond numerals (01, 02, 03) in amber at low opacity. Used on avatar cards. Creates rhythm and visual interest without photography. Can extend to other card types.

### No Photography (v1)
The site does not rely on photography. The atmospheric video hero is the only motion element. All other visuals are typographic or CSS-based. This is intentional — it keeps the site fast, authoritative, and timeless.

**When photography is added:** It should be dark, atmospheric, honest. Weathered hands on a book. A fire at night. A man walking a trail. Never posed, never stock-looking. Shoot in golden hour or firelight.

---

## 6. Graphical Assets Wishlist

These assets would strengthen the site. Ordered by priority.

### Priority 1 — Logo Vector (immediate need)
- [ ] Commission or create in Figma/Illustrator from the brief in Section 2
- [ ] Export SVG — update Header.astro inline SVG with the real paths
- [ ] Export PNG @3x transparent — store at `public/logo.png` for OG images, etc.

### Priority 2 — Hero Video (in progress)
- [ ] Generate 5–10s seamless loop via Runway Gen-3 / Kling / Luma
- [ ] Prompt in: `prompts/hero-video-prompt.md`
- [ ] Current placeholder: `public/bg2.mp4` — working but needs improvement
- [ ] Final file: `public/hero-bg.mp4` (update `index.astro` `src` when ready)

### Priority 3 — OG Image
- [ ] Dark card: `#0f1117` background, compass rose mark centered, "Crown and Compass" in Garamond, tagline below in DM Sans
- [ ] Size: 1200×630
- [ ] Tool: Figma or generate via Satori in build step
- [ ] Store at: `public/og-image.png`
- [ ] Update `SEOHead.astro` `og:image` once created

### Priority 4 — Favicon
- [ ] Compass rose mark only (no wordmark)
- [ ] Export: `public/favicon.ico` + `public/favicon.svg`
- [ ] Currently using Astro default — this is the easiest swap

### Priority 5 — Section Imagery (future)
- [ ] 2–3 atmospheric photographs for about page and compass page backgrounds
- [ ] See Section 5 photography direction above
- [ ] AI generation prompts below

---

## 7. AI Image Generation Prompts

Use these for Midjourney, Ideogram, Flux, or Runway still generation.

### General Atmospheric (hero alternates, section bgs)
```
dark forest clearing at dusk, warm amber firelight glow from off-screen,
ground fog, ancient oak trees, no people, ultra-wide cinematic,
color palette: near-black and deep amber, film grain, 4k
```

### Man + Book / Reading
```
a man's hands holding an open leather-bound book near a campfire at night,
dark moody lighting, amber and shadow, close crop, no face shown,
photorealistic, film grain, cinematic
```

### Brotherhood / Fellowship (abstract)
```
silhouettes of two men walking a forest trail at sunrise, backlit,
warm orange light through trees, no faces, contemplative mood,
wide shot, cinematic grain
```

### Compass / Navigation (object)
```
aged brass compass on weathered wood, shallow depth of field,
warm light from the left, dark background, amber and brown tones,
product photography style, film grain
```

### Crown (object / symbol)
```
a simple iron crown resting on stone, harsh directional light,
dramatic shadow, dark stone background, no ornamentation,
austere, powerful, cinematic still life
```

---

## 8. Voice Quick Reference

Full guide: `AI/CC/brand/voice.md`

**The character:** Barnabas — the encourager, the one who sees potential, the friend who walks alongside.

**Tone:**
- Contemplative, not urgent
- Questions over declarations
- Alongside, not above
- Weight without heaviness
- Honest, not polished

**Never:**
- Emojis
- Litotes ("not bad", "not the worst", "not unlike")
- Drill sergeant commands ("DO THIS. NOW.")
- Hype / hustle language
- Polished "content" voice

**Model authors:** C.S. Lewis, Dallas Willard, Thomas à Kempis, Eugene Peterson

---

## 9. Do's and Don'ts

### Do
- Let negative space breathe
- Use amber sparingly — it only works because it's surrounded by dark
- Trust the typography — a great Garamond headline needs no decoration
- Write like you're talking to one man, not an audience
- Keep the site fast — no large unoptimized images

### Don't
- Add icons for icon's sake (no icon libraries)
- Use gradients (except subtle bg-to-transparent on video overlay)
- Create elaborate section layouts that compete with text
- Add animations beyond the scroll reveal and scroll cue
- Stack more than two font families on one page

---

*This document is the authoritative design reference for Crown and Compass. Update it when design decisions change.*
