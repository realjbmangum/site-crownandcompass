# Crown and Compass — Voice-True Copy Pass

Copywriting + copy-editing de-slop pass across the prototype HTML. Master constraint: `brand/voice.md`
(contemplative "Barnabas," warm, grounded, masculine, NO litotes, no em-dashes, no buzzwords, no
manosphere hype, no exclamation hype, free-forever, never salesy).

**Headline finding:** the copy was already unusually clean. No em-dashes anywhere. No marketing
buzzwords in body copy (only in the out-of-scope image/video prompt worksheets). No exclamation-point
hype. Active voice throughout. The writing is concrete, sensory, and on-voice. That, plus the explicit
instruction to bias toward fewer, higher-quality changes and preserve strong masculine lines, is why
this pass is deliberately light: **3 changes**, plus a reasoned "kept with alternative" section.

---

## Changes made

| File | OLD | NEW | Why (rule / sweep) |
|---|---|---|---|
| home.html | Hero subhead: "Online, worldwide, and **not for the comfortable**." | "Online, worldwide, and **for men who mean it**." | Golden Rule (negation — states who it's NOT for) + voice.md "avoid aggressive confrontation as default." "Not for the comfortable" has a faint gatekeeping/tough-guy edge; the positive keeps the selectivity and masculine seriousness without the confrontation. High-visibility hero line, so worth the fix. |
| start-a-chapter.html | "Brian will walk with you through the first meeting and talk it through with you after. **You will not be starting alone.**" | "…talk it through with you after. **You start with a brother beside you.**" | Golden Rule, clearest violation on the site. "You will not be starting alone" is nearly verbatim the banned "you're not alone" litotes, aimed at the reader as reassurance, and it stood as a bare negation (the prior sentence already carries the point). Recast to the positive truth (companionship), on the walking-alongside motif. |
| directory.html | Close: "**A man does not beat this alone.** Find a chapter of men who will check in on you…" | "**A man beats this with other men beside him.** Find a chapter…" | Golden Rule. Here the "…does not X alone" negation stood as the claim with no positive completion (what follows is a CTA), and it addresses a vulnerable reader (a man trying to quit drinking), so it functions exactly like the banned reassurance-litotes. Easy strong positive available. |

**The 3 worst slop offenders fixed** = the 3 above. All are litotes/negation-family lines, which is
the master voice guide's #1 rule ("The Golden Rule: NO LITOTES"). The site had no other slop of
comparable severity.

---

## Kept, with alternative (deliberate judgment calls)

These are lines that brush a rule but are strong, concrete, and masculine. Per the "fewer, higher-quality
changes / don't soften into mush" instruction, I left them and offer alternatives instead.

### 1. The "a man does not grow/stand/go the distance alone" proverb-negations — KEPT
- **about.html:** "A man does not grow in isolation. He grows when other men are watching, asking, and walking alongside."
- **app-dashboard.html:** "…a man cannot go the distance alone, and real friendship is built on being known, not on being impressive."
- **app-reading.html:** "Both passages assume a man was never meant to stand alone." / (prayer) "Father, you did not make me to carry my life alone."
- **Why kept:** These differ from the litotes I fixed. In each, the negation is a *substantive theological
  claim* (isolation genuinely fails) and is **immediately completed by its positive** ("He grows when…",
  "real friendship is built on being known"). That negative→positive antithesis is a recognized rhetorical
  form and reads as intentional voice, not weak hedging. This "you can't do this alone" idea is also the
  brotherhood's core message — scrubbing every instance would flatten a deliberate theme into mush.
- **Rule I drew:** fix reassurance-negations that stand as the bare claim; keep negation→positive
  antithesis and substantive proverbs. (This is what separated the 3 fixes from these keeps.)
- **Alternative if Brian wants them positive:** about → "A man grows when other men are watching, asking,
  and walking alongside." (drop the negated first half).

### 2. about.html lead — "No fees. No ranks. No performance." — KEPT
- Punchy negation-anaphora defining the thing by what it refuses. Not the weak "not un-" litotes; it's
  assertive and masculine. **Alt:** "Free. Flat. Honest." (weaker — loses the specificity). Left as is.

### 3. "What we are / what we are not" framings — KEPT
- about.html ("What we are, and what we are not"), app-community.html ("What it will be / will not be"),
  faq answers. voice.md bans the *litotes* "it's not about X, it's about Y," but a two-column define-by-
  contrast section is legitimate structure (and lands strong here). The "what we are" side always states
  the positive first. Left intact.

### 4. app-community.html — "A man is not a number here." — KEPT
- A dignity-via-contrast values line, punchy and resolute. Not about aloneness; the negation is the point
  (rejecting social-media dehumanization). **Alt:** "Here a man is a name." Left the original for its bite.

### 5. blog.html card — "Your wife does not feel loved" / "Most men think providing is enough…" — KEPT
- "Most men…" is on voice.md's "never be you" list ("Most men are failing at…"), but this is a *blog
  teaser* engineered to provoke a click, and it sets up a belief to correct, not a shaming of the reader.
  Blog headlines get more provocation latitude. **Alt:** "A lot of men think providing is enough." Left as is.

### 6. home.html testimonial — "…the first one that **actually** changed how I think…" — KEPT
- "actually" is a copy-editing filler word, but this is spoken-voice testimony where "actually" carries
  contrastive weight (vs. the groups that didn't change him). Over-editing would make it sound less like a
  real man talking. Left as is. (Note: attribution is the generic placeholder "A Crown & Compass Member" —
  a real, attributed quote will read stronger when available. Did not invent one.)

---

## Pages found clean (no changes needed)

how-it-works.html, about.html, join.html, blog.html, blog-post.html, reading-list.html,
reading-guide.html, resources.html, faq.html, find-a-chapter.html, newsletter-confirm.html,
app-signin.html, app-dashboard.html, app-reading.html, app-chapter.html, app-community.html,
app-vote.html, app-account.html, app-admin.html.

The app microcopy in particular is excellent and deeply on-voice ("A flag means make a call, not send a
nudge." / "A man who goes quiet is usually the one who needs the chapter most." / "Say it plainly. The
men will carry it with you." / "Numbers to steer by, not to brag about.").

---

## Flag for Brian (NOT a copy issue — a content/fact inconsistency, left unchanged)

**The "now reading" book conflicts across pages.**
- `how-it-works.html`, `faq.html`, `app-*` all say the current book is **"Disciplines of a Godly Man" (R. Kent Hughes)**.
- `reading-list.html` "Now Reading" says **"Maximized Manhood" (Edwin Louis Cole)** (with its own description + Amazon link).

I did not change this — I can't tell which is correct, and guessing would invent a fact. Pick one and
align the other. (Most of the site + the full reading guide point to *Disciplines of a Godly Man*.)

---

## Verification
- Only text between tags was edited. proto.css, `<style>`/`<script>` blocks, tags, classes, hrefs, and
  HTML entities untouched.
- Tag counts unchanged: home.html 321, start-a-chapter.html 186, directory.html 412.
- All edited pages + spot-checked pages return HTTP 200 on the local server. No em-dashes reintroduced.
