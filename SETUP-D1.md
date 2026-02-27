# Setting Up D1 + SendGrid (Get Connected + Newsletter)

The join form and newsletter are fully coded. This is the 5-step checklist to make them live.

---

## Step 1 — Create the D1 database

In your terminal, from the project folder:

```bash
npx wrangler d1 create crownandcompass
```

This prints something like:
```
✅ Successfully created DB 'crownandcompass'

[[d1_databases]]
binding = "DB"
database_name = "crownandcompass"
database_id = "abc123-def456-..."
```

**Copy the `database_id` value.**

---

## Step 2 — Update wrangler.toml

Open `wrangler.toml` and replace `YOUR_D1_DATABASE_ID` with the ID you just copied:

```toml
[[d1_databases]]
binding = "DB"
database_name = "crownandcompass"
database_id = "abc123-def456-..."   ← paste here
```

---

## Step 3 — Run the schema migration

```bash
npx wrangler d1 execute crownandcompass --file=data/schema.sql
```

This creates the `subscribers` and `newsletter_sends` tables.

To verify:
```bash
npx wrangler d1 execute crownandcompass --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## Step 4 — Add env vars to Cloudflare Pages

Go to **Cloudflare Pages → your project → Settings → Environment Variables**.

Add these (Production + Preview):

| Variable | Value |
|----------|-------|
| `SENDGRID_API_KEY` | Your SendGrid API key |
| `NOTIFICATION_EMAIL` | The email Brian wants new-inquiry notifications sent to |
| `ADMIN_SECRET` | A random secret string (generate with `openssl rand -hex 32`) |

---

## Step 5 — Add the D1 binding to Cloudflare Pages

Go to **Cloudflare Pages → your project → Settings → Bindings → D1 databases**.

Add:
- Variable name: `DB`
- D1 database: `crownandcompass`

---

## Step 6 — Redeploy

Push any small change to GitHub to trigger a redeploy, or click **Retry deployment** in the Pages dashboard. The bindings and env vars take effect on the next deploy.

---

## Testing

### Test the join form
1. Go to `/join` on the live site
2. Fill in name + email + submit
3. Should see: "Good. Brian will reach out soon."
4. Verify row in D1: `npx wrangler d1 execute crownandcompass --command="SELECT * FROM subscribers"`
5. Brian should receive a notification email

### Test the newsletter
1. Go to `/admin/newsletter`
2. Enter your `ADMIN_SECRET` in the admin secret field
3. Write a test subject + reading notes
4. Send — should confirm "Sent to X subscribers"
5. Check your inbox

---

## R2 (Field Guides — when ready)

When you have a PDF field guide to upload:

1. Create an R2 bucket: `npx wrangler r2 bucket create crownandcompass-guides`
2. Make it public in the Cloudflare R2 dashboard (Settings → Allow public access)
3. Upload: `npx wrangler r2 object put crownandcompass-guides/wild-at-heart.pdf --file=path/to/guide.pdf`
4. The public URL will be: `https://pub-{hash}.r2.dev/wild-at-heart.pdf`
   (or use a custom domain once configured)
5. Update `src/data/books.json` — set `fieldGuideUrl` for that book to the R2 URL
6. `npm run build` + commit + push — the Field Guide button appears automatically
