#!/usr/bin/env node
/**
 * gen-guide-page.mjs — regenerate a PUBLIC per-book reading-guide page from the
 * app's PUBLISHED field guide in the shared Cloudflare D1 `crownandcompass`.
 *
 * Usage:
 *   node scripts/gen-guide-page.mjs <slug> [--out <path>]
 *
 * What it does:
 *   1. Pulls the book + its published guide from D1 (via `wrangler d1 execute
 *      --remote --json`). The site repo shares the same D1 as the member app.
 *   2. DETERMINISTICALLY distills the 6-week guide down to the tight public
 *      5-block format (this is a REDUCTION of real content — it never invents
 *      or generates new prose). See DISTILLATION MAP below.
 *   3. Writes public/guide-<slug>.html, cloning the head boilerplate, inline
 *      <style>, header and footer of the existing template pages.
 *
 * Re-running is idempotent: same DB row -> byte-identical file.
 *
 * ------------------------------------------------------------------ DISTILLATION
 *   "What it is about"  <- content.overview (paragraphs split on blank lines).
 *   "The big idea"      <- the first sentence of the overview (its most
 *                          thesis-like sentence). If the overview is a single
 *                          sentence, it is reused verbatim. Nothing synthesized.
 *   "Talk it through"   <- the FIRST question of each of the 6 weeks, in order,
 *                          then a 7th: the SECOND question of the "richest" week
 *                          (the week with the most total content). De-duped, then
 *                          trimmed/back-filled to exactly 7 real questions.
 *   "Read the Word"     <- every week's verses flattened in order, de-duped
 *                          (case-insensitive), first 5. Each links to the ESV on
 *                          BibleGateway by its human-readable ref (URL-encoded).
 *                          NOTE: the template's data-ref attribute is API.Bible-
 *                          specific; the app stores human-readable refs only, so
 *                          data-ref is OMITTED here (known simplification).
 *   "One practice"      <- content.weeks[5].practice (week 6); falls back to
 *                          week 1's practice if week 6's is empty.
 *   Header slots        <- books.title / author / cover_url (as the cover
 *                          background; no-cover variant if null) / pillar_tags
 *                          (-> .tag pills) / buy_url (-> "Get the book").
 *   SEO <head>          <- <title>, <meta description> (from overview),
 *                          canonical + Book JSON-LD, all for this slug.
 * ------------------------------------------------------------------------------
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');
const PUBLIC_DIR = join(REPO, 'public');
const CANONICAL_ORIGIN = 'https://thecrownandcompass.org';

// ----------------------------------------------------------------- small helpers
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// For href/attribute values: same as escHtml (covers & " ' < >).
const escAttr = escHtml;

function firstSentence(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  // First run ending in . ! or ? followed by whitespace (or end of string).
  const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
}

function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function truncateAtWord(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, '') + '…';
}

// Score a week by total character content -> "richest week" (deterministic).
function weekRichness(w) {
  const parts = [
    w.summary,
    w.commentary,
    w.practice,
    ...(Array.isArray(w.questions) ? w.questions : []),
    ...(Array.isArray(w.verses) ? w.verses : []),
    ...(Array.isArray(w.resources) ? w.resources : []),
  ];
  return parts.reduce((n, s) => n + String(s || '').length, 0);
}

// Detect the current proto.css cache-buster from an existing page so generated
// pages stay in sync with the ?v= rule (CLAUDE.md: any proto.css change bumps it).
function detectProtoVersion() {
  const probes = ['guide-counterfeit-gods.html', 'reading-list.html'];
  for (const name of probes) {
    const p = join(PUBLIC_DIR, name);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/proto\.css\?v=(\d+)/);
    if (m) return m[1];
  }
  return '10';
}

// ----------------------------------------------------------------- fetch from D1
function fetchBook(slug) {
  const sql =
    'SELECT b.slug,b.title,b.author,b.cover_url,b.buy_url,b.pillar_tags,bg.content_json ' +
    'FROM books b JOIN book_guides bg ON bg.book_id=b.id ' +
    `WHERE b.slug='${slug.replace(/'/g, "''")}' AND bg.status='published'`;
  let out;
  try {
    out = execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', 'crownandcompass', '--remote', '--json', '--command', sql],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString();
    throw new Error(`wrangler d1 execute failed:\n${msg}`);
  }
  // wrangler prints a JSON array; find it defensively (skip any leading noise).
  const start = out.indexOf('[');
  if (start < 0) throw new Error(`Unexpected wrangler output (no JSON array):\n${out}`);
  const parsed = JSON.parse(out.slice(start));
  const rows = parsed?.[0]?.results ?? [];
  return rows[0] || null;
}

// ------------------------------------------------------------------- distillation
function distill(row) {
  const content = JSON.parse(row.content_json);
  const weeks = Array.isArray(content.weeks) ? content.weeks : [];
  const overview = String(content.overview || '').trim();

  // The big idea: first sentence of the overview.
  const bigIdea = firstSentence(overview) || overview;

  // Talk it through: first question of each week, then the 2nd question of the
  // richest week; de-dupe; back-fill from remaining questions; trim to exactly 7.
  const norm = (s) => String(s || '').trim().toLowerCase();
  const questions = [];
  const seenQ = new Set();
  const pushQ = (q) => {
    const t = String(q || '').trim();
    if (!t || seenQ.has(norm(t))) return false;
    seenQ.add(norm(t));
    questions.push(t);
    return true;
  };
  weeks.forEach((w) => pushQ((w.questions || [])[0]));

  let richestIdx = 0;
  let richestScore = -1;
  weeks.forEach((w, i) => {
    const s = weekRichness(w);
    if (s > richestScore) {
      richestScore = s;
      richestIdx = i;
    }
  });
  pushQ((weeks[richestIdx]?.questions || [])[1]);

  // Back-fill toward 7 real questions from any remaining week questions, in order.
  if (questions.length < 7) {
    for (const w of weeks) {
      for (const q of w.questions || []) {
        if (questions.length >= 7) break;
        pushQ(q);
      }
      if (questions.length >= 7) break;
    }
  }
  const talkQuestions = questions.slice(0, 7);

  // Read the Word: flatten verses in order, de-dupe, first 5.
  const verses = [];
  const seenV = new Set();
  weeks.forEach((w) => {
    (w.verses || []).forEach((v) => {
      const t = String(v || '').trim();
      if (!t || seenV.has(norm(t))) return;
      seenV.add(norm(t));
      verses.push(t);
    });
  });
  const readVerses = verses.slice(0, 5);

  // One practice: week 6, fall back to week 1.
  const practice =
    String(weeks[5]?.practice || '').trim() || String(weeks[0]?.practice || '').trim();

  let pillars = [];
  try {
    const p = JSON.parse(row.pillar_tags || '[]');
    if (Array.isArray(p)) pillars = p.map((x) => String(x)).filter(Boolean);
  } catch {
    /* leave empty */
  }

  return {
    slug: row.slug,
    title: row.title || '',
    author: row.author || '',
    coverUrl: row.cover_url || '',
    buyUrl: row.buy_url || '',
    pillars,
    overviewParas: paragraphs(overview),
    metaDescription: truncateAtWord(overview, 155),
    bigIdea,
    talkQuestions,
    readVerses,
    practice,
  };
}

