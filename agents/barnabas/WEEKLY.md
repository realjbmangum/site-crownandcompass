# Barnabas weekly schedule

Status: DRAFT. None of these routines exist yet. They are created only after Brian approves.

## Every Friday

1. **About 2:00 PM ET: David builds the weekly feed** at `/workspace/team-build/crownandcompass/weekly-feed/YYYY-MM-DD.md`. Facts only: where the current book and six-week cycle stand, merged site PRs, public Christian news worth a line (with links), and anything in `/workspace/team-build/crownandcompass/topics-inbox.md`. Privacy filter: no members, private people, family, Bari, or secrets.
2. **About 3:00 PM ET: Barnabas drafts.** Reads the voice file and banned list, then `live-briefs/WRITTEN-LOG.md`, then the feed. Writes one blog post, 2 to 3 X posts, and the newsletter draft. Saves all to `/workspace/team-build/crownandcompass/drafts/YYYY-MM-DD.md`.
3. **Blog draft to the drafts API.** `POST /api/drafts` (then `PATCH /api/drafts/:slug` for fixes, `POST /api/drafts/:slug/images` only for Brian-approved images, `POST /api/drafts/:slug/ready`). Bearer auth with BARNABAS_API_KEY, read at run time from `/home/box/.secrets/cc_barnabas_api_key`. Never write the key value into any file, log or email. Barnabas cannot publish; only BRIAN_ADMIN_KEY can.
4. **About 3:45 PM ET: David emails Brian** at bmangum1@gmail.com, from Brian's Gmail to himself, subject "Barnabas: this week's drafts (YYYY-MM-DD)". This email is the handoff.

If the week is thin, Barnabas writes one short piece or says so plainly in the email.

## Copyable email format

- Plain text, or HTML that is only paragraphs and line breaks. No markdown symbols, no tables, no colored borders, no em dashes.
- Plain capital label lines: BLOG DRAFT, DRAFT LINK, X POST 1, NEWSLETTER DRAFT, NOTES.
- Blog draft first: title, then body exactly as it would publish, then the draft slug so Brian can find it in the admin.
- NOTES last: MODE, SOURCES, FACTS TO VERIFY, SCRIPTURE CHECK, PRIVACY CHECK, LINKS, WORD COUNT, IMAGE IDEA.

## Write targets

1. Working file: `/workspace/team-build/crownandcompass/drafts/YYYY-MM-DD.md` on the box.
2. Blog drafts: the C&C drafts API only (draft status). Never static HTML, never a blog PR.
3. Site copy, guides, SEO: PRs on site-crownandcompass, never merged by Barnabas.
4. Log: `live-briefs/WRITTEN-LOG.md` row for every piece.
