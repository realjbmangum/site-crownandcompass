# Crown and Compass — Site Map (plain names)

> The full information architecture for the platform. Plain labels only — a man reads a
> label and knows what it is. This is the map; the clickable mockups (`prototype/index.html`)
> show each screen. Nothing is built into the real site until this is approved.

---

## PUBLIC SITE — `thecrownandcompass.org`

**Primary nav:** About · How It Works · The Compass · Reading List · Blog · Resources · Find a Chapter — plus a **Join** button and a **Sign in** link (to the members app).

```
Home
├── About                     the story, who we are, the founder
├── How It Works              chapters, guides, the weekly meeting, daily check-in (plain)
├── The Compass               our framework for a man's life
│     ├── Body                overview + the four steps
│     ├── Being
│     ├── Balance
│     └── Business
├── Reading List             the books we read
│     └── Book / Reading Guide   per-book page + its reading guide (weeks)
├── Blog                      articles + short daily reads
│     └── Blog Post
├── Resources                 library: guides, tools, directories, downloads
│     ├── Recovery Directory  60+ sobriety resources, filterable
│     └── Tool / Download      e.g. the daily tracker
├── Find a Chapter            map + list of chapters (and "forming" ones)
├── Start a Chapter           intake form to plant a new chapter
├── FAQ                       plain answers to the common questions
└── Join                      get connected (the main intake form)

Everywhere: a Newsletter signup (footer + in-content) → confirmation page
Footer: nav · newsletter · social · © / free-forever line
```

---

## MEMBERS APP — `app.thecrownandcompass.org`

**App nav:** Dashboard · My Reading · Check-in · My Chapter · Account (+ Admin for guides/founder).

```
Sign in                       magic-link request → "check your email"
Dashboard                     your chapter + meeting time · current book + week ·
                              this week's reading guide · "I did the reading" ·
                              who's active this week · nominate a leader
My Reading                    current book, this week's guide (reader), past weeks, progress
Check-in                      daily check-in + streaks, tied to the four areas of The Compass
My Chapter                    members, meeting time, prayer requests
Community                     chapter feed + prayer requests   (later wave — placeholder)
Account                       name, email, notification prefs, sessions, sign out
Admin (guides/founder)        chapter-health grid · publish a reading guide ·
                              nominations queue · newsletter audience
```

---

## Notes on structure

- **The Compass** is the one brand term kept — it's the framework (Body/Being/Balance/Business) and always shown with that plain descriptor.
- **Newsletter** signup appears in the footer and inside content, not as its own page.
- **Reading Guides** live under each book (a guide = the weekly study notes for that book), and are also collected under **Resources**.
- **Blog** holds both longer articles and the short daily reads (from the journal) — one clean feed, filterable by the four areas.
- The **members app** is a separate surface (`app.` subdomain) sharing the same login, data, and design — invisible to the public, gated by sign-in.
