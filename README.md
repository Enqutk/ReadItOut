# Leyu & Mahi Fan Story Bot

A Telegram bot and mini app so fans can submit stories to **Leyu & Mahi**. The creators review submissions, feature the best ones in videos, and notify fans—all from one place.

---

## The idea

**Leyu & Mahi** are creators who want to turn fan stories into content. This project gives them:

- **A single Telegram bot** where fans open a mini app, submit stories, and track their submission with a simple number (e.g. *Submission #42*).
- **An admin dashboard** (web) to review new stories, reject with a reason, or “feature” stories by attaching a YouTube link—which automatically notifies those fans.
- **No shortlisted/approved step**: stories are either **Pending**, **Rejected**, or **Featured** (once they get a video link). Admins can feature any pending story directly.
- **Profile and branding** stored in the database: tagline, about text, profile photos, Instagram/TikTok links (3 Instagram + 2 TikTok), and an optional one-time popup for announcements.
- **Telegram bot commands** for admins: list pending stories, reject with reason (fan gets notified), or select stories for a video by submission # and send the YouTube link (fans get notified).

So: **fans submit and track; creators review, reject or feature, and notify—all via the bot and dashboard.**

---

## What’s included

| Part | Description |
|------|-------------|
| **Telegram bot** | `/start` shows a welcome and an **Open** button (BotFather-style) that opens the mini app. Fans can also submit via `/submit_story` in chat. |
| **Mini app** | Next.js app inside Telegram: Home, Submit Story, My Submissions (with submission #), About. Optional popup and profile photos from Settings. |
| **Admin dashboard** | Web UI: New stories, Rejected, Already read (contact), Settings (profile, social links, popup). Select stories and add a YouTube link to feature them and notify fans. |
| **Bot admin commands** | `/list_pending`, `/reject <id> [reason]`, `/select_for_video <youtube_url> <id1> [id2] ...` (IDs can be submission numbers). |
| **Database** | Supabase: stories (with sequential `submission_number`), notifications, app_config (profile, social links, popup), profile photos in Storage. |

---

## Tech stack

- **Framework:** Next.js 14 (App Router + API routes)
- **Bot:** Telegraf (Telegram)
- **Database:** Supabase (PostgreSQL + optional Storage)
- **Hosting:** Vercel

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and set:

- `BOT_TOKEN` – from [@BotFather](https://t.me/BotFather)
- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (Settings → API)
- `NEXT_PUBLIC_APP_URL` – full URL of your deployed app (e.g. `https://your-app.vercel.app`)
- `ADMIN_TELEGRAM_IDS` – comma-separated Telegram user IDs for admins (get ID from [@userinfobot](https://t.me/userinfobot))
- Optional: `ADMIN_API_SECRET` – if you want to save dashboard Settings from the browser without Telegram

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run each migration in order:
   - `supabase/migrations/001_create_stories.sql`
   - `supabase/migrations/002_notifications_and_video.sql`
   - `supabase/migrations/003_add_read_at.sql`
   - `supabase/migrations/004_app_config.sql`
   - `supabase/migrations/005_profile_config.sql`
   - `supabase/migrations/006_submission_number.sql`
3. (Optional) Create a **public** Storage bucket named `profile` for profile photo uploads from the dashboard.

### 4. Run locally

```bash
npm run dev
```

### 5. Set Telegram webhook (production)

After deploying to Vercel:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram"
```

For local testing with [ngrok](https://ngrok.com): run `ngrok http 3000`, then set the webhook to `https://<ngrok-url>/api/telegram`.

---

## Project structure

```
leyu_mahi_bot/
├── app/                    # Mini App (Next.js App Router)
│   ├── layout.tsx
│   ├── page.tsx            # Home (profile, actions, Follow us)
│   ├── submit/page.tsx     # Submit story
│   ├── stories/page.tsx    # My submissions (with #)
│   ├── about/page.tsx     # About + social links
│   └── components/
│       └── SocialIcons.tsx # Instagram / TikTok SVGs
├── lib/
│   ├── bot.js              # Telegraf: start, submit_story, reject, select_for_video, list_pending
│   ├── supabase.js
│   └── telegram-auth.js    # Validate WebApp initData
├── pages/
│   ├── dashboard.js        # Admin: stories, settings (profile, social, popup)
│   └── api/
│       ├── telegram.js     # Webhook handler
│       ├── app-config.js   # Public config (profile, social, popup)
│       ├── stories.js      # Admin story list
│       ├── my-stories.js   # User’s stories (Mini App)
│       ├── submit-story.js # Mini App submit
│       ├── me.js           # Mini App: isAdmin
│       └── admin/
│           ├── app-config.js   # GET/POST config (auth)
│           ├── reject.js
│           ├── feature-video.js
│           └── upload-photo.js
├── supabase/
│   └── migrations/         # 001–006 (stories, notifications, app_config, profile, submission_number)
├── .env.example
├── next.config.js
└── package.json
```

---

## Features in detail

### For fans (Mini App)

- **Home:** Profile (photos/tagline from Settings), actions: Submit Story, My Submissions, About Leyu & Mahi; Follow us (Instagram/TikTok from Settings).
- **Submit:** Category, story text, anonymous option. On success: *Your submission #N — save this to track it.*
- **My Stories:** List of submissions with **Submission #N** and status: Pending, Rejected, or Featured (with video link).

### For admins

- **Dashboard** (open from Mini App or direct URL with `ADMIN_API_SECRET`): New, Rejected, Already read (contact), Settings.
- **Settings:** Profile (tagline, about, 3 profile photos), Social links (3 Instagram + 2 TikTok URLs), Popup (one-time message).
- **Feature flow:** In “New” or “All”, select stories, enter YouTube link, submit → stories get the link and fans are notified; stories appear under “Already read (contact)” for follow-up.

### Bot commands (admin)

- `/list_pending` – Pending stories with submission #
- `/reject <id> [reason]` – Reject and notify fan (id = submission # or UUID)
- `/select_for_video <youtube_url> <id1> [id2] ...` – Feature stories by submission # (or UUID) and notify fans

### Social links

Only Instagram and TikTok; 5 links total: Instagram (Leyu), Instagram (Mahi), Instagram (both), TikTok (Leyu), TikTok (Mahi). Configured in Dashboard → Settings → Social links; shown on Home and About with proper icons.

---

## Verify setup

1. Open the bot in Telegram, send `/start` → welcome message and blue **Open** button.
2. Tap **Open** → Mini App loads; submit a story → success shows *Your submission #1*.
3. Open **My Stories** → submission listed with # and status.
4. As admin, open `/dashboard` → see the story; add YouTube link to feature it → fan receives Telegram message with the link.

---

## Optional / future

- **Sprint 5:** Direct messaging, ask fans questions.
- **"Open" in chat list:** The blue **Open** button (like BotFather) is set in code when users send `/start` (Menu Button is not in BotFather’s UI). Ensure the bot is deployed and `NEXT_PUBLIC_APP_URL` is correct; after someone sends `/start`, the Open button should appear next to the chat in the list.
