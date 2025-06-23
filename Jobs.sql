-- Jobs.sql
-- SQL schema for job listings functionality

-- Create job_listings table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  salary VARCHAR(100),
  application_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT FALSE,
  category VARCHAR(100) NOT NULL DEFAULT 'general'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_listings_user_id ON job_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_approved ON job_listings(is_approved);
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON job_listings(category);
CREATE INDEX IF NOT EXISTS idx_job_listings_created_at ON job_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_expires_at ON job_listings(expires_at);

-- Create composite index for active approved jobs
CREATE INDEX IF NOT EXISTS idx_job_listings_active ON job_listings(is_approved, expires_at) 
WHERE is_approved = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- Add some sample job categories (optional)
-- These can be used for filtering and organization
COMMENT ON COLUMN job_listings.category IS 'Job category: engineering, science, research, management, operations, internship, etc.';

-- Add constraints
ALTER TABLE job_listings 
ADD CONSTRAINT chk_job_listings_title_length CHECK (length(title) >= 3),
ADD CONSTRAINT chk_job_listings_company_length CHECK (length(company) >= 2),
ADD CONSTRAINT chk_job_listings_description_length CHECK (length(description) >= 10);

-- Add a trigger to automatically set expires_at if not provided (default 90 days)
CREATE OR REPLACE FUNCTION set_default_job_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_default_job_expiry
  BEFORE INSERT ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION set_default_job_expiry(); 