-- Leyu & Mahi Bot – full schema (run once on a fresh database)
-- Supabase: SQL Editor → paste & run this file

-- =============================================================================
-- Sequence for submission numbers (#1, #2, ...)
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS stories_submission_number_seq;

-- =============================================================================
-- stories
-- =============================================================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  telegram_username TEXT,
  content TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  youtube_link TEXT,
  read_at TIMESTAMPTZ,
  submission_number INTEGER NOT NULL DEFAULT nextval('stories_submission_number_seq'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If stories already existed without submission_number, add it and backfill
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'submission_number'
  ) THEN
    ALTER TABLE stories ADD COLUMN submission_number INTEGER;
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM stories
    )
    UPDATE stories SET submission_number = ordered.rn
    FROM ordered WHERE stories.id = ordered.id;
    ALTER TABLE stories ALTER COLUMN submission_number SET NOT NULL;
    ALTER TABLE stories ALTER COLUMN submission_number SET DEFAULT nextval('stories_submission_number_seq');
    PERFORM setval('stories_submission_number_seq', COALESCE((SELECT MAX(submission_number) FROM stories), 0) + 1);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_submission_number ON stories(submission_number);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_telegram_user ON stories(telegram_user_id);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access" ON stories;
CREATE POLICY "Service role has full access" ON stories
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- notifications
-- =============================================================================
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

DROP POLICY IF EXISTS "Service role full access on notifications" ON notifications;
CREATE POLICY "Service role full access on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- app_config (social links, popup, profile)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on app_config" ON app_config;
CREATE POLICY "Service role full access on app_config" ON app_config
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO app_config (key, value) VALUES
  ('social_links', '{}'),
  ('popup', '{"enabled":false,"id":"1","title":"","message":"","link":"","linkLabel":"Learn more"}'),
  ('profile', '{"photoLeyu":"","photoMahi":"","photoTogether":"","tagline":"Two voices. One vibe. Your stories.","aboutBlurb":""}')
ON CONFLICT (key) DO NOTHING;
