import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Lock, Zap, Star, Crown } from 'lucide-react';
import { PremiumAccess } from '@/components/PremiumAccess';

interface DiscordInProgressProps {
  className?: string;
}

export const DiscordInProgress: React.FC<DiscordInProgressProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscriptionAccess();

  const hasAccess = canAccessFeature('work_in_progress');

  const inProgressFeatures = [
    {
      name: "Real-time Space Mission Tracking",
      description: "Live updates on active space missions with real-time data feeds",
      status: "In Development",
      progress: 75,
      tier: "tier3"
    },
    {
      name: "AI-Powered Space News Summaries",
      description: "AI-generated summaries of complex space news for quick understanding",
      status: "In Development", 
      progress: 60,
      tier: "tier3"
    },
    {
      name: "Interactive 3D Solar System",
      description: "Explore the solar system in 3D with real planetary positions",
      status: "In Development",
      progress: 40,
      tier: "tier2"
    },
    {
      name: "Space Weather Alerts",
      description: "Get notified about solar flares, geomagnetic storms, and space weather",
      status: "In Development",
      progress: 30,
      tier: "tier1"
    },
    {
      name: "Community Space Challenges",
      description: "Participate in space-themed challenges and competitions",
      status: "In Development",
      progress: 20,
      tier: "tier2"
    }
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'tier1': return <Star className="h-4 w-4 text-blue-400" />;
      case 'tier2': return <Zap className="h-4 w-4 text-purple-400" />;
      case 'tier3': return <Crown className="h-4 w-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'tier1': return 'Tier 1+';
      case 'tier2': return 'Tier 2+';
      case 'tier3': return 'Tier 3+';
      default: return 'All Tiers';
    }
  };

  return (
    <PremiumAccess
      requiredTier="tier3"
      featureName="Discord In-Progress Features"
      description="Access to exclusive Discord channels with work-in-progress features"
      className={className}
    >
      <Card className="border-white/10 bg-[#14141E]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Work in Progress Features
          </CardTitle>
          <CardDescription>
            Get early access to features being developed and provide feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAccess ? (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Discord In-Progress Features</p>
              <p className="text-sm text-gray-500">
                This feature requires Tier 3 Supporter membership
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-white/80 mb-4">
                  Join our Discord server to get early access to these features and provide feedback!
                </p>
                <Button 
                  asChild
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <a 
                    href="https://discord.gg/proximareport" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Join Discord Server
                  </a>
                </Button>
              </div>

              <div className="space-y-4">
                {inProgressFeatures.map((feature, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{feature.name}</h4>
                        <p className="text-sm text-white/70 mb-3">{feature.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getTierIcon(feature.tier)}
                        <Badge variant="outline" className="text-xs">
                          {getTierName(feature.tier)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-white/60">
                        <span>{feature.status}</span>
                        <span>{feature.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${feature.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  Features are released to Discord members first before public release
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PremiumAccess>
  );
};
