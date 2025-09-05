import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Monitor, Zap, Star, Rocket, Globe, Bug, Film, Space, Lock } from 'lucide-react';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { Link } from 'wouter';

const themeIcons = {
  default: Monitor,
  apollo: Zap,
  cyberpunk: Star,
  'space-odyssey': Globe,
  'alien-computer': Bug,
  'mars-colony': Rocket,
  'blade-runner': Film,
  'interstellar': Space,
  'futuristic': Palette,
};

const themeDescriptions = {
  default: 'The standard StemSpaceHub theme with modern dark design',
  apollo: '1960s-1970s NASA mission control aesthetic with green CRT monitors',
  cyberpunk: '1980s-1990s futurism with neon grids and synthwave aesthetics',
  'space-odyssey': 'Stanley Kubrick minimalist aesthetic with HAL 9000 red accents',
  'alien-computer': 'Inspired by the Alien movie series computer systems with biomechanical aesthetics',
  'mars-colony': 'Near-future sci-fi with dusty red/white color scheme',
  'blade-runner': 'Neo-noir cyberpunk aesthetic with rain effects and neon reflections',
  'interstellar': 'Space exploration theme with wormhole effects and cosmic colors',
  'futuristic': 'Modern sci-fi theme with holographic effects and quantum animations',
};

// Premium themes that require subscription
const premiumThemes = ['apollo', 'cyberpunk', 'space-odyssey', 'alien-computer', 'mars-colony', 'blade-runner', 'interstellar', 'futuristic'];

export const ThemeSelector: React.FC = () => {
  const { currentTheme, themes, setTheme, resetTheme, loading } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const { canAccessFeature } = useSubscriptionAccess();

  // Debug logging
  console.log('ThemeSelector render:', {
    loading,
    currentTheme,
    themeCount: themes?.length,
    themes: themes
  });

  const handleThemeSelect = async (themeName: string) => {
    console.log('Selecting theme:', themeName);
    await setTheme(themeName);
  };

  const handlePreview = (themeName: string) => {
    setPreviewTheme(themeName);
  };

  const handlePreviewEnd = () => {
    setPreviewTheme(null);
  };

  const handleReset = async () => {
    console.log('Resetting theme');
    await resetTheme();
  };

  if (loading) {
    console.log('ThemeSelector: Loading state');
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <p className="ml-2">Loading themes...</p>
      </div>
    );
  }

  if (!themes || themes.length === 0) {
    console.log('ThemeSelector: No themes available');
    return (
      <div className="text-center p-8">
        <p className="text-red-500">No themes available. Please check the database.</p>
      </div>
    );
  }

  console.log('ThemeSelector: Rendering themes grid');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Site Themes</h2>
          <p className="text-muted-foreground">
            Choose your preferred visual theme for StemSpaceHub
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const IconComponent = themeIcons[theme.name as keyof typeof themeIcons] || Monitor;
          const isActive = currentTheme?.name === theme.name;
          const isPreviewing = previewTheme === theme.name;
          const isPremium = premiumThemes.includes(theme.name);
          const hasAccess = !isPremium || canAccessFeature('premium_themes');

          return (
            <Card
              key={theme.name}
              className={`relative transition-all duration-200 ${
                hasAccess ? 'cursor-pointer hover:shadow-lg' : 'opacity-60'
              } ${
                isActive ? 'ring-2 ring-accent-primary' : ''
              } ${isPreviewing ? 'ring-2 ring-accent-secondary' : ''}`}
              onClick={hasAccess ? () => handleThemeSelect(theme.name) : undefined}
              onMouseEnter={hasAccess ? () => handlePreview(theme.name) : undefined}
              onMouseLeave={hasAccess ? handlePreviewEnd : undefined}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-accent-primary" />
                    <CardTitle className="text-lg">{theme.display_name}</CardTitle>
                  </div>
                  {isActive && (
                    <Badge variant="default" className="bg-accent-primary">
                      Active
                    </Badge>
                  )}
                  {isPreviewing && !isActive && (
                    <Badge variant="secondary" className="bg-accent-secondary">
                      Preview
                    </Badge>
                  )}
                  {isPremium && !hasAccess && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                      <Lock className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-sm mb-3">
                  {themeDescriptions[theme.name as keyof typeof themeDescriptions] || theme.description}
                </CardDescription>
                
                <div className="flex space-x-2">
                  <div className="w-4 h-4 rounded-full bg-primary"></div>
                  <div className="w-4 h-4 rounded-full bg-secondary"></div>
                  <div className="w-4 h-4 rounded-full bg-accent-primary"></div>
                  <div className="w-4 h-4 rounded-full bg-accent-secondary"></div>
                </div>
                
                {isPremium && !hasAccess && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-center">
                    <p className="text-xs text-yellow-500 mb-2">
                      Premium theme - Subscribe to unlock
                    </p>
                    <Link to="/pricing">
                      <Button size="sm" variant="outline" className="text-xs">
                        View Plans
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Theme Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Apollo-Era Analog Mode</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Green CRT monitor aesthetic</li>
                <li>• Scan lines and retro effects</li>
                <li>• Mission Control sidebar</li>
                <li>• Typewriter fonts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cyberpunk Space</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Neon grid overlays</li>
                <li>• Glitch art effects</li>
                <li>• Synthwave color scheme</li>
                <li>• Hacker aesthetic</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2001: A Space Odyssey</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Minimalist white design</li>
                <li>• HAL 9000 red accents</li>
                <li>• Smooth animations</li>
                <li>• Clean typography</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Alien Computer Interface</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Biomechanical aesthetics</li>
                <li>• Organic curves and shapes</li>
                <li>• Alien glow effects</li>
                <li>• Dark purple color scheme</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mars Colony</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Dusty red atmosphere</li>
                <li>• Martian landscape colors</li>
                <li>• Weather effects</li>
                <li>• Colony aesthetic</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Blade Runner</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Neo-noir aesthetic</li>
                <li>• Rain effects</li>
                <li>• Neon reflections</li>
                <li>• Cyberpunk atmosphere</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Interstellar</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Deep space colors</li>
                <li>• Wormhole effects</li>
                <li>• Cosmic particles</li>
                <li>• Space-time distortions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Futuristic</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Modern sci-fi theme</li>
                <li>• Holographic effects</li>
                <li>• Quantum animations</li>
                <li>• High-tech interface</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Default Theme</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Clean modern design</li>
                <li>• Dark mode optimized</li>
                <li>• Professional appearance</li>
                <li>• High readability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 