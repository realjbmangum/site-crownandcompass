# Crown and Compass — Heraldic Redesign Spec

> Implementation-ready spec for transforming the site from "clean atmospheric" to
> "heraldic crest + vintage badge" character. Every change maps to the logo direction:
> circular badge feel, shield/crest elements, distressed precision, amber on dark,
> old-world craftsmanship meets earned field patch.
>
> **Rules:** Keep the dark palette. Keep EB Garamond + DM Sans. No new dependencies.
> No icon libraries. Mobile-safe. Precision and weight, not decoration.

---

## 1. New CSS Utilities (add to `global.css`)

### 1a. Ornamental Section Divider — `.divider-ornament`

A horizontal rule with a small centered diamond/compass mark between two lines.
Replaces the plain `.section-divider` where a section break needs more ceremony.

```css
/* ----------------------------------------
   Ornamental Divider
   A centered diamond flanked by two amber lines.
   Use between major page sections for heraldic rhythm.
---------------------------------------- */
.divider-ornament {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  max-width: 68rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.divider-ornament::before,
.divider-ornament::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.divider-ornament::before {
  background: linear-gradient(to right, transparent, var(--border));
}

.divider-ornament::after {
  background: linear-gradient(to left, transparent, var(--border));
}

.divider-ornament-mark {
  width: 10px;
  height: 10px;
  border: 1px solid var(--accent);
  transform: rotate(45deg);
  flex-shrink: 0;
  opacity: 0.6;
}
```

**HTML usage:**
```html
<div class="divider-ornament">
  <span class="divider-ornament-mark"></span>
</div>
```

**Why:** The plain `section-divider` (a 1px line) is invisible weight. The ornamental version
introduces heraldic rhythm — the diamond is a classic crest element, rotated 45deg to read as a
field mark. The fading lines reference engraved rule work on certificates and old-world documents.

---

### 1b. Flanked Label — `.label-flanked`

Eyebrow labels like `WHAT THIS IS` bracketed by short horizontal rules: `--- WHAT THIS IS ---`.
This is the heraldic equivalent of a banner across a crest.

```css
/* ----------------------------------------
   Flanked Label
   Eyebrow text with short amber rules on either side.
   Use for section labels that need heraldic weight.
---------------------------------------- */
.label-flanked {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.75rem;
}

.label-flanked::before,
.label-flanked::after {
  content: '';
  width: 2rem;
  height: 1px;
  background-color: var(--accent);
  opacity: 0.4;
  flex-shrink: 0;
}
```

**HTML usage:**
```html
<p class="label-flanked">What This Is</p>
```

**Why:** The existing `.overline` labels float without grounding. The flanked rules anchor them
visually — like the banner ribbons on a heraldic crest that hold the motto. Short rules (2rem)
keep it subtle, not showy.

---

### 1c. Badge Card Border — `.badge-border`

Double-border treatment: outer full border + inner inset border. Looks like the edge of an
embroidered patch or a vintage certificate frame.

```css
/* ----------------------------------------
   Badge Card Border
   Double-border: outer line + inner inset line.
   Vintage badge / embroidered patch feel.
   Apply to any card or container.
---------------------------------------- */
.badge-border {
  border: 1px solid var(--accent);
  padding: 0.375rem; /* gap between outer and inner border */
  background-color: var(--bg-card);
}

.badge-border-inner {
  border: 1px solid rgba(201, 133, 58, 0.25);
  padding: 1.75rem;
  background-color: var(--bg-card);
}
```

**HTML usage:**
```html
<div class="badge-border">
  <div class="badge-border-inner">
    ...content...
  </div>
</div>
```

**Simplified single-element version** (for components where wrapper nesting is unwanted):

```css
.badge-frame {
  border: 1px solid var(--accent);
  outline: 1px solid rgba(201, 133, 58, 0.25);
  outline-offset: -6px;
  padding: 2rem;
  background-color: var(--bg-card);
}
```

**Why:** The current cards use a single 1px border in `--border` (dark gray). The double border
reads as a badge edge — the same construction used on military patches, university seals, and
Red Wing Heritage product tags. The outer border is full amber; the inner is 25% opacity amber
for depth without noise.

---

### 1d. Heraldic Section Rule — `.rule-heraldic`

A thicker amber line placed above section headings. Reads as the top bar of a shield or the
header stroke on a vintage certificate.

