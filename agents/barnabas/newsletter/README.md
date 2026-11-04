# Barnabas newsletter drafts

Every Friday Barnabas writes the newsletter draft in two places:

1. **The newsletter drafts API** (the copy Brian sends from).
2. **Plain text**, as before: under NEWSLETTER DRAFT in the Friday drafts file `/workspace/team-build/crownandcompass/drafts/YYYY-MM-DD.md`, and here as `YYYY-MM-DD.md`, in case the API is down and for the record.

Barnabas never sends, approves or schedules a newsletter. Sending is gated behind Brian's **Approve and send** button in the members app (`/admin/newsletter`). Barnabas's key is draft-only: the API has no approve or send route, and the shared database refuses to mark an issue approved or sent unless a signed-in admin did it.

## The API

Base: `https://thecrownandcompass.org`. Auth: `Authorization: Bearer <BARNABAS_API_KEY>`, read at run time from `/home/box/.secrets/cc_barnabas_api_key`. Never write the value into any file, log or email.

| Call | What it does |
| --- | --- |
| `POST /api/newsletter-drafts` | Create an issue. Returns `{ newsletter: { id, rev, status: "draft", review_url, ... } }`. |
| `GET /api/newsletter-drafts` | List Barnabas's issues. |
| `GET /api/newsletter-drafts/:id` | Read one, including `rev`. |
| `PATCH /api/newsletter-drafts/:id` | Change any of the fields below. Send `rev` from the last read so a stale write gets 409. Optional `note` (why). |
| `POST /api/newsletter-drafts/:id/images` | Upload an image Brian approved. Multipart `file` + `alt`, or JSON `{ data_base64, alt }`. JPEG, PNG, GIF or WebP, 5 MB max. Returns an absolute `url`. |
| `POST /api/newsletter-drafts/:id/ready` | Mark ready for Brian. Does not send. |

Fields (JSON):

- `subject` (required, 200 characters max) and `preheader` (the inbox preview line)
- `issue_date` (`YYYY-MM-DD`, the Friday it is for)
- `headline`, `intro`
- `body_html` (required): the letter. Paragraphs, `<h2>`/`<h3>`, `<strong>`, `<em>`, links, lists, `<blockquote>`, and `<img>` from the upload call with real alt text. Everything else is stripped. Images from anywhere but `/media/` on the site are refused.
- `verse_text`, `verse_ref`
- `cover_image_url` + `cover_image_alt` (optional; an uploaded image)
- `cycle_tag` (optional)
- `source` on create: the plain-file path, e.g. `agents/barnabas/newsletter/2026-11-06.md`

Barnabas cannot set `status`, `approved_*`, `sent_*` or anything about sending. Those are refused with 400.

Once Brian edits an issue in the app it is his: further `PATCH` calls from Barnabas get 409. Approved, sent and failed issues cannot be edited through the API.

## Writing it

- The letter is read by people who have never been to a table. It stands on its own: say what Crown & Compass is in a line, name the book and the week in plain words, and do not lean on inside jokes or earlier issues.
- Voice file and banned list first, as for every draft.
- No member names, nothing from the members app, no private people, nothing about Bari.
- Images only with Brian's approval (`IMAGES.md`). Every image has alt text. No colored side or accent borders anywhere.
- The unsubscribe link and footer are added by the app at send time. Do not write one.

## Plain-file copy

`YYYY-MM-DD.md` here, plain text: SUBJECT, PREHEADER, then the letter as it reads, then NOTES. Add the issue id and `review_url` from the API at the bottom, or `API: failed (reason)` if the call did not go through.