// --------------------------------------------------------------------- rendering
function bibleGatewayHref(ref) {
  const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=ESV`;
  return escAttr(url); // escapes the & to &amp; for the HTML attribute
}

function renderPage(d, protoVersion) {
  const canonical = `${CANONICAL_ORIGIN}/guide-${d.slug}.html`;
  const pageTitle = `${d.title} Discussion Questions · Crown and Compass`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: d.title,
    author: { '@type': 'Person', name: d.author },
    description: d.metaDescription,
    url: canonical,
    publisher: {
      '@type': 'Organization',
      name: 'Crown and Compass',
      url: CANONICAL_ORIGIN,
    },
  };

  const coverClass = d.coverUrl ? 'cover has-cover' : 'cover';
  const coverStyle = d.coverUrl
    ? ` style="background-image:url('${escAttr(d.coverUrl)}');"`
    : '';

  const tagPills = d.pillars
    .map((t) => `\n            <span class="tag">${escHtml(t)}</span>`)
    .join('');

  const buyBtn = d.buyUrl
    ? `\n          <a href="${escAttr(d.buyUrl)}" target="_blank" rel="noopener" class="btn btn-ember">Get the book</a>`
    : '';

  const overviewHtml = (d.overviewParas.length ? d.overviewParas : [''])
    .map((p) => `          <p>${escHtml(p)}</p>`)
    .join('\n');

  const questionsHtml = d.talkQuestions
    .map((q) => `            <li>${escHtml(q)}</li>`)
    .join('\n');

  const versesHtml = d.readVerses
    .map(
      (v) =>
        `            <a class="verse" href="${bibleGatewayHref(v)}" target="_blank" rel="noopener">${escHtml(v)}</a>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(pageTitle)}</title>
