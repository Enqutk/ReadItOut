-- Sequential submission number so users can track their submission (#1, #2, ...)

CREATE SEQUENCE IF NOT EXISTS stories_submission_number_seq;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS submission_number INTEGER;

-- Backfill existing rows by creation order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM stories
)
UPDATE stories
SET submission_number = ordered.rn
FROM ordered
WHERE stories.id = ordered.id;

-- Enforce uniqueness and not null
ALTER TABLE stories ALTER COLUMN submission_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_submission_number ON stories(submission_number);

-- Default for new rows
ALTER TABLE stories ALTER COLUMN submission_number SET DEFAULT nextval('stories_submission_number_seq');

-- Set sequence to continue after current max
SELECT setval('stories_submission_number_seq', COALESCE((SELECT MAX(submission_number) FROM stories), 0) + 1);
