-- App config (social links, popup) – editable by admin
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on app_config"
  ON app_config FOR ALL USING (true) WITH CHECK (true);

-- Seed default keys so GET can return them
INSERT INTO app_config (key, value) VALUES
  ('social_links', '{}'),
  ('popup', '{"enabled":false,"id":"1","title":"","message":"","link":"","linkLabel":"Learn more"}')
ON CONFLICT (key) DO NOTHING;