<meta name="description" content="${escAttr(d.metaDescription)}" />
<link rel="canonical" href="${escAttr(canonical)}" />
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
<link rel="stylesheet" href="proto.css?v=${protoVersion}" />
<style>
  .backlink{display:inline-block;font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted-2);margin-bottom:24px;}
  .backlink:hover{color:var(--ember-dark);}
  .gh{display:grid;grid-template-columns:190px 1fr;gap:40px;align-items:center;}
  .gh .cover{position:relative;aspect-ratio:2/3;max-width:190px;background:var(--ink);color:var(--bone);border:1px solid var(--line);
    display:flex;flex-direction:column;justify-content:flex-end;padding:20px 16px 18px 22px;overflow:hidden;}
  .gh .by{font-family:var(--mono);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-2);margin:0 0 16px;}
  .gh .meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:22px;}
  @media(max-width:640px){.gh{grid-template-columns:1fr;gap:24px;}.gh .cover{max-width:150px;}}

  .gsec{margin-top:40px;}
  .gsec .prose p{max-width:66ch;}
  .bigidea{background:var(--ink);color:var(--bone);padding:30px 34px;margin-top:14px;}
  .bigidea .bk{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--ember-light);}
  .bigidea p{font-family:var(--display);font-weight:500;font-size:clamp(1.3rem,2.4vw,1.6rem);line-height:1.35;color:var(--bone);margin:12px 0 0;max-width:60ch;}

  .prompts{background:var(--bone);border:1px solid var(--line);padding:30px 32px;margin-top:16px;}
  .prompts .pk{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--ember-dark);}
  .prompts ol{margin:16px 0 0;padding-left:22px;}
  .prompts li{font-family:var(--body);font-size:18px;line-height:1.55;color:var(--muted);margin-bottom:15px;}
  .prompts li:last-child{margin-bottom:0;}

  .reading{background:var(--bone-2);border:1px solid var(--line);padding:24px 28px;margin-top:16px;}
  .reading .rk{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--ember-dark);}
  .verses{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:14px;}
  .verse{font-family:var(--mono);font-size:14px;letter-spacing:.02em;color:var(--ember-dark);border-bottom:1px solid rgba(192,85,42,.4);padding-bottom:1px;}
  .verse:hover{color:var(--ember-dark);border-color:var(--ember-dark);}
  .reading .note{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted-2);margin:16px 0 0;}

  .application{background:var(--charcoal);color:var(--bone);padding:28px 32px;margin-top:16px;}
  .application .ak{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--ember-light);}
  .application p{font-family:var(--body);font-size:19px;line-height:1.6;color:var(--bone);margin:12px 0 0;max-width:62ch;}
</style>
</head>
<body>

<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/"><img src="assets/cc-white.png" alt="" style="height:46px;width:auto;" /><span class="name">Crown &amp; Compass</span></a>
    <nav class="nav">
      <a href="about.html">About</a><a href="how-it-works.html">How It Works</a><a href="reading-list.html" class="active">Reading</a><a href="blog.html">Blog</a>
      <div class="nav-more"><button class="more-btn" type="button" aria-haspopup="true">More <span aria-hidden="true">&#9662;</span></button>
        <div class="nav-menu"><a href="resources.html">Resources</a><a href="find-a-chapter.html">Find a Chapter</a><a href="start-a-chapter.html">Start a Chapter</a><a href="faq.html">FAQ</a></div></div>
      <a class="signin" href="https://app.thecrownandcompass.org">Sign in</a><a class="btn-nav" href="join.html">Join</a>
    </nav>
  </div>
