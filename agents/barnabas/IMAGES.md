# Barnabas images

Status: DRAFT, pending Brian's pick of a generation method.

## Where images live
Uploaded through `POST /api/drafts/:slug/images` on the C&C drafts API, which stores them in the crownandcompass-media R2 bucket and serves them at `/media/blog/YYYY/MM/<slug>/NN.ext`. Newsletter images go through `POST /api/newsletter-drafts/:id/images` into the same bucket at `/media/newsletter/YYYY/MM/<id>/NN.ext`, and need alt text. Never the cc-book-scans bucket (members app). Never a new bucket.

## Rules
- Brian approves every image before upload.
- Atmospheric photography per brand-standards.md: roads, mist, morning light, books, tables. No faces of members, family or private people.
- No names in file names or alt text. Strip EXIF and GPS before upload.
- Stock images carry a credit line and source link. AI art is never a fake photo of a real person, place or event.
- No screenshots showing secrets, emails or member data.
- No colored side or accent borders, frames or overlays.
- Until a method is picked: no images, just IMAGE IDEA, SOURCE and ALT in NOTES.
