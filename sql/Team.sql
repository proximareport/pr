-- Team Members Table
-- This table stores information about team members displayed on the About page

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Optional: link to existing user account
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  is_founder BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  expertise TEXT[], -- Array of expertise areas
  social_linkedin VARCHAR(255),
  social_twitter VARCHAR(255),
  social_email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  UNIQUE(user_id) -- Ensure one team member entry per user
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_founder ON team_members(is_founder);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Insert sample founder data (can be removed after testing)
INSERT INTO team_members (name, role, bio, is_founder, display_order, expertise, social_email) VALUES
('Dr. Sarah Chen', 'Founder & CEO', 'Former NASA engineer with 15 years of experience in space technology. PhD in Astrophysics from MIT. Led mission planning for Mars rover operations and pioneered new approaches to space data visualization.', TRUE, 1, ARRAY['Space Technology', 'Astrophysics', 'Mission Planning', 'Leadership'], 'sarah@proximareport.com'),
('Michael Rodriguez', 'Co-Founder & CTO', 'Lead developer with expertise in real-time data systems and space APIs. Former SpaceX software engineer who helped build Falcon 9 telemetry systems. MS in Computer Science from Stanford.', TRUE, 2, ARRAY['Full-Stack Development', 'Data Systems', 'API Integration', 'System Architecture'], 'michael@proximareport.com'),
('Dr. Elena Vasquez', 'Co-Founder & Chief Science Officer', 'Renowned astrophysicist and former ESA mission scientist. Led the science team for the ExoMars mission and has published over 50 papers on planetary science. PhD in Planetary Science from Caltech.', TRUE, 3, ARRAY['Planetary Science', 'Mission Science', 'Research', 'Space Policy'], 'elena@proximareport.com')
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_member_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_team_member_updated_at_trigger ON team_members;
CREATE TRIGGER update_team_member_updated_at_trigger
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_member_updated_at(); 