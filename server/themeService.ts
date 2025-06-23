import { db } from "./db";
import { eq, and, isNull, desc, sql, or, like, not, inArray, asc } from "drizzle-orm";

export interface Theme {
  id: number;
  name: string;
  display_name: string;
  description: string;
  css_variables: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTheme {
  id: number;
  user_id: number;
  theme_id: number;
  created_at: string;
  updated_at: string;
}

export class ThemeService {
  // In-memory storage for user themes (since we're not using database)
  private userThemes: Map<number, string> = new Map();

  // Get all active themes - simplified to always use hardcoded themes
  async getActiveThemes(): Promise<Theme[]> {
    try {
      console.log('ThemeService: Returning hardcoded themes');
      return this.getHardcodedThemes();
    } catch (error) {
      console.error('Error getting active themes:', error);
      return this.getHardcodedThemes();
    }
  }

  // Hardcoded themes - always available
  private getHardcodedThemes(): Theme[] {
    return [
      {
        id: 1,
        name: 'default',
        display_name: 'Default',
        description: 'The standard StemSpaceHub theme with modern dark design',
        css_variables: JSON.stringify({
          "--bg-primary": "#0D0D17",
          "--bg-secondary": "#14141E", 
          "--bg-tertiary": "#1E1E2D",
          "--text-primary": "#FFFFFF",
          "--text-secondary": "#E5E7EB",
          "--text-muted": "#9CA3AF",
          "--accent-primary": "#8B5CF6",
          "--accent-secondary": "#7C3AED",
          "--border-primary": "#374151",
          "--border-secondary": "#4B5563",
          "--font-family": "Inter, system-ui, sans-serif",
          "--font-weight": "normal"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'apollo',
        display_name: 'Apollo-Era Analog Mode',
        description: '1960s-1970s NASA mission control aesthetic with green CRT monitors and retro tech',
        css_variables: JSON.stringify({
          "--bg-primary": "#000000",
          "--bg-secondary": "#001100", 
          "--bg-tertiary": "#002200",
          "--text-primary": "#00FF00",
          "--text-secondary": "#00CC00",
          "--text-muted": "#008800",
          "--accent-primary": "#00FF00",
          "--accent-secondary": "#00CC00",
          "--border-primary": "#004400",
          "--border-secondary": "#006600",
          "--font-family": "Courier, monospace",
          "--font-weight": "bold",
          "--scan-lines": "1",
          "--crt-effect": "1",
          "--mission-control": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'cyberpunk',
        display_name: 'Cyberpunk Space',
        description: '1980s-1990s futurism with neon grids and synthwave aesthetics',
        css_variables: JSON.stringify({
          "--bg-primary": "#0A0A0F",
          "--bg-secondary": "#1A1A2E", 
          "--bg-tertiary": "#16213E",
          "--text-primary": "#FF00FF",
          "--text-secondary": "#00FFFF",
          "--text-muted": "#FF69B4",
          "--accent-primary": "#FF00FF",
          "--accent-secondary": "#00FFFF",
          "--border-primary": "#FF1493",
          "--border-secondary": "#00CED1",
          "--font-family": "Orbitron, monospace",
          "--font-weight": "bold",
          "--neon-glow": "1",
          "--glitch-effect": "1",
          "--grid-overlay": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'space-odyssey',
        display_name: '2001: A Space Odyssey',
        description: 'Stanley Kubrick minimalist aesthetic with HAL 9000 red accents',
        css_variables: JSON.stringify({
          "--bg-primary": "#FFFFFF",
          "--bg-secondary": "#F8F9FA", 
          "--bg-tertiary": "#E9ECEF",
          "--text-primary": "#000000",
          "--text-secondary": "#212529",
          "--text-muted": "#6C757D",
          "--accent-primary": "#DC3545",
          "--accent-secondary": "#C82333",
          "--border-primary": "#DEE2E6",
          "--border-secondary": "#CED4DA",
          "--font-family": "Eurostile, Arial, sans-serif",
          "--font-weight": "normal",
          "--minimal": "1",
          "--hal-9000": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        name: 'alien-computer',
        display_name: 'Alien Computer Interface',
        description: 'Inspired by the Alien movie series computer systems with biomechanical aesthetics',
        css_variables: JSON.stringify({
          "--bg-primary": "#1A0F1A",
          "--bg-secondary": "#2D1B2D", 
          "--bg-tertiary": "#3D273D",
          "--text-primary": "#E6E6FA",
          "--text-secondary": "#D8BFD8",
          "--text-muted": "#9370DB",
          "--accent-primary": "#FF69B4",
          "--accent-secondary": "#DA70D6",
          "--border-primary": "#4B0082",
          "--border-secondary": "#8A2BE2",
          "--font-family": "Consolas, monospace",
          "--font-weight": "normal",
          "--biomechanical": "1",
          "--alien-glow": "1",
          "--organic-curves": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 6,
        name: 'mars-colony',
        display_name: 'Mars Colony',
        description: 'Near-future sci-fi with dusty red/white color scheme inspired by The Martian',
        css_variables: JSON.stringify({
          "--bg-primary": "#8B4513",
          "--bg-secondary": "#CD853F", 
          "--bg-tertiary": "#DEB887",
          "--text-primary": "#FFFFFF",
          "--text-secondary": "#F5F5DC",
          "--text-muted": "#D2B48C",
          "--accent-primary": "#DC143C",
          "--accent-secondary": "#B22222",
          "--border-primary": "#A0522D",
          "--border-secondary": "#CD853F",
          "--font-family": "Helvetica, Arial, sans-serif",
          "--font-weight": "bold",
          "--dust-texture": "1",
          "--mars-atmosphere": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 7,
        name: 'blade-runner',
        display_name: 'Blade Runner',
        description: 'Neo-noir cyberpunk aesthetic with rain effects and neon reflections',
        css_variables: JSON.stringify({
          "--bg-primary": "#0A0A0A",
          "--bg-secondary": "#1A1A1A", 
          "--bg-tertiary": "#2A2A2A",
          "--text-primary": "#FFD700",
          "--text-secondary": "#FFA500",
          "--text-muted": "#808080",
          "--accent-primary": "#FFD700",
          "--accent-secondary": "#FFA500",
          "--border-primary": "#333333",
          "--border-secondary": "#444444",
          "--font-family": "Courier New, monospace",
          "--font-weight": "normal",
          "--rain-effect": "1",
          "--neon-reflection": "1",
          "--neo-noir": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 8,
        name: 'interstellar',
        display_name: 'Interstellar',
        description: 'Space exploration theme with wormhole effects and cosmic colors',
        css_variables: JSON.stringify({
          "--bg-primary": "#000033",
          "--bg-secondary": "#000066", 
          "--bg-tertiary": "#000099",
          "--text-primary": "#FFFFFF",
          "--text-secondary": "#E6E6FA",
          "--text-muted": "#B0C4DE",
          "--accent-primary": "#00FFFF",
          "--accent-secondary": "#4169E1",
          "--border-primary": "#191970",
          "--border-secondary": "#483D8B",
          "--font-family": "Arial, sans-serif",
          "--font-weight": "normal",
          "--wormhole-effect": "1",
          "--cosmic-particles": "1",
          "--space-time": "1"
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Get theme by name
  async getThemeByName(name: string): Promise<Theme | null> {
    try {
      const themes = this.getHardcodedThemes();
      return themes.find(theme => theme.name === name) || null;
    } catch (error) {
      console.error('Error getting theme by name:', error);
      return null;
    }
  }

  // Get user's current theme - now properly returns stored theme
  async getUserTheme(userId: number): Promise<Theme | null> {
    try {
      // Get the user's stored theme name
      const userThemeName = this.userThemes.get(userId) || 'default';
      console.log(`ThemeService: Getting theme for user ${userId} - returning ${userThemeName}`);
      
      // Return the actual theme object
      return await this.getThemeByName(userThemeName);
    } catch (error) {
      console.error('Error getting user theme:', error);
      return await this.getThemeByName('default');
    }
  }

  // Set user's theme - now properly stores the theme preference
  async setUserTheme(userId: number, themeName: string): Promise<boolean> {
    try {
      const theme = await this.getThemeByName(themeName);
      if (!theme) {
        console.error(`ThemeService: Theme ${themeName} not found`);
        return false;
      }

      // Store the user's theme preference
      this.userThemes.set(userId, themeName);
      console.log(`ThemeService: User ${userId} theme set to ${themeName}`);
      return true;
    } catch (error) {
      console.error('Error setting user theme:', error);
      return false;
    }
  }

  // Reset user's theme to default
  async resetUserTheme(userId: number): Promise<boolean> {
    try {
      // Remove the user's theme preference (will default to 'default')
      this.userThemes.delete(userId);
      console.log(`ThemeService: User ${userId} theme reset to default`);
      return true;
    } catch (error) {
      console.error('Error resetting user theme:', error);
      return false;
    }
  }

  // Get theme CSS variables as object
  parseCssVariables(cssVariables: string): Record<string, string> {
    try {
      return JSON.parse(cssVariables);
    } catch (error) {
      console.error('Error parsing CSS variables:', error);
      return {};
    }
  }

  // Validate theme name
  isValidThemeName(name: string): boolean {
    const validThemes = ['default', 'apollo', 'cyberpunk', 'space-odyssey', 'alien-computer', 'mars-colony', 'blade-runner', 'interstellar'];
    return validThemes.includes(name);
  }
} 