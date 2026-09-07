---
entity:   crownandcompass
surface:  brand-standards
derived:  2026-09-06
source:   public/proto.css, verified against thecrownandcompass.org
---

# Crown and Compass: Brand Standards

Derived from the live stylesheet and verified against production. Where this document
and the shipped site ever disagree, **the site is right and this file is the bug.**
See Provenance for what changed and why.

---

## 0. Read this before you write any CSS

The site was rebuilt from a dark palette to a light one. The stylesheet kept the old
variable names as **compatibility aliases** so older screens would not break:

```css
--bg-base: var(--bone);      /* was #0f1117 near-black, now #F1EBDC bone */
--text-primary: var(--ink);  /* was #f0ebe2 cream,      now #16130D ink  */
--accent: var(--ember);      /* was #c9853a amber,      now #C0552A ember */
```

**This is the trap.** Every old variable name still resolves, so nothing errors and
nothing looks broken in the editor. It simply produces the opposite result. A near-black
card lands on a bone page, and cream text lands on cream.

**Use the real names.** `--ink`, `--bone`, `--charcoal`, `--ember`. Treat every alias in
the "compat" block as deprecated. If you find a hex code hardcoded anywhere, that is a
bug regardless of which palette it belongs to.

---

## 1. Brand essence

Unchanged, and it was never the problem.

**Who we are:** A peer-led Christian men's community built around reading, honest
conversation, and The Walk.

**Positioning:** Not performance. Not a platform. A table where men sit as equals.

**Tone:** Contemplative. Honest. Quietly confident. Like a letter from an older brother,
not a TED talk.

**Reference authors:** C.S. Lewis, Dallas Willard, Thomas à Kempis. Literary, unhurried,
weighty.

---

## 2. Colour

The ground is paper, not night. Warm off-white with dark brown-black type, and a single
burnt-orange accent.

| Role | Variable | Hex | Notes |
|---|---|---|---|
| Primary text, and the mark | `--ink` | `#16130D` | Brown-black, not pure black |
| Primary ground | `--bone` | `#F1EBDC` | The paper |
| Second ground | `--bone-2` | `#E7DEC9` | Alternating sections |
| Depth | `--charcoal` | `#2C2B29` | Blocks and quotes |
| Accent | `--ember` | `#C0552A` | **Rules, borders, large display only** |
| Accent, small text on light | `--ember-dark` | `#A5451E` | AA-safe |
| Accent, button hover on light | `--ember-darker` | `#8A3A16` | |
| Accent, small text on dark | `--ember-light` | `#E0764A` | AA-safe on ink or charcoal |
| Muted text | `--muted` | `#5b5445` | On bone |
| Muted, both grounds | `--muted-2` | `#615a4b` | AA on bone and bone-2 |
| Body text on dark | `--on-dark` | `#cfc7b3` | |

**The accessibility rule is load-bearing and easy to get wrong.** `--ember` fails AA at
small sizes. It exists for hairlines, borders and large display type. Small coloured text
uses `--ember-dark` on a light ground and `--ember-light` on a dark one. There are four
ember variables precisely because one is not enough, so pick by context rather than by
which looks closest.

Hairlines are `--line`, `--line-2` and `--line-strong` on bone, `--line-dark` on dark.

**Atmosphere:** warm paper with a single ember. Old book, not firelit room.

---

## 3. Typography

| Role | Variable | Family |
|---|---|---|
| Display and headings | `--display` | **Zilla Slab**, Georgia, serif |
| Body | `--body` | **Spectral**, Georgia, serif |
| Labels and kickers | `--mono` | **IBM Plex Mono**, ui-monospace |

Two serifs and a mono. The display face is a slab, which is the deliberate change from
the old system: it carries weight at large sizes without the delicacy that made the
previous headline face feel decorative.

**Kickers and all-caps labels are mono**, not sans: 12px, weight 500, letter-spacing
`.3em`, uppercase, in `--ember-dark`. This is the most distinctive typographic move on
the site and the easiest to get wrong by reaching for a sans-serif.