```css
/* ----------------------------------------
   Heraldic Section Rule
   A thick amber line used above major section headings.
   Reads as the top bar of a shield.
---------------------------------------- */
.rule-heraldic {
  width: 3rem;
  height: 2px;
  background-color: var(--accent);
  margin-bottom: 1.25rem;
  opacity: 0.7;
}
```

**HTML usage:**
```html
<div class="rule-heraldic"></div>
<h2>How It Works</h2>
```

**Why:** The existing section headings have no visual anchor above them. This amber bar introduces
heraldic weight without taking space — it's the same proportion as the top stroke on a shield
shape. Short (3rem) so it reads as intentional, not as a full-width border.

---

### 1e. Crest Corner Accents — `.crest-corners`

Corner marks on a container — small L-shapes at each corner. The frame-within-a-frame
technique used on old certificates, warrants, and commissioned documents.

```css
/* ----------------------------------------
   Crest Corner Accents
   Decorative corner marks for a framed, certified look.
   Apply to blockquotes, feature callouts, or hero sections.
---------------------------------------- */
.crest-corners {
  position: relative;
  padding: 2.5rem;
}

.crest-corners::before,
.crest-corners::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--accent);
  border-style: solid;
  opacity: 0.4;
}

.crest-corners::before {
  top: 0;
  left: 0;
  border-width: 1px 0 0 1px;
}

.crest-corners::after {
  bottom: 0;
  right: 0;
  border-width: 0 1px 1px 0;
}
```

**Why:** Corner accents appear on virtually every vintage badge, patch, and certificate.
Two corners (top-left, bottom-right) are enough to imply the full frame without the visual
weight of a complete border. Keeps the open, breathing feel of the current design while
adding crest character.

---

### 1f. Shield Accent Border — `.shield-accent`

A top-heavy border that reads as a shield silhouette: thick amber top, thin sides, no bottom.

```css
/* ----------------------------------------
   Shield Accent Border
   Thick top, thin sides, open bottom.
   Reads as a shield silhouette.
---------------------------------------- */
.shield-accent {
  border-top: 3px solid var(--accent);
  border-left: 1px solid rgba(201, 133, 58, 0.2);
  border-right: 1px solid rgba(201, 133, 58, 0.2);
  border-bottom: none;
  padding: 1.75rem 1.5rem;
  background-color: var(--bg-card);
}
```

**Why:** The PillarCard already uses `border-top: 2px solid var(--accent)`. This utility extends
that into a full shield shape by adding thin side borders at low opacity. The open bottom
lets content breathe downward.

---

## 2. Component Changes

### 2a. Header.astro

**Current state:** Sticky header, compass SVG mark + "Crown & Compass" wordmark, clean nav.

**Changes:**

1. **Add a thin amber rule below the header border.** Replace the single `border-bottom: 1px solid var(--border)` with a double line — the existing border plus a second 1px amber line below it at 0.2 opacity. This is the badge double-line treatment applied to the header edge.

```css
/* In Header.astro <style> — replace existing border-bottom */
.site-header {
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 0 rgba(201, 133, 58, 0.15);
}
```

2. **Add letter-spacing to the logo wordmark.** Increase tracking on `.logo-text` to `0.04em`. Heraldic text on crests and seals always has wide tracking — it signals formality and craft.

```css
.logo-text {
  letter-spacing: 0.04em;
}
```

3. **No other header changes.** The header is navigation — it should stay clean and fast. The heraldic character comes from the page content below, not the chrome.

---

### 2b. Footer.astro

**Current state:** Centered layout, compass SVG, name, tagline, nav links, copyright.

**Changes:**

1. **Add an ornamental divider above the footer.** Replace the plain `border-top: 1px solid var(--border)` with the `.divider-ornament` pattern rendered inline (since the footer is a component, embed the styles directly rather than requiring markup outside the component).

```css
/* Replace border-top with a double-line + amber accent */
.site-footer {
  border-top: 1px solid var(--border);
  box-shadow: 0 -1px 0 0 rgba(201, 133, 58, 0.15);
}
```

2. **Add flanked rules around the tagline.** Wrap the tagline "The Walk. Long. Slow. Together." with the flanked-label pattern, but in italic Garamond instead of uppercase DM Sans (to preserve the voice).

```css
.footer-tagline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-tagline::before,
.footer-tagline::after {
  content: '';
  width: 1.5rem;
  height: 1px;
  background-color: var(--accent);
  opacity: 0.3;
  flex-shrink: 0;
}
```

