-- Proxima Report Subscription System Setup
-- This file sets up the complete subscription infrastructure for the three tiers

-- Update existing users table with subscription fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create comprehensive subscription tracking table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'inactive',
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription features table to track what each tier provides
CREATE TABLE IF NOT EXISTS subscription_features (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- Price in cents
  price_yearly INTEGER NOT NULL, -- Price in cents
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT -1, -- -1 means unlimited
  reset_date DATE NOT NULL, -- When usage resets (monthly/yearly)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription payment history table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'succeeded', 'failed', 'pending', 'canceled'
  billing_reason VARCHAR(50), -- 'subscription_create', 'subscription_cycle', 'subscription_update'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_feature ON subscription_usage(user_id, feature);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);

-- Insert the three subscription tiers with their features
INSERT INTO subscription_features (tier, name, description, price_monthly, price_yearly, features) VALUES
('free', 'Free', 'Basic access to content and community features', 0, 0, '[
  "Access to all public articles",
  "Basic astronomy photo gallery",
  "Comment on articles",
  "Basic profile customization",
  "Newsletter subscription",
  "Basic search functionality",
  "Community forum access"
]'),

('supporter', 'Supporter', 'Enhanced features and exclusive content', 499, 4790, '[
  "All Free features",
  "Reduced ads experience",
  "5 exclusive premium themes",
  "Supporter badge & animated avatar",
  "Access to exclusive supporter articles",
  "Priority comment placement",
  "Enhanced profile customization",
  "Member-only community channels",
  "Priority customer support",
  "Digital member badge"
]'),

('pro', 'Pro', 'Ultimate space enthusiast experience', 999, 8990, '[
  "All Supporter features",
  "Complete ad-free experience",
  "All premium themes & customization",
  "Pro badge & premium animations",
  "Full premium content library",
  "Priority support & feedback",
  "Early access to new features",
  "Animated profile backgrounds",
  "Priority content suggestions",
  "Live launch coverage",
  "Exclusive interviews and Q&As",
  "Advanced analytics and insights",
  "Personalized content recommendations",
  "Access to premium tools and calculators",
  "Member-only events and webinars"
]')
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  updated_at = CURRENT_TIMESTAMP;

-- Update existing users to have proper subscription status
UPDATE users SET 
  subscription_status = CASE 
    WHEN membership_tier = 'free' THEN 'active'
    WHEN membership_tier IN ('supporter', 'pro') THEN 'active'
    ELSE 'inactive'
  END,
  subscription_created_at = created_at
WHERE subscription_status IS NULL;

-- Insert existing users into user_subscriptions table
INSERT INTO user_subscriptions (user_id, status, tier, created_at)
SELECT 
  id, 
  CASE 
    WHEN membership_tier = 'free' THEN 'active'
    WHEN membership_tier IN ('supporter', 'pro') THEN 'active'
    ELSE 'inactive'
  END,
  membership_tier,
  created_at
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_subscription_features_updated_at
  BEFORE UPDATE ON subscription_features
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

-- Create function to check if user has access to a feature
CREATE OR REPLACE FUNCTION user_has_feature_access(user_id_param INTEGER, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier VARCHAR(50);
  feature_available BOOLEAN;
BEGIN
  -- Get user's current tier
  SELECT tier INTO user_tier
  FROM user_subscriptions
  WHERE user_id = user_id_param AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no active subscription, user is on free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Check if feature is available for user's tier
  SELECT EXISTS(
    SELECT 1 FROM subscription_features
    WHERE tier = user_tier 
    AND features::jsonb @> ('["' || feature_name || '"]')::jsonb
  ) INTO feature_available;
  
  RETURN COALESCE(feature_available, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details(user_id_param INTEGER)
RETURNS TABLE(
  tier VARCHAR(50),
  status VARCHAR(50),
  billing_cycle VARCHAR(20),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.tier,
    us.status,
    us.billing_cycle,
    us.current_period_end,
    us.cancel_at_period_end,
    sf.features
  FROM user_subscriptions us
  LEFT JOIN subscription_features sf ON us.tier = sf.tier
  WHERE us.user_id = user_id_param 
  AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_payments TO authenticated;

-- Create view for easy subscription management
CREATE OR REPLACE VIEW subscription_overview AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  u.membership_tier,
  us.status as subscription_status,
  us.tier as subscription_tier,
  us.billing_cycle,
  us.current_period_start,
  us.current_period_end,
  us.cancel_at_period_end,
  sf.price_monthly,
  sf.price_yearly,
  sf.features
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_features sf ON us.tier = sf.tier
ORDER BY u.username;

-- Insert sample usage limits for different features
INSERT INTO subscription_usage (user_id, subscription_id, feature, usage_count, usage_limit, reset_date)
SELECT 
  u.id,
  us.id,
  'theme_changes',
  CASE 
    WHEN u.membership_tier = 'free' THEN 0
    WHEN u.membership_tier = 'supporter' THEN 0
    WHEN u.membership_tier = 'pro' THEN 0
  END,
  CASE 
    WHEN u.membership_tier = 'free' THEN 1
    WHEN u.membership_tier = 'supporter' THEN 5
    WHEN u.membership_tier = 'pro' THEN -1
  END,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
ON CONFLICT DO NOTHING;

-- Update site settings with new subscription prices
UPDATE site_settings SET 
  supporter_tier_price = 499,
  pro_tier_price = 999
WHERE id = 1;

-- Create function to handle subscription upgrades/downgrades
CREATE OR REPLACE FUNCTION handle_subscription_change(
  user_id_param INTEGER,
  new_tier VARCHAR(50),
  new_billing_cycle VARCHAR(20) DEFAULT 'monthly'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_subscription_id INTEGER;
  new_subscription_id INTEGER;
BEGIN
  -- Get current active subscription
  SELECT id INTO current_subscription_id
  FROM user_subscriptions
  WHERE user_id = user_id_param AND status = 'active';
  
  -- Mark current subscription as canceled
  IF current_subscription_id IS NOT NULL THEN
    UPDATE user_subscriptions 
    SET status = 'canceled', canceled_at = CURRENT_TIMESTAMP
    WHERE id = current_subscription_id;
  END IF;
  
  -- Create new subscription record
  INSERT INTO user_subscriptions (
    user_id, 
    status, 
    tier, 
    billing_cycle, 
    current_period_start,
    current_period_end
  ) VALUES (
    user_id_param,
    'active',
    new_tier,
    new_billing_cycle,
    CURRENT_TIMESTAMP,
    CASE 
      WHEN new_billing_cycle = 'monthly' THEN CURRENT_TIMESTAMP + INTERVAL '1 month'
      WHEN new_billing_cycle = 'yearly' THEN CURRENT_TIMESTAMP + INTERVAL '1 year'
    END
  ) RETURNING id INTO new_subscription_id;
  
  -- Update user's membership tier
  UPDATE users 
  SET membership_tier = new_tier, updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id_param;
  
  RETURN new_subscription_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Final cleanup and verification
SELECT 'Subscription system setup completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as active_subscriptions FROM user_subscriptions WHERE status = 'active';
SELECT tier, COUNT(*) as user_count FROM user_subscriptions WHERE status = 'active' GROUP BY tier;