Body is 17px at 1.7 line height. Headings run at `line-height: 1.04` with
`letter-spacing: -.01em` and `text-wrap: balance`.

**Never** stack more than these three families on a page.

---

## 4. Spacing

A 4pt scale, named by relationship rather than by value, so the names survive a
re-scaling: `--space-2xs` 4px through `--space-4xl` 96px. Use the token, never a literal.

---

## 5. Logo

An inline SVG compass rose in `--ink`, not amber. No external file, no white background.

**Source of truth:** `src/components/Header.astro`. The inline SVG is authoritative.

- Circle perimeter, four cardinal arrows with north dominant, inner ring at low opacity,
  centre dot
- All paths use `currentColor`, so the mark inherits whatever colour its container sets
- Lockup is mark at 28×28, then the wordmark in `--display`, with a 0.625rem gap

**If a real vector logo is ever commissioned:** a crown integrated into a compass rose,
earned rather than decorative. Clean and geometric, Filson rather than Harry Potter. Mark
on transparent, working on both bone and ink grounds. Horizontal lockup as primary,
mark-only for avatars and favicons, stacked for print. Clear space of one mark height,
minimum 24px, delivered as SVG plus transparent PNG at 1x/2x/3x.

---

## 6. Graphic language

**Grain.** CSS-only SVG turbulence via `.grain-bg`, opacity 0.035. Analog warmth,
referencing paper and leather.

**Ember rule.** A 3px left border in `--ember` on scripture blocks and pull quotes. The
visual anchor for weight.

**Compass motif.** The mark doubles as a divider and a low-opacity watermark. Use it
sparingly; it stops meaning anything if it appears on every element.

**Ordinals.** Large `--display` numerals at low opacity, for rhythm without photography.

**Imagery is governed by `design-grammar.md`, not by this file.** That document is the
one the routines actually read, and it holds the photographic register, the sentence
test, and the reject list. This file used to carry its own set of image prompts written
for the old dark palette, and they contradicted it. They have been removed rather than
updated, because two documents giving image direction is how the contradiction happened
in the first place.

---

## 7. Voice

Governed by `brand/voice.md` in this repo. Do not restate it here.

The two rules that get broken most: **no litotes**, and **no throat-clearing**. Both are
stated with their fixes in the voice file.

---

## 8. Do and do not

**Do**
- Let negative space breathe
- Use ember sparingly. It works because everything around it is quiet, not because it is
  surrounded by dark
- Trust the typography. A good slab headline needs no decoration
- Write to one man, not to an audience
- Keep the site fast

**Do not**
- Hardcode a hex. Every colour is a token
- Reach for a compat alias. They resolve to the opposite of what their names suggest
- Add icon libraries
- Use gradients
- Add animation beyond the scroll reveal and the scroll cue
- Stack more than the three families above

---

## 9. Provenance

**Derived 6 September 2026** from `public/proto.css`, verified against the live stylesheet
served by thecrownandcompass.org. The repo and production agree.

**What this replaces.** The previous version was dated 21 February 2026 and carried the
line "keep this file current". It described a dark design system that no longer exists:
a `#0f1117` near-black ground, `#f0ebe2` cream text, EB Garamond and DM Sans, and a
`#c9853a` amber accent. Every one of those values was wrong by the time anyone read it.

**Why it was worse than simply stale.** The rebuild kept the old variable names as compat
aliases, so a reader following the old document would write `--bg-base` and `--text-primary`
and get correct-looking code that rendered inverted. A document that is obviously broken
gets fixed. This one looked right.

**What was removed rather than corrected.** Section 7 of the old file held five AI image
prompts, all written for the dark palette ("near-black and deep amber", "dark moody
lighting"). They contradicted `design-grammar.md`, which governs imagery and which the
content routines actually read. Two files giving image direction is the failure, so the
prompts are gone rather than rewritten.

**Re-derive this file whenever `proto.css` changes its palette or type block**, and date
it when you do. A standards document with no date beside it is not a fact.
