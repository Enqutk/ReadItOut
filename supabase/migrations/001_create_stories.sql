-- Leyu & Mahi Bot: Stories table for fan submissions
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  telegram_username TEXT,
  content TEXT NOT NULL,
  category TEXT, -- funny, scary, love, etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering by status and date
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_telegram_user ON stories(telegram_user_id);

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by API)
CREATE POLICY "Service role has full access" ON stories
  FOR ALL
  USING (true)
  WITH CHECK (true);
