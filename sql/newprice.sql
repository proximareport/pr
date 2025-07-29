UPDATE users SET role = 'admin' WHERE username IN ('sam', 'admin', 'tyler', 'jack');

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;

UPDATE users SET membership_tier = 'pro' WHERE role = 'admin';

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'inactive',
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

INSERT INTO user_subscriptions (user_id, status, tier)
SELECT id, 'active', membership_tier 
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO role_permissions (role, permission) VALUES
('admin', 'manage_users'),
('admin', 'manage_articles'),
('admin', 'manage_advertisements'),
('admin', 'manage_site_settings'),
('admin', 'manage_media'),
('admin', 'manage_categories'),
('admin', 'manage_comments'),
('admin', 'view_analytics'),
('admin', 'manage_subscriptions'),
('editor', 'manage_articles'),
('editor', 'manage_categories'),
('editor', 'moderate_comments'),
('author', 'create_articles'),
('author', 'edit_own_articles'),
('user', 'create_comments'),
('user', 'edit_own_profile')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS feature_access (
  id SERIAL PRIMARY KEY,
  membership_tier VARCHAR(50) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO feature_access (membership_tier, feature, enabled) VALUES
('free', 'basic_articles', true),
('free', 'commenting', true),
('free', 'basic_search', true),
('supporter', 'basic_articles', true),
('supporter', 'commenting', true),
('supporter', 'basic_search', true),
('supporter', 'premium_articles', true),
('supporter', 'early_access', true),
('supporter', 'supporter_badge', true),
('supporter', 'profile_customization', true),
('pro', 'basic_articles', true),
('pro', 'commenting', true),
('pro', 'basic_search', true),
('pro', 'premium_articles', true),
('pro', 'early_access', true),
('pro', 'supporter_badge', true),
('pro', 'profile_customization', true),
('pro', 'advanced_search', true),
('pro', 'priority_support', true),
('pro', 'pro_badge', true),
('pro', 'unlimited_downloads', true),
('pro', 'exclusive_content', true)
ON CONFLICT DO NOTHING; 