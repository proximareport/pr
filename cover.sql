-- Site Block/Cover System
-- This table stores the site block configuration and content

CREATE TABLE IF NOT EXISTS site_blocks (
  id SERIAL PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  title TEXT DEFAULT 'Site Temporarily Unavailable' NOT NULL,
  subtitle TEXT DEFAULT 'We are currently performing maintenance or updates.' NOT NULL,
  message TEXT DEFAULT 'Our team is working to bring the site back online as quickly as possible. Thank you for your patience.' NOT NULL,
  background_image_url TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  secondary_color TEXT DEFAULT '#0f172a',
  show_login_form BOOLEAN DEFAULT TRUE NOT NULL,
  login_form_title TEXT DEFAULT 'Admin Access',
  login_form_subtitle TEXT DEFAULT 'Enter your credentials to access the site',
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Insert default site block configuration
INSERT INTO site_blocks (
  is_enabled,
  title,
  subtitle,
  message,
  show_login_form,
  login_form_title,
  login_form_subtitle
) VALUES (
  FALSE,
  'Site Temporarily Unavailable',
  'We are currently performing maintenance or updates.',
  'Our team is working to bring the site back online as quickly as possible. Thank you for your patience.',
  TRUE,
  'Admin Access',
  'Enter your credentials to access the site'
) ON CONFLICT DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_blocks_enabled ON site_blocks(is_enabled);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_blocks_updated_at
  BEFORE UPDATE ON site_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_site_blocks_updated_at();
