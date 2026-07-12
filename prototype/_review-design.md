# Crown and Compass prototype — impeccable design pass

Polish within the locked brand (Ink / Bone / Charcoal / Ember, Zilla Slab / Spectral / IBM Plex Mono, square corners, hairline rules). Palette and type were not touched. This is polish, not a redesign.

Verified on the local server (home, app-dashboard, blog) at 1280px and 390px after edits. No layout regressions.

---

## A. Changed in proto.css (done)

Each change is tied to an impeccable principle.

| # | Change | What / why (principle) |
|---|--------|------------------------|
| 1 | **Fluid section rhythm** — `.section` `104px` to `clamp(64px,9vw,108px)`; `.section.tight` `64px` to `clamp(44px,6vw,64px)` | *Rhythm through varied spacing; fluid clamp that breathes.* Desktop unchanged (108px); mobile drops to 64px, killing the dead vertical space that made phone scroll feel padded. |
| 2 | **Fluid page gutter** — `.wrap` padding `0 40px` to `0 clamp(20px,5vw,40px)` | *Adapt the interface, do not just shrink it.* At 390px the gutter is 20px, giving content ~350px instead of 310px. Desktop still 40px. |
| 3 | **Fluid `.sec-head` margin** — `56px` to `clamp(32px,5vw,56px)` | *Vary spacing for hierarchy.* Section headers no longer float far from their content on small screens. |
| 4 | **Reduced-motion block added** (was missing in proto.css) | *Honor `prefers-reduced-motion`.* Disables smooth-scroll and collapses transitions/animations globally. Accessibility gate. |
| 5 | **Card interaction refined** — removed dead `transform .2s` transition (no transform hover existed); interactive cards now darken their hairline (`--line` to new `--line-strong`) plus the existing bone to bone-2 shift | *No generic drop shadows; intentional decorative elements.* Gives clickable cards a real "engage" without the AI-tell shadow, staying in the square/hairline language. |
| 6 | **Button press + focus** — `.btn:active` `translateY(1px)`; `.btn:focus-visible` `outline-offset:3px` | *Motion for state; every interactive surface feels responsive.* Tactile press using transform only (no layout props). |
| 7 | **Prose inline-link affordance** — `.prose a` underline, 1px, 3px offset, ember-tinted, darken on hover | *Interactions feel intentional.* Long-form links had no underline, so they were invisible as links inside reading content. |
| 8 | **Light-on-dark leading** — `.charcoal .sec-sub, .ink .sec-sub` line-height 1.65 to 1.72 | *Light text on dark reads lighter; add 0.05-0.1 leading.* |
| 9 | **Anchor scroll-margin** — `scroll-margin-top:96px` on sections/headings/`[id]` | *Usability.* In-page anchor jumps no longer hide their target under the 76px sticky header (matters on reading-guide TOC jumps). |
| 10 | **Toned the one heavy shadow** — nav dropdown `0 24px 60px /.5` to `0 18px 44px /.42` | *If you can clearly see the shadow, it is too strong.* Still separates the menu; less heavy. |
| 11 | **Added spacing tokens + `--line-strong`** — 4pt semantic scale (`--space-2xs` ... `--space-4xl`) and an engaged-hairline token | *4pt scale, named by relationship.* Available for the real Astro build; `--line-strong` is used by the card hover. |

**Deliberately left alone (defensible within the brand):**
- The firelit hero radial `.glow` (16% ember) and emblem vignette — this IS the "dark, firelit" aesthetic, purposeful atmosphere, not decoration.
- The `.grid` 1px-gap hairline-separator technique — an elegant, on-brand way to divide cells; kept.
- Muted-brown prose body color — an intentional editorial softness with ink used for emphasis (`.prose strong`), not a contrast bug.
- `.center` is applied per-section in the HTML, not baked into shared component classes, so there is no over-centering to remove in proto.css itself.
- Uniform `.card` padding (38/32) — it is one consistent card treatment, not a rhythm problem; section-level clamp supplies the rhythm.

---

## B. Needs an HTML / per-page change (for parent to apply)

All of these live in per-page inline `<style>` blocks, which are outside the CSS-only write scope. Priority order.

