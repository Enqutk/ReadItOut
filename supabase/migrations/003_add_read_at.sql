-- Add read_at to track when Leyu/Mahi have read a story (removes from "New")
ALTER TABLE stories ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
