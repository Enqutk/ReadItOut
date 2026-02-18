-- Profile config for Leyu & Mahi (photos, about blurb)
INSERT INTO app_config (key, value) VALUES
  ('profile', '{"photoLeyu":"","photoMahi":"","photoTogether":"","tagline":"Two voices. One vibe. Your stories.","aboutBlurb":""}')
ON CONFLICT (key) DO NOTHING;
