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
├── lib/
│   ├── bot.js          # Telegraf bot + /start handler
│   └── supabase.js     # Supabase client
├── pages/
│   └── api/
│       ├── telegram.js # Webhook endpoint
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

## Upcoming Sprints

- **Sprint 3:** Admin dashboard & approval/rejection
- **Sprint 4:** Fan notifications & direct messaging
