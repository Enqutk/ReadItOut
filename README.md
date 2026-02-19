# Leyu & Mahi Fan Story Bot

Telegram bot for fans to submit stories. Leyu & Mahi can approve, reject, and message fans directly.

## Sprint 1: Project Setup & Architecture ✅

- [x] GitHub repo + .gitignore
- [x] Next.js project (frontend + API routes)
- [x] Supabase (PostgreSQL) database
- [x] Environment variables (BOT_TOKEN, Supabase)
- [x] `/start` bot command via webhook
- [x] README + documentation

### Tech Stack

- **Framework:** Next.js 14 (Vercel serverless)
- **Bot:** Telegraf (Telegram)
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

- `BOT_TOKEN` – from [@BotFather](https://t.me/BotFather)
- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (Settings → API)

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → **New query**
3. Paste and run `supabase/migrations/001_create_stories.sql`

### 4. Run locally

```bash
npm run dev
```

### 5. Set Telegram webhook (production)

After deploying to Vercel, set the webhook URL:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram"
```

For local testing with [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Then: curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR-NGROK-URL/api/telegram"
```

---

## Verify Sprint 1

### Serverless endpoint responds to `/start`

1. Deploy to Vercel and set the webhook
2. Open your bot in Telegram and send `/start`
3. You should see: *Welcome to Leyu & Mahi Bot!*

### Test story insertion

**Option A – API route** (after `npm run dev`):

```
GET http://localhost:3000/api/test-story
```

**Option B – Script**:

```bash
npm run test-story
```

Both should insert a test story into Supabase. Check in **Supabase → Table Editor → stories**.

---

## Project Structure

```
leyu_mahi_bot/
├── app/                # Mini App (App Router)
│   ├── layout.tsx
│   ├── page.tsx        # Home
│   ├── submit/page.tsx
│   ├── stories/page.tsx
│   └── about/page.tsx
├── lib/
│   ├── bot.js
│   ├── supabase.js
│   └── telegram-auth.js
├── pages/
│   ├── dashboard.js
│   └── api/
│       ├── telegram.js
│       ├── stories.js
│       ├── submit-story.js  # Mini App submit
│       ├── my-stories.js    # Mini App my stories
│       └── test-story.js
├── supabase/
│   └── migrations/
│       └── 001_create_stories.sql
├── scripts/
│   └── insert-test-story.js
├── .env.example
├── next.config.js
└── package.json
```

---

## Sprint 2: Fan Story Submission ✅

- [x] `/submit_story` command
- [x] Validate story (20–4096 chars) & store in Supabase
- [x] Unique ID per story (Supabase UUID)
- [x] Confirmation message: "Story submitted successfully!"

**Usage:** `/submit_story Your story text here...`

---

## Sprint 3: Admin Panel / Story Management ✅

- [x] Admin commands: `/list_pending`, `/approve <id>`, `/reject <id> [reason]`
- [x] Store admin actions in Supabase (status updates)
- [x] Optional: Next.js dashboard at `/dashboard` (filter by status/category)

**Setup:** Add your Telegram user ID(s) to `ADMIN_TELEGRAM_IDS` in `.env.local` (comma-separated). Get your ID from [@userinfobot](https://t.me/userinfobot).

**Usage:**
- `/list_pending` – List pending stories
- `/approve abc123` – Approve story (use short ID from list)
- `/reject abc123 Sorry, not suitable` – Reject with optional reason

---

## Sprint 4: Video Selection & Fan Notification ✅

- [x] Tag 4–8 stories as "selected for video" (`/select_for_video`)
- [x] Notify fans: featured → "Your story was read! Watch here: [link]"; rejected → "Story rejected because [reason]"
- [x] Store notifications in Supabase

**Usage:**
- `/reject abc123 Sorry, not suitable` – Rejects story and **notifies the fan** automatically
- `/select_for_video <youtube_url> <id1> <id2> ...` – Select approved stories, tag with video link, notify each fan

**Setup:** Run `supabase/migrations/002_notifications_and_video.sql` in Supabase SQL Editor.

---

## Telegram Mini App ✅

- [x] **Open App** button in bot `/start` – opens Next.js UI in Telegram webview
- [x] **Home** – Submit a Story, My Stories, About
- [x] **Submit** – Category dropdown, story textarea, anonymous toggle
- [x] **My Stories** – List of user's stories with status (Pending / Featured 🌟)
- [x] InitData validation (HMAC) for secure user identification
- [x] Mobile-first, dark-mode friendly

**Flow:** User opens bot → taps "Open App" → Next.js loads in webview → Submit/View stories.

**Admin experience:** Admins see only "How It Works" and "Admin Dashboard" on home – no Submit Story or My Submissions.

**Social links:** Add `NEXT_PUBLIC_SOCIAL_YOUTUBE`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, etc. to show Leyu & Mahi's links on the About page and home footer.

**Popup (ads/events):** Set `NEXT_PUBLIC_POPUP_ENABLED=true`, `NEXT_PUBLIC_POPUP_TITLE`, etc. to show a promotional popup (once per session). Or use **Settings** in the admin dashboard to edit popup and social links in the app (stored in DB; run `supabase/migrations/004_app_config.sql` first).

**Profile photos (upload from gallery):** In **Settings → Profile** you can paste image URLs or use **Upload from gallery** to pick a photo. For gallery upload to work, create a **public** storage bucket named `profile` in Supabase: Dashboard → Storage → New bucket → name `profile` → set to **Public**.

**Setup:**
1. Set `NEXT_PUBLIC_APP_URL` in Vercel env (e.g. `https://read-it-out-ten.vercel.app`)
2. In [@BotFather](https://t.me/BotFather): `/mybots` → your bot → **Bot Settings** → **Menu Button** → set URL to your app URL (optional; the inline button also works)

---

## Upcoming Sprints

- **Sprint 5:** Direct messaging / Ask fans questions
