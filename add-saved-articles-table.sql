CREATE TABLE IF NOT EXISTS saved_articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ghost_post_id TEXT,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_ghost_post_id ON saved_articles(ghost_post_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_article_id ON saved_articles(article_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_ghost_post_idx ON saved_articles(user_id, ghost_post_id) WHERE ghost_post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_article_idx ON saved_articles(user_id, article_id) WHERE article_id IS NOT NULL;