3. **Increase compass SVG opacity.** From `0.6` to `0.7`. The footer mark should feel more present — like a seal stamped at the bottom of a document.

```css
.footer-logo {
  opacity: 0.7;
}
```

---

### 2c. AvatarCard.astro

**Current state:** Simple card with bg-card background, 1px border, large number (01/02/03),
headline, description.

**Changes:**

1. **Apply badge-frame treatment.** Replace the single border with the double-border badge look using `outline` + `outline-offset`.

```css
.avatar-card {
  background-color: var(--bg-card);
  border: 1px solid var(--accent);
  outline: 1px solid rgba(201, 133, 58, 0.2);
  outline-offset: -6px;
  padding: 2rem;
  /* rest stays the same */
}
```

2. **Add a heraldic rule between the number and the headline.** A short 1.5rem amber line at
low opacity, creating visual separation that reads as a badge interior divider.

Add to the HTML between `.card-number` and `.avatar-headline`:
```html
<div class="card-rule" aria-hidden="true"></div>
```

```css
.card-rule {
  width: 1.5rem;
  height: 1px;
  background-color: var(--accent);
  opacity: 0.4;
}
```

3. **Increase the number weight.** Change `.card-number` font-weight from 700 to 800, and reduce
opacity from 0.45 to 0.35. The number should feel stamped/embossed — heavier but more recessed,
like a debossed numeral on a leather badge.

```css
.card-number {
  font-weight: 800;
  opacity: 0.35;
}
```

---

### 2d. PillarCard.astro

**Current state:** Card with bg-card background, 1px border, 2px amber top border. Name
(uppercase label), hook (Garamond), arrow.

**Changes:**

1. **Upgrade to shield-accent border.** Replace the current border combo with the shield pattern:
thick amber top, thin amber sides, open bottom.

```css
.pillar-card {
  border: none;
  border-top: 3px solid var(--accent);
  border-left: 1px solid rgba(201, 133, 58, 0.2);
  border-right: 1px solid rgba(201, 133, 58, 0.2);
  border-bottom: 1px solid var(--border);
  /* existing padding, bg, transitions stay */
}
```

2. **Add corner accents** (top-left only) to each card. Since each card is small, only one
corner mark is needed.

```css
.pillar-card {
  position: relative;
}

.pillar-card::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  width: 12px;
  height: 12px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
  opacity: 0.3;
  pointer-events: none;
}
```

3. **Replace arrow with an em dash.** The `->` arrow feels modern/tech. Replace with `—` (em dash),
which is more in keeping with old-world typography. Or keep the arrow but style it as a small
compass-point triangle.

```css
.pillar-arrow {
  font-family: 'EB Garamond', Georgia, serif;
  color: var(--accent);
  opacity: 0.5;
}
```

Change the arrow text from `\u2192` to `\u2014` (em dash) in the component.

---

## 3. Page Changes

### 3a. index.astro (Homepage)

The homepage needs the most transformation. Six sections, each gets specific heraldic treatment.

#### Hero Section
- **Add `crest-corners`** to `.hero-inner`. Corner marks at top-left and bottom-right of the
  hero text block. This frames the headline like a commissioned document.
- **Change `.hero-eyebrow`** from plain overline to `.label-flanked`. The brand name at the
  top of the hero should feel like a crest banner.
- **No other hero changes.** The video background, grain texture, and scroll cue are already
  working. Adding heraldic framing to just the text block is enough.

#### "What This Is" Section
- **Change the `.overline`** ("What This Is") to `.label-flanked`.
- **Add `.rule-heraldic`** above the lead-text paragraph. This grounds the section opening
  with the shield-top bar.

#### "Who It's For" Section (AvatarCards)
- The AvatarCard component changes (Section 2c) handle the cards.
- **Change `.overline`** ("Who It's For") to `.label-flanked`.
- **Replace `.section-divider` above this section** with `.divider-ornament`.
- **Wrap `.cards-footer-text`** in the `crest-corners` utility. The italic summary line
  below the cards deserves a quiet frame.

#### "How It Works" Section
- **Change `.overline`** to `.label-flanked`.
- **Replace `.section-divider` above** with `.divider-ornament`.
- **Add `.rule-heraldic`** above each `.how-title` (Chapters, Guides, The Round, The Compass).
  These four items are the core of CC — giving each a heraldic bar signals their weight.

