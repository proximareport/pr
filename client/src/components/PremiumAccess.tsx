import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LockIcon, StarIcon, CrownIcon, ZapIcon } from 'lucide-react';
import { Link } from 'wouter';
import { mapDatabaseTierToFrontend, getTierDisplayName, isPaidTier } from '@/lib/tierMapping';

interface PremiumAccessProps {
  children: React.ReactNode;
  requiredTier?: 'tier1' | 'tier2' | 'tier3';
  featureName: string;
  description?: string;
  showUpgrade?: boolean;
  className?: string;
}

const tierIcons = {
  tier1: StarIcon,
  tier2: CrownIcon,
  tier3: ZapIcon,
};

const tierColors = {
  tier1: 'bg-blue-500',
  tier2: 'bg-purple-500',
  tier3: 'bg-gold-500',
};

export const PremiumAccess: React.FC<PremiumAccessProps> = ({
  children,
  requiredTier = 'tier1',
  featureName,
  description,
  showUpgrade = true,
  className = ''
}) => {
  const { user } = useAuth();
  const userTier = user?.membershipTier || 'free';
  const hasAccess = isPaidTier(userTier) && (
    requiredTier === 'tier1' || 
    (requiredTier === 'tier2' && (userTier === 'tier2' || userTier === 'tier3')) ||
    (requiredTier === 'tier3' && userTier === 'tier3')
  );

  if (hasAccess) {
    return <>{children}</>;
  }

  const IconComponent = tierIcons[requiredTier];
  const tierColor = tierColors[requiredTier];
  const requiredTierName = getTierDisplayName(requiredTier);

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
        <Card className="w-full max-w-md mx-4 border-2 border-dashed border-gray-600">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-gray-800">
              <LockIcon className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Premium Feature
            </CardTitle>
            <CardDescription className="text-gray-300">
              {featureName}
            </CardDescription>
            {description && (
              <CardDescription className="text-gray-400 text-sm mt-2">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <IconComponent className={`h-5 w-5 ${tierColor.replace('bg-', 'text-')}`} />
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {requiredTierName} Required
              </Badge>
            </div>
            
            {showUpgrade && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Upgrade to {requiredTierName} to unlock this feature
                </p>
                <Link to="/pricing">
                  <Button className="w-full">
                    View Pricing Plans
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumAccess;
