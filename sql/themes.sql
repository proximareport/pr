CREATE TABLE IF NOT EXISTS themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    css_variables TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_themes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    theme_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- Clear existing themes and insert updated ones
DELETE FROM themes;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('default', 'Default', 'The standard StemSpaceHub theme with modern dark design', '{"--bg-primary": "#0D0D17", "--bg-secondary": "#14141E", "--bg-tertiary": "#1E1E2D", "--text-primary": "#FFFFFF", "--text-secondary": "#E5E7EB", "--text-muted": "#9CA3AF", "--accent-primary": "#8B5CF6", "--accent-secondary": "#7C3AED", "--border-primary": "#374151", "--border-secondary": "#4B5563", "--font-family": "Inter, system-ui, sans-serif", "--font-weight": "normal"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('apollo', 'Apollo-Era Analog Mode', '1960s-1970s NASA mission control aesthetic with green CRT monitors and retro tech', '{"--bg-primary": "#000000", "--bg-secondary": "#001100", "--bg-tertiary": "#002200", "--text-primary": "#00FF00", "--text-secondary": "#00CC00", "--text-muted": "#008800", "--accent-primary": "#00FF00", "--accent-secondary": "#00CC00", "--border-primary": "#004400", "--border-secondary": "#006600", "--font-family": "Courier, monospace", "--font-weight": "bold", "--scan-lines": "1", "--crt-effect": "1", "--mission-control": "1"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('cyberpunk', 'Cyberpunk Space', '1980s-1990s futurism with neon grids and synthwave aesthetics', '{"--bg-primary": "#0A0A0F", "--bg-secondary": "#1A1A2E", "--bg-tertiary": "#16213E", "--text-primary": "#FF00FF", "--text-secondary": "#00FFFF", "--text-muted": "#FF69B4", "--accent-primary": "#FF00FF", "--accent-secondary": "#00FFFF", "--border-primary": "#FF1493", "--border-secondary": "#00CED1", "--font-family": "Orbitron, monospace", "--font-weight": "bold", "--neon-glow": "1", "--glitch-effect": "1", "--grid-overlay": "1"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('space-odyssey', '2001: A Space Odyssey', 'Stanley Kubrick minimalist aesthetic with HAL 9000 red accents', '{"--bg-primary": "#FFFFFF", "--bg-secondary": "#F8F9FA", "--bg-tertiary": "#E9ECEF", "--text-primary": "#000000", "--text-secondary": "#212529", "--text-muted": "#6C757D", "--accent-primary": "#DC3545", "--accent-secondary": "#C82333", "--border-primary": "#DEE2E6", "--border-secondary": "#CED4DA", "--font-family": "Eurostile, Arial, sans-serif", "--font-weight": "normal", "--minimal": "1", "--hal-9000": "1"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('alien-computer', 'Alien Computer Interface', 'Inspired by the Alien movie series computer systems with biomechanical aesthetics', '{"--bg-primary": "#1A0F1A", "--bg-secondary": "#2D1B2D", "--bg-tertiary": "#3D273D", "--text-primary": "#E6E6FA", "--text-secondary": "#D8BFD8", "--text-muted": "#9370DB", "--accent-primary": "#FF69B4", "--accent-secondary": "#DA70D6", "--border-primary": "#4B0082", "--border-secondary": "#8A2BE2", "--font-family": "Consolas, monospace", "--font-weight": "normal", "--biomechanical": "1", "--alien-glow": "1", "--organic-curves": "1"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('mars-colony', 'Mars Colony', 'Near-future sci-fi with dusty red/white color scheme inspired by The Martian', '{"--bg-primary": "#8B4513", "--bg-secondary": "#CD853F", "--bg-tertiary": "#DEB887", "--text-primary": "#FFFFFF", "--text-secondary": "#F5F5DC", "--text-muted": "#D2B48C", "--accent-primary": "#DC143C", "--accent-secondary": "#B22222", "--border-primary": "#A0522D", "--border-secondary": "#CD853F", "--font-family": "Helvetica, Arial, sans-serif", "--font-weight": "bold", "--dust-texture": "1", "--mars-atmosphere": "1"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('blade-runner', 'Blade Runner', 'Neo-noir cyberpunk aesthetic with rain effects and neon reflections', '{"--bg-primary": "#0A0A0A", "--bg-secondary": "#1A1A1A", "--bg-tertiary": "#2A2A2A", "--text-primary": "#FFD700", "--text-secondary": "#FFA500", "--text-muted": "#808080", "--accent-primary": "#FFD700", "--accent-secondary": "#FFA500", "--border-primary": "#333333", "--border-secondary": "#444444", "--font-family": "Courier New, monospace", "--font-weight": "normal", "--rain-effect": "1", "--neon-reflection": "1", "--neo-noir": "1"}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO themes (name, display_name, description, css_variables) VALUES
('interstellar', 'Interstellar', 'Space exploration theme with wormhole effects and cosmic colors', '{"--bg-primary": "#000033", "--bg-secondary": "#000066", "--bg-tertiary": "#000099", "--text-primary": "#FFFFFF", "--text-secondary": "#E6E6FA", "--text-muted": "#B0C4DE", "--accent-primary": "#00FFFF", "--accent-secondary": "#4169E1", "--border-primary": "#191970", "--border-secondary": "#483D8B", "--font-family": "Arial, sans-serif", "--font-weight": "normal", "--wormhole-effect": "1", "--cosmic-particles": "1", "--space-time": "1"}')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active); 