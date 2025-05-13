-- Add home_categories column to site_settings table
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS home_categories TEXT[] DEFAULT ARRAY['space', 'science', 'technology', 'astronomy'];