#### "The Compass" Strip Section
- **Change `.overline`** to `.label-flanked`.
- **Replace `.section-divider` above** with `.divider-ornament`.
- PillarCard component changes (Section 2d) handle the cards.

#### Brian's Quote Section
- **Add `crest-corners`** to `.brian-quote-wrapper`. The founder's words should feel
  framed — like a quote inscribed on a plaque or set into a cornerstone.
- **Replace `.section-divider` above** with `.divider-ornament`.

#### Join CTA Section
- **Add `.rule-heraldic`** above `.join-cta-heading`. Centers the heraldic bar since the
  section is centered.
- **Add `crest-corners`** to `.join-cta-inner`. Frames the entire CTA like a certificate.

```css
/* Center the heraldic rule in centered sections */
.join-cta-inner .rule-heraldic {
  margin-left: auto;
  margin-right: auto;
}
```

---

### 3b. compass.astro (The Compass Page)

#### Compass Hero
- **Change `.overline`** ("The Curriculum") to `.label-flanked`.
- **Add `.rule-heraldic`** above the `.compass-headline`.

#### Pillar Section Headers
- Each of the four pillar sections (Body, Being, Balance, Business) has a
  `.pillar-section-header`. For each:
  - **Add `.rule-heraldic`** above the `.pillar-label` ("Pillar One", etc.)
  - **Replace the `border-top: 1px solid var(--border)`** on `.pillar-section` with a
    `.divider-ornament` placed above each section in the HTML.

#### Stage Blocks
- The `.stage-block` cards (The Ground, The Path, The Walk, The Guide) should receive the
  **shield-accent** treatment: `border-top: 2px solid var(--accent)`, thin amber sides.

```css
.stage-block {
  border: none;
  border-top: 2px solid var(--accent);
  border-left: 1px solid rgba(201, 133, 58, 0.15);
  border-right: 1px solid rgba(201, 133, 58, 0.15);
  border-bottom: 1px solid var(--border);
}
```

#### Questions Cards
- **Add `badge-frame`** treatment to `.questions-card`. The double border elevates these
  from "generic card" to "official document."

```css
.questions-card {
  border: 1px solid var(--accent);
  outline: 1px solid rgba(201, 133, 58, 0.2);
  outline-offset: -6px;
}
```

#### Scripture Blocks
- **Add `crest-corners`** to `.scripture-block`. Scripture is the most authoritative content
  on the page — framing it with corner marks signals "this is set apart."

#### Reading Lists
- No changes. These are functional reference sections — heraldic treatment would over-decorate.

#### Sidebar
- **Add `badge-frame`** to the sidebar `nav` container. The sidebar is a table of contents —
  giving it badge treatment makes it feel like a seal or directory panel.

---

### 3c. about.astro (About Page)

#### About Hero
- **Change `.overline`** to `.label-flanked`.
- **Add `.rule-heraldic`** above the headline.

#### Sidebar Cards
- The sidebar already uses a stacked-card pattern with `gap: 1px`. **Add the badge-frame**
  treatment to the entire `.about-sidebar` container (outer amber border, inner inset).

```css
.about-sidebar {
  border: 1px solid var(--accent);
  outline: 1px solid rgba(201, 133, 58, 0.2);
  outline-offset: -6px;
  background-color: var(--bg-card);
}
```

Remove the existing `border: 1px solid var(--border)` and `background-color: var(--border)`
(which was used for the gap technique).

#### "The Walk" Blockquote
- The sidebar quote "Long. Slow. Together." is already italic Garamond. **Add flanking rules**
  to it (same pattern as the footer tagline).

#### Content Sections
- **Replace `border-bottom: 1px solid var(--border)`** on `.prose-cc h2` with the ornamental
  divider pattern, OR add `.rule-heraldic` above each `<h2>`.
- Recommendation: Add `.rule-heraldic` above each `<section class="about-section">` for
  consistency. The h2 border-bottom can stay since it is a different visual layer (content
  structure vs. heraldic ornament).

---

### 3d. join.astro (Join Page)

#### Join Hero
- **Change `.overline`** to `.label-flanked`.
- **Add `.rule-heraldic`** above the headline.

#### Form Card
- **Apply `badge-frame`** to `.form-card`. The form is where a man commits his name —
  the badge border signals that this is a formal, meaningful action.

