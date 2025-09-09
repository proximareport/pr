import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Star, ExternalLink } from 'lucide-react';
import { PremiumAccess } from '@/components/PremiumAccess';

interface ExclusiveArticlesProps {
  className?: string;
}

export const ExclusiveArticles: React.FC<ExclusiveArticlesProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { canAccessFeature } = useSubscriptionAccess();

  const hasAccess = canAccessFeature('exclusive_articles');

  const exclusiveArticles = [
    {
      title: "The Future of Mars Colonization: A Deep Dive",
      description: "Exclusive analysis of SpaceX's Mars mission plans and the technical challenges ahead",
      tier: "tier3",
      readTime: "12 min read",
      publishedAt: "2024-01-15",
      isNew: true
    },
    {
      title: "Behind the Scenes: James Webb Space Telescope's Latest Discoveries",
      description: "Insider access to JWST data analysis and upcoming mission targets",
      tier: "tier3", 
      readTime: "8 min read",
      publishedAt: "2024-01-12",
      isNew: false
    },
    {
      title: "The Economics of Space Mining: What Investors Need to Know",
      description: "Comprehensive market analysis of asteroid mining and space resource extraction",
      tier: "tier3",
      readTime: "15 min read", 
      publishedAt: "2024-01-10",
      isNew: false
    },
    {
      title: "Exclusive Interview: NASA's Chief Scientist on Climate Change from Space",
      description: "One-on-one discussion about Earth observation and climate monitoring",
      tier: "tier3",
      readTime: "20 min read",
      publishedAt: "2024-01-08",
      isNew: false
    },
    {
      title: "The Race to Europa: Mission Design and Scientific Objectives",
      description: "Detailed technical analysis of upcoming Europa Clipper mission",
      tier: "tier3",
      readTime: "18 min read",
      publishedAt: "2024-01-05",
      isNew: false
    }
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'tier3': return <Crown className="h-4 w-4 text-yellow-400" />;
      default: return <Star className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'Tier 3 Exclusive';
      default: return 'Exclusive';
    }
  };

  return (
    <PremiumAccess
      requiredTier="tier3"
      featureName="Exclusive Supporter Articles"
      description="Access to premium articles written exclusively for supporters"
      className={className}
    >
      <Card className="border-white/10 bg-[#14141E]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Exclusive Supporter Articles
          </CardTitle>
          <CardDescription>
            Premium content written exclusively for our Tier 3 supporters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasAccess ? (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Exclusive Supporter Articles</p>
              <p className="text-sm text-gray-500">
                This feature requires Tier 3 Supporter membership
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-purple-500/10 rounded-lg border border-yellow-500/20">
                <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Welcome to Exclusive Content
                </h3>
                <p className="text-sm text-white/80">
                  Access premium articles with in-depth analysis, exclusive interviews, and behind-the-scenes content
                </p>
              </div>

              <div className="space-y-3">
                {exclusiveArticles.map((article, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{article.title}</h4>
                          {article.isNew && (
                            <Badge className="bg-green-600 text-white text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/70 mb-2">{article.description}</p>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>{article.readTime}</span>
                          <span>•</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getTierIcon(article.tier)}
                        <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">
                          {getTierName(article.tier)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/10">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Read Article
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-white/60">
                  New exclusive articles are published weekly for Tier 3 supporters
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PremiumAccess>
  );
};