</header>

<main>
  <!-- GUIDE HEADER -->
  <section class="section bone" style="padding-bottom:48px;">
    <div class="wrap">
      <a class="backlink" href="reading-list.html">&larr; Reading</a>
      <div class="gh">
        <div class="${coverClass}"${coverStyle}></div>
        <div>
          <p class="kicker">Reading Guide</p>
          <h1 style="font-size:clamp(1.9rem,4vw,2.8rem);">${escHtml(d.title)}</h1>
          <p class="by">${escHtml(d.author)}</p>
          <div class="meta">
            <span class="pill">A simple guide</span>${tagPills}
          </div>${buyBtn}
        </div>
      </div>
    </div>
  </section>

  <!-- BODY -->
  <section class="section bone2" style="padding-top:52px;">
    <div class="wrap narrow">

      <div class="gsec">
        <p class="kicker kicker-rule">What it is about</p>
        <div class="prose">
${overviewHtml}
        </div>
      </div>

      <div class="gsec">
        <div class="bigidea">
          <p class="bk">The big idea</p>
          <p>${escHtml(d.bigIdea)}</p>
        </div>
      </div>

      <div class="gsec">
        <div class="prompts">
          <p class="pk">Talk it through</p>
          <ol>
${questionsHtml}
          </ol>
        </div>
      </div>

      <div class="gsec">
        <div class="reading">
          <p class="rk">Read the Word</p>
          <div class="verses">
${versesHtml}
          </div>
          <p class="note">Verses open in the ESV on BibleGateway</p>
        </div>
      </div>

      <div class="gsec">
        <div class="application">
          <p class="ak">One practice</p>
          <p>${escHtml(d.practice)}</p>
        </div>
      </div>

    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="wrap ft">
    <a class="brand" href="/" style="color:var(--bone);"><img src="assets/cc-white.png" alt="" style="height:40px;width:auto;" /><span class="name">Crown &amp; Compass</span></a>
    <div class="ft-links"><a href="about.html">About</a><a href="how-it-works.html">How It Works</a><a href="reading-list.html">Reading</a><a href="blog.html">Blog</a><a href="resources.html">Resources</a><a href="find-a-chapter.html">Find a Chapter</a><a href="start-a-chapter.html">Start a Chapter</a><a href="faq.html">FAQ</a><a href="contact.html">Contact</a></div>
  </div>
</footer>
<script src="/site.js" defer></script>
</body>
</html>
`;
}

// -------------------------------------------------------------------------- main
function main() {
  const args = process.argv.slice(2);
  let slug = null;
  let outOverride = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') outOverride = args[++i];
    else if (!slug) slug = args[i];
  }
  if (!slug) {
    console.error('Usage: node scripts/gen-guide-page.mjs <slug> [--out <path>]');
    process.exit(2);
  }

  const row = fetchBook(slug);
  if (!row) {
    console.error(
      `No PUBLISHED guide found for slug "${slug}" in D1 (books JOIN book_guides, status='published'). No page written.`
    );
    process.exit(1);
  }

  const d = distill(row);
  const protoVersion = detectProtoVersion();
  const html = renderPage(d, protoVersion);

  const outPath = outOverride
    ? resolve(process.cwd(), outOverride)
    : join(PUBLIC_DIR, `guide-${d.slug}.html`);
  writeFileSync(outPath, html, 'utf8');

  console.log(`Wrote ${outPath}`);
  console.log(`  title:     ${d.title} — ${d.author}`);
  console.log(`  cover:     ${d.coverUrl ? d.coverUrl : '(none — no-cover variant)'}`);
  console.log(`  pillars:   ${d.pillars.length ? d.pillars.join(', ') : '(none)'}`);
  console.log(`  questions: ${d.talkQuestions.length}`);
  console.log(`  verses:    ${d.readVerses.length}`);
  console.log(`  proto.css: ?v=${protoVersion}`);
}

main();