```css
.form-card {
  border: 1px solid var(--accent);
  outline: 1px solid rgba(201, 133, 58, 0.2);
  outline-offset: -6px;
}
```

#### Free Callout
- **Add `crest-corners`** to `.free-callout`. "Nothing." is the most powerful word on the
  page — framing it gives it the weight it deserves.

#### Alternative Contact Card
- **Add the shield-accent** border to `.alt-contact`. Thin amber top (not as thick as the
  form card) to create visual hierarchy.

```css
.alt-contact {
  border: none;
  border-top: 2px solid var(--accent);
  border-left: 1px solid rgba(201, 133, 58, 0.2);
  border-right: 1px solid rgba(201, 133, 58, 0.2);
  border-bottom: 1px solid var(--border);
}
```

---

## 4. Summary of All New CSS Classes

| Class | What It Does | Where Used |
|-------|-------------|-----------|
| `.divider-ornament` | Centered diamond between fading lines | Between major page sections |
| `.divider-ornament-mark` | The diamond shape | Inside `.divider-ornament` |
| `.label-flanked` | Eyebrow text with short amber rules | Section labels across all pages |
| `.badge-border` / `.badge-border-inner` | Double-border wrapper (2-element) | Standalone framed blocks |
| `.badge-frame` | Double-border single-element (outline trick) | Cards, sidebars, form |
| `.rule-heraldic` | Short thick amber bar above headings | Above section headings |
| `.crest-corners` | Corner L-marks (top-left, bottom-right) | Quotes, CTAs, hero text |
| `.shield-accent` | Shield-shaped border (heavy top, thin sides) | Pillar cards, stage blocks |

---

## 5. What Does NOT Change

- **Color palette** — all existing CSS variables stay exactly as-is
- **Fonts** — EB Garamond + DM Sans, no additions
- **Typography scale** — clamp values, line heights, font sizes all stay
- **Grain texture** — `.grain-bg` stays, no modifications
- **Buttons** — `.btn-amber` and `.btn-ghost` stay as-is
- **Video hero** — stays, no changes to opacity or behavior
- **Scroll reveal** — `.reveal` animation stays
- **Section containers** — `.section-container`, `.section-pad` stay
- **Prose styles** — `.prose-cc` stays
- **Form field styles** — inputs, labels, error states stay
- **Mobile breakpoints** — all existing responsive behavior preserved
- **No new JS** — all changes are CSS-only

---

## 6. Mobile Considerations

All new utilities are mobile-safe by default:

- **`.divider-ornament`**: Flexbox, scales naturally. The diamond mark is 10px fixed.
- **`.label-flanked`**: Flexbox, the 2rem rules compress gracefully. On very narrow screens
  the text wraps and the rules stay on the first line.
- **`.badge-frame`**: `outline-offset: -6px` works at all sizes. The 6px gap is proportional
  even on small cards.
- **`.rule-heraldic`**: Fixed 3rem width, never extends past the content.
- **`.crest-corners`**: Absolute positioned, 20px marks. On mobile, reduce to 14px:

```css
@media (max-width: 640px) {
  .crest-corners::before,
  .crest-corners::after {
    width: 14px;
    height: 14px;
  }

  .crest-corners {
    padding: 1.75rem;
  }
}
```

- **`.shield-accent`**: Border widths are 1-3px, no mobile issues.

---

## 7. Implementation Order

1. **Add all new utility classes to `global.css`** (Section 1)
2. **Update Header.astro** — box-shadow, letter-spacing (Section 2a)
3. **Update Footer.astro** — box-shadow, tagline flanking, logo opacity (Section 2b)
4. **Update AvatarCard.astro** — badge border, card-rule, number weight (Section 2c)
5. **Update PillarCard.astro** — shield border, corner accent, arrow swap (Section 2d)
6. **Update index.astro** — replace dividers, add flanked labels, crest corners (Section 3a)
7. **Update compass.astro** — pillar headers, stage blocks, question cards (Section 3b)
8. **Update about.astro** — sidebar badge, section rules (Section 3c)
9. **Update join.astro** — form card badge, free callout corners (Section 3d)

---

*This spec turns "clean and atmospheric" into "earned and heraldic" without adding
clutter, dependencies, or breaking the existing mobile experience. Every new element
references real-world crest and badge construction: double borders from embroidered
patches, corner marks from commissioned documents, flanked labels from motto banners,
and shield borders from actual shield silhouettes.*
