ALTER TABLE comments ADD COLUMN ghost_post_id TEXT;

CREATE INDEX idx_comments_ghost_post_id ON comments(ghost_post_id);

ALTER TABLE comments ALTER COLUMN article_id DROP NOT NULL;

ALTER TABLE comments ADD CONSTRAINT check_article_reference
  CHECK (article_id IS NOT NULL OR ghost_post_id IS NOT NULL);
