-- Mission Control Database Schema
-- This file contains all SQL statements for the Mission Control system

-- Create mission_control_sessions table to track active mission sessions
CREATE TABLE IF NOT EXISTS mission_control_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    mission_id VARCHAR(255) NOT NULL,
    mission_name VARCHAR(500) NOT NULL,
    agency VARCHAR(255) NOT NULL,
    launch_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'standby',
    description TEXT,
    vehicle VARCHAR(255),
    payload VARCHAR(255),
    destination VARCHAR(255),
    launch_site VARCHAR(255),
    live_stream_url TEXT,
    mission_patch_url TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    iss_feed_enabled BOOLEAN DEFAULT TRUE,
    admin_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Create mission_updates table to store real-time mission updates
CREATE TABLE IF NOT EXISTS mission_updates (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES mission_control_sessions(session_id) ON DELETE CASCADE,
    update_type VARCHAR(50) NOT NULL, -- 'status', 'technical', 'weather', 'milestone', 'general'
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mission_milestones table to track mission milestones
CREATE TABLE IF NOT EXISTS mission_milestones (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES mission_control_sessions(session_id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    time_offset VARCHAR(20) NOT NULL, -- e.g., "T-24:00:00", "T+00:02:00"
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- 'completed', 'current', 'upcoming', 'cancelled'
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mission_weather table to store weather data
CREATE TABLE IF NOT EXISTS mission_weather (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES mission_control_sessions(session_id) ON DELETE CASCADE,
    temperature DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    wind_direction VARCHAR(10),
    visibility DECIMAL(5,2),
    humidity DECIMAL(5,2),
    conditions VARCHAR(100),
    go_no_go VARCHAR(10) DEFAULT 'TBD', -- 'GO', 'NO-GO', 'TBD'
    weather_source VARCHAR(100),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mission_video_overlays table to store video overlay settings
CREATE TABLE IF NOT EXISTS mission_video_overlays (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES mission_control_sessions(session_id) ON DELETE CASCADE,
    overlay_type VARCHAR(50) NOT NULL, -- 'starting_soon', 'technical_difficulties', 'standby', 'maintenance', 'custom'
    custom_text TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mission_objectives table to store mission objectives
CREATE TABLE IF NOT EXISTS mission_objectives (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES mission_control_sessions(session_id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mission_crew table to store crew information
CREATE TABLE IF NOT EXISTS mission_crew (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES mission_control_sessions(session_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    agency VARCHAR(255),
    is_commander BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mission_control_sessions_session_id ON mission_control_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_mission_control_sessions_mission_id ON mission_control_sessions(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_control_sessions_admin_user_id ON mission_control_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_mission_control_sessions_expires_at ON mission_control_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_mission_updates_session_id ON mission_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_mission_updates_created_at ON mission_updates(created_at);
CREATE INDEX IF NOT EXISTS idx_mission_updates_update_type ON mission_updates(update_type);

CREATE INDEX IF NOT EXISTS idx_mission_milestones_session_id ON mission_milestones(session_id);
CREATE INDEX IF NOT EXISTS idx_mission_milestones_sort_order ON mission_milestones(sort_order);

CREATE INDEX IF NOT EXISTS idx_mission_weather_session_id ON mission_weather(session_id);
CREATE INDEX IF NOT EXISTS idx_mission_weather_recorded_at ON mission_weather(recorded_at);

CREATE INDEX IF NOT EXISTS idx_mission_video_overlays_session_id ON mission_video_overlays(session_id);
CREATE INDEX IF NOT EXISTS idx_mission_video_overlays_is_active ON mission_video_overlays(is_active);

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_mission_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM mission_control_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_mission_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mission_control_sessions_updated_at
    BEFORE UPDATE ON mission_control_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_mission_control_updated_at();

-- Insert some sample data for testing (optional)
-- INSERT INTO mission_control_sessions (session_id, mission_id, mission_name, agency, launch_date, status, description, vehicle, payload, destination, launch_site, admin_user_id)
-- VALUES ('test-session-1', 'test-mission-1', 'Test Mission', 'SpaceX', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'standby', 'Test mission for development', 'Falcon 9', 'Test Payload', 'LEO', 'Cape Canaveral', 1);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
