# Barnabas weekly schedule

Status: DRAFT. None of these routines exist yet. They are created only after Brian approves.

## Every Friday

1. **About 2:00 PM ET: David builds the weekly feed** at `/workspace/team-build/crownandcompass/weekly-feed/YYYY-MM-DD.md`. Facts only: where the current book and six-week cycle stand, merged site PRs, public Christian news worth a line (with links), and anything in `/workspace/team-build/crownandcompass/topics-inbox.md`. Privacy filter: no members, private people, family, Bari, or secrets.
2. **About 3:00 PM ET: Barnabas drafts.** Reads the voice file and banned list, then `live-briefs/WRITTEN-LOG.md`, then the feed. Writes one blog post, 2 to 3 X posts, and the newsletter draft. Saves all to `/workspace/team-build/crownandcompass/drafts/YYYY-MM-DD.md`.
3. **Blog draft to the drafts API.** `POST /api/drafts` (then `PATCH /api/drafts/:slug` for fixes, `POST /api/drafts/:slug/images` only for Brian-approved images, `POST /api/drafts/:slug/ready`). Bearer auth with BARNABAS_API_KEY, read at run time from `/home/box/.secrets/cc_barnabas_api_key`. Never write the key value into any file, log or email. Barnabas cannot publish; only BRIAN_ADMIN_KEY can.
4. **Newsletter draft to the newsletter drafts API.** Same key, same rules. `POST /api/newsletter-drafts` creates the issue (subject, preheader, issue_date for that Friday, headline, intro, body_html, verse; see `newsletter/README.md`). Images only if Brian approved them: `POST /api/newsletter-drafts/:id/images` with alt text. Fix with `PATCH /api/newsletter-drafts/:id`, then `POST /api/newsletter-drafts/:id/ready`. Keep the plain-text copy in the step 2 drafts file (and `newsletter/YYYY-MM-DD.md`) as well. Ready is as far as Barnabas goes. The issue sits in the members app at `/admin/newsletter?id=N` until Brian opens it, edits it if he wants, and presses Approve and send himself. Barnabas never sends, approves or schedules a newsletter, and his key cannot.
5. **About 3:45 PM ET: David emails Brian** at bmangum1@gmail.com, from Brian's Gmail to himself, subject "Barnabas: this week's drafts (YYYY-MM-DD)". This email is the handoff.

If the week is thin, Barnabas writes one short piece or says so plainly in the email.

## Copyable email format

- Plain text, or HTML that is only paragraphs and line breaks. No markdown symbols, no tables, no colored borders, no em dashes.
- Plain capital label lines: BLOG DRAFT, DRAFT LINK, X POST 1, NEWSLETTER DRAFT, NEWSLETTER REVIEW LINK, NOTES.
- Blog draft first: title, then body exactly as it would publish, then the draft slug so Brian can find it in the admin.
- NEWSLETTER REVIEW LINK is the `review_url` the newsletter drafts API returns (`https://app.thecrownandcompass.org/admin/newsletter?id=N`). That page is where Brian approves and sends. If the API call failed, say so here and point to the plain file.
- NOTES last: MODE, SOURCES, FACTS TO VERIFY, SCRIPTURE CHECK, PRIVACY CHECK, LINKS, WORD COUNT, IMAGE IDEA.

## Write targets

1. Working file: `/workspace/team-build/crownandcompass/drafts/YYYY-MM-DD.md` on the box.
2. Blog drafts: the C&C drafts API only (draft status). Never static HTML, never a blog PR.
3. Newsletter: the newsletter drafts API (draft, then ready) plus the plain text in the drafts file and `newsletter/YYYY-MM-DD.md`. Sending is Brian's button in the members app, never Barnabas.
4. Site copy, guides, SEO: PRs on site-crownandcompass, never merged by Barnabas.
5. Log: `live-briefs/WRITTEN-LOG.md` row for every piece.
