import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

interface Theme {
  id: number;
  name: string;
  display_name: string;
  description: string;
  css_variables: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ThemeContextType {
  themes: Theme[];
  currentTheme: Theme | null;
  setTheme: (themeName: string) => Promise<void>;
  resetTheme: () => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Set default theme back to original
  const defaultThemeName = 'default';

  // Apply theme-specific effects
  const applyThemeEffects = useCallback((themeName: string) => {
    // Remove all existing effect classes
    document.body.classList.remove(
      'scan-lines', 'crt-effect', 'mission-control',
      'neon-glow', 'glitch-effect', 'grid-overlay',
      'minimal', 'hal-9000',
      'biomechanical', 'alien-glow', 'organic-curves',
      'dust-texture', 'mars-atmosphere',
      'rain-effect', 'neon-reflection', 'neo-noir',
      'wormhole-effect', 'cosmic-particles', 'space-time',
      'holographic', 'particle-field', 'neural-network', 'quantum-glow', 'temporal-shift'
    );

    // Add theme-specific effect classes
    switch (themeName) {
      case 'apollo':
        document.body.classList.add('scan-lines', 'crt-effect', 'mission-control');
        break;
      case 'cyberpunk':
        document.body.classList.add('neon-glow', 'glitch-effect', 'grid-overlay');
        break;
      case 'space-odyssey':
        document.body.classList.add('minimal', 'hal-9000');
        break;
      case 'alien-computer':
        document.body.classList.add('biomechanical', 'alien-glow', 'organic-curves');
        break;
      case 'mars-colony':
        document.body.classList.add('dust-texture', 'mars-atmosphere');
        break;
      case 'blade-runner':
        document.body.classList.add('rain-effect', 'neon-reflection', 'neo-noir');
        break;
      case 'interstellar':
        document.body.classList.add('wormhole-effect', 'cosmic-particles', 'space-time');
        break;
      case 'futuristic':
        document.body.classList.add('holographic', 'particle-field', 'neural-network', 'quantum-glow', 'temporal-shift');
        break;
    }
  }, []);

  // Apply theme classes to body element
  const applyThemeToBody = useCallback((themeName: string) => {
    // Remove all existing theme classes
    document.body.classList.remove(
      'theme-default',
      'theme-apollo',
      'theme-cyberpunk',
      'theme-space-odyssey',
      'theme-alien-computer',
      'theme-mars-colony',
      'theme-blade-runner',
      'theme-interstellar'
    );

    // Add the new theme class
    if (themeName && themeName !== 'default') {
      document.body.classList.add(`theme-${themeName}`);
    }

    // Apply theme-specific effects
    applyThemeEffects(themeName);
  }, [applyThemeEffects]);

  // Fetch available themes - memoized to prevent infinite calls
  const fetchThemes = useCallback(async () => {
    try {
      const response = await fetch('/api/themes');
      
      if (response.ok) {
        const themesData = await response.json();
        setThemes(themesData);
        return themesData;
      } else {
        console.error('ThemeContext: API response not ok:', response.status, response.statusText);
        setThemes([]);
        return [];
      }
    } catch (error) {
      console.error('ThemeContext: Error fetching themes:', error);
      setThemes([]);
      return [];
    }
  }, []);

  // Fetch current user theme
  const fetchCurrentTheme = useCallback(async () => {
    if (!user) {
      // Default theme for non-authenticated users
      const themes = await fetchThemes();
      const defaultTheme = themes.find((t: Theme) => t.name === 'default');
      setCurrentTheme(defaultTheme || null);
      applyThemeToBody(defaultTheme?.name || 'default');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/themes/current');
      if (response.ok) {
        const themeData = await response.json();
        setCurrentTheme(themeData);
        applyThemeToBody(themeData.name);
      } else {
        // Fallback to default theme
        const themes = await fetchThemes();
        const defaultTheme = themes.find((t: Theme) => t.name === 'default');
        setCurrentTheme(defaultTheme || null);
        applyThemeToBody(defaultTheme?.name || 'default');
      }
    } catch (error) {
      console.error('Error fetching current theme:', error);
      // Fallback to default theme
      const themes = await fetchThemes();
      const defaultTheme = themes.find((t: Theme) => t.name === 'default');
      setCurrentTheme(defaultTheme || null);
      applyThemeToBody(defaultTheme?.name || 'default');
    } finally {
      setLoading(false);
    }
  }, [user, fetchThemes, applyThemeToBody]);

  // Set theme
  const setTheme = useCallback(async (themeName: string) => {
    if (!user) {
      // For non-authenticated users, just apply the theme locally
      const themes = await fetchThemes();
      const theme = themes.find((t: Theme) => t.name === themeName);
      if (theme) {
        setCurrentTheme(theme);
        applyThemeToBody(themeName);
      }
      return;
    }

    try {
      const response = await fetch('/api/themes/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ themeName }),
      });

      if (response.ok) {
        const themes = await fetchThemes();
        const theme = themes.find((t: Theme) => t.name === themeName);
        if (theme) {
          setCurrentTheme(theme);
          applyThemeToBody(themeName);
        }
      } else {
        console.error('Failed to set theme');
      }
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }, [user, fetchThemes, applyThemeToBody]);

  // Reset theme to default
  const resetTheme = useCallback(async () => {
    if (!user) {
      // For non-authenticated users, just reset locally
      const themes = await fetchThemes();
      const defaultTheme = themes.find((t: Theme) => t.name === 'default');
      if (defaultTheme) {
        setCurrentTheme(defaultTheme);
        applyThemeToBody('default');
      }
      return;
    }

    try {
      const response = await fetch('/api/themes/reset', {
        method: 'POST',
      });

      if (response.ok) {
        const themes = await fetchThemes();
        const defaultTheme = themes.find((t: Theme) => t.name === 'default');
        if (defaultTheme) {
          setCurrentTheme(defaultTheme);
          applyThemeToBody('default');
        }
      } else {
        console.error('Failed to reset theme');
      }
    } catch (error) {
      console.error('Error resetting theme:', error);
    }
  }, [user, fetchThemes, applyThemeToBody]);

  // Load themes and set current theme
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const response = await fetch('/api/themes');
        if (response.ok) {
          const themesData = await response.json();
          setThemes(themesData);
          
          // Try to get user's saved theme, otherwise use futuristic as default
          if (user) {
            const userThemeResponse = await fetch('/api/themes/user');
            if (userThemeResponse.ok) {
              const userTheme = await userThemeResponse.json();
              if (userTheme && userTheme.theme) {
                setCurrentTheme(userTheme.theme);
                applyThemeToBody(userTheme.theme.name);
                return;
              }
            }
          }
          
          // Set futuristic theme as default
          const futuristicTheme = themesData.find((t: Theme) => t.name === defaultThemeName);
          if (futuristicTheme) {
            setCurrentTheme(futuristicTheme);
            applyThemeToBody(futuristicTheme.name);
          }
        }
      } catch (error) {
        console.error('Error loading themes:', error);
        // Fallback to hardcoded futuristic theme
        const fallbackTheme = {
          id: 9,
          name: 'futuristic',
          display_name: 'Futuristic',
          description: 'Modern sci-fi theme with holographic effects, particle fields, and quantum animations',
          css_variables: JSON.stringify({
            "--bg-primary": "#0A0A0F",
            "--bg-secondary": "#1A1A2E", 
            "--bg-tertiary": "#16213E",
            "--text-primary": "#FFFFFF",
            "--text-secondary": "#E5E7EB",
            "--text-muted": "#9CA3AF",
            "--accent-primary": "#00D4FF",
            "--accent-secondary": "#0099CC",
            "--border-primary": "#2A2A3E",
            "--border-secondary": "#3A3A4E",
            "--font-family": "Space Grotesk, Inter, sans-serif",
            "--font-weight": "500",
            "--holographic": "1",
            "--particle-field": "1",
            "--neural-network": "1",
            "--quantum-glow": "1",
            "--temporal-shift": "1"
          }),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentTheme(fallbackTheme);
        applyThemeToBody(fallbackTheme.name);
      } finally {
        setLoading(false);
      }
    };

    loadThemes();
  }, [user, applyThemeToBody]);

  const value: ThemeContextType = {
    themes,
    currentTheme,
    setTheme,
    resetTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 