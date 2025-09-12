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
  compact?: boolean;
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
  className = '',
  compact = false
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
      <div className="filter blur-[1px] pointer-events-none select-none opacity-60">
        {children}
      </div>
      
      {/* Overlay with higher z-index to avoid ad conflicts */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg z-[9999] ${compact ? 'p-2' : 'p-8 pt-16'}`}>
        <Card className={`w-full mx-auto border-2 border-dashed border-purple-500/50 bg-gray-900/95 backdrop-blur-sm shadow-2xl relative z-[9999] ${compact ? 'max-w-xs' : 'max-w-md max-h-[80vh] overflow-y-auto'}`}>
          <CardHeader className={`text-center ${compact ? 'pb-2' : 'pb-4'}`}>
            <div className={`mx-auto ${compact ? 'mb-2 p-2' : 'mb-4 p-4'} rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg`}>
              <LockIcon className={`${compact ? 'h-4 w-4' : 'h-8 w-8'} text-white`} />
            </div>
            <CardTitle className={`${compact ? 'text-sm' : 'text-2xl'} font-bold text-white ${compact ? 'mb-1' : 'mb-2'}`}>
              {compact ? 'Premium' : 'Premium Feature'}
            </CardTitle>
            <CardDescription className={`${compact ? 'text-xs' : 'text-lg'} text-gray-200 font-medium`}>
              {featureName}
            </CardDescription>
            {description && !compact && (
              <CardDescription className="text-gray-400 text-sm mt-3 leading-relaxed">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className={`text-center ${compact ? 'space-y-2 pt-1' : 'space-y-6 pt-2'}`}>
            <div className={`flex items-center justify-center ${compact ? 'gap-1' : 'gap-3'}`}>
              <IconComponent className={`${compact ? 'h-3 w-3' : 'h-6 w-6'} ${tierColor.replace('bg-', 'text-')}`} />
              <Badge variant="outline" className={`border-purple-500/50 text-purple-300 bg-purple-900/20 ${compact ? 'px-1 py-0.5 text-xs' : 'px-3 py-1'}`}>
                {compact ? requiredTierName : `${requiredTierName} Required`}
              </Badge>
            </div>
            
            {showUpgrade && (
              <div className={compact ? 'space-y-1' : 'space-y-4'}>
                {!compact && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Upgrade to <span className="text-purple-300 font-medium">{requiredTierName}</span> to unlock this feature
                  </p>
                )}
                <Link to="/pricing">
                  <Button className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${compact ? 'py-1 text-xs' : 'py-3 transform hover:scale-105'}`}>
                    {compact ? 'Upgrade' : 'View Pricing Plans'}
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
