-- Sprint 4: Notifications and video selection
-- Run ONLY this in Supabase SQL Editor (do not re-run 001)

-- Add YouTube link to stories (when featured in a video)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS youtube_link TEXT;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id),
  telegram_user_id BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rejected', 'featured')),
  youtube_link TEXT,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_notifications_story ON notifications(story_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy only if it doesn't exist (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role full access on notifications'
  ) THEN
    CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