### P0 — BAN 1 side-stripe borders (the top AI-slop tell; `border-left` > 1px)

**1. `app-dashboard.html:28`** — `.feature { border-left: 3px solid var(--ember); }`
Distinguish the primary card by a full ember-tinted hairline and more space, not a stripe:
```css
.feature { border: 1px solid rgba(192,85,42,.32); padding: 40px 36px; }
```

**2. `app-reading.html:36`** — `.prayer { ...; border-left: 3px solid var(--ember); ... }`
It already has a full `1px` ember border plus a `.06` ember background tint, so the stripe is redundant. Just delete the line:
```css
/* remove: */  border-left: 3px solid var(--ember);
```

**3. `how-it-works.html:28`** — `.firsttime{ ...; border-left:3px solid var(--ember); ... }`
Drop the stripe; carry emphasis with a full engaged hairline:
```css
.firsttime{ background:var(--bone); border:1px solid var(--line-strong); padding:36px 36px; }
```

**4. `reading-guide.html:37`** — `.reading{ ...; border-left:3px solid var(--ember); ... }`
Differentiate with a bone-2 fill instead of the stripe:
```css
.reading{ background:var(--bone-2); border:1px solid var(--line); padding:24px 28px; margin:28px 0; }
```

**5. `blog-post.html:19`** — `.scripture{ ...; border-left:2px solid var(--ember); ... }`
Already bone-2 filled; swap the stripe for a full hairline:
```css
.scripture{ font-family:var(--body); font-style:italic; font-size:19px; line-height:1.7; color:var(--ink); background:var(--bone-2); border:1px solid var(--line); padding:22px 26px; margin:2.25rem 0; max-width:66ch; }
```

**6. `blog-post.html:18`** — `.pullquote{ ...; border-left:2px solid var(--ember); ... }`
Replace the stripe with a short top ember rule — reads as intentional editorial punctuation:
```css
.pullquote{ font-family:var(--display); font-weight:600; font-size:clamp(22px,3vw,29px); line-height:1.3; color:var(--ink); padding:0; margin:2.5rem 0; max-width:62ch; }
.pullquote::before{ content:""; display:block; width:48px; height:2px; background:var(--ember); margin:0 0 20px; }
```

**7. `video-prompts.html:33`** — `.tips{ border-left:3px solid var(--ember); ... }` (worksheet page, lowest of the P0 set)
Use a top hairline instead:
```css
.tips{ border-top:1px solid var(--line); padding:18px 0 0; margin:26px 0 0; }
```

### P1 — brand-language consistency

**8. `app-dashboard.html:47`** — `.roster .av { ...; border-radius:50%; ... }`
The locked brand is square corners / heraldic. Circular avatars break that language. Make them square monogram tiles (they already have the 1px hairline and mono type):
```css
/* remove: */  border-radius:50%;
```

**9. `home.html:26`** — `.hero .btn-ghost{ background-color:rgba(16,13,9,.42); backdrop-filter:blur(1.5px); -webkit-backdrop-filter:blur(1.5px); }`
Glassmorphism blur is an explicit anti-reference. The 42% ink fill already gives the ghost button legibility over the photo, so drop the blur:
```css
.hero .btn-ghost{ background-color:rgba(16,13,9,.42); }
```

### P2 — watch-items (no change required, note for the build)

- **Repeated 3-column card grids** (blog, how-it-works, resources, directory): fine where each card carries a distinct image or number (blog, home). If any grid is pure icon/heading/text repeated (check `resources.html`, `faq.html`), vary one row — a wider lead card or a different column count — so it does not read as a templated grid.
- **Header brand name wraps to two lines under ~400px** (`.brand .name`, proto.css). It reads acceptably in testing, so I left it rather than force `nowrap` (which risks colliding with the Sign in / Join buttons). If the real build wants it on one line, drop the brand name font a step at `max-width:400px` rather than using `white-space:nowrap`.

---

*Review screenshots saved in this prototype folder: `before-home.png` / `after-home.png`, `after-home-mobile.png`, `before-dashboard.png` / `after-dashboard.png`, `after-blog.png`.*
