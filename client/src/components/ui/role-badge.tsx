import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CrownIcon, ShieldCheckIcon, PenToolIcon, UserIcon, StarIcon, SparklesIcon } from 'lucide-react';
import { mapDatabaseTierToFrontend } from '@/lib/tierMapping';

interface RoleBadgeProps {
  role?: string;
  membershipTier?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function RoleBadge({ 
  role = 'user', 
  membershipTier = 'free', 
  size = 'md', 
  showIcon = true,
  className = ''
}: RoleBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 h-5',
    md: 'text-xs px-2 py-1 h-6',
    lg: 'text-sm px-2.5 py-1 h-7'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  };

  // Role badges (highest priority)
  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return {
          label: 'ADMIN',
          className: 'bg-red-600 hover:bg-red-700 text-white border-none',
          icon: ShieldCheckIcon
        };
      case 'editor':
        return {
          label: 'EDITOR',
          className: 'bg-orange-600 hover:bg-orange-700 text-white border-none',
          icon: PenToolIcon
        };
      case 'author':
        return {
          label: 'AUTHOR',
          className: 'bg-blue-600 hover:bg-blue-700 text-white border-none',
          icon: PenToolIcon
        };
      default:
        return null;
    }
  };

  // Membership tier badges (secondary priority)
  const getMembershipBadge = () => {
    switch (membershipTier) {
      case 'pro':
        return {
          label: 'PRO',
          className: 'bg-purple-600 hover:bg-purple-700 text-white border-none',
          icon: CrownIcon
        };
      case 'supporter':
        return {
          label: 'SUPPORTER',
          className: 'bg-purple-700/80 hover:bg-purple-600 text-white border-none',
          icon: StarIcon
        };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();
  const membershipBadge = getMembershipBadge();

  // Priority: Role badges first, then membership badges
  const primaryBadge = roleBadge || membershipBadge;

  if (!primaryBadge) return null;

  const IconComponent = primaryBadge.icon;

  return (
    <Badge 
      className={`${sizeClasses[size]} ${primaryBadge.className} ${className} flex items-center gap-1 font-semibold`}
    >
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} />
      )}
      {primaryBadge.label}
    </Badge>
  );
}

// Helper component for multiple badges (role + membership)
export function RoleBadges({ 
  role = 'user', 
  membershipTier = 'free', 
  size = 'md', 
  showIcon = true,
  className = '',
  showAll = false
}: RoleBadgeProps & { showAll?: boolean }) {
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 h-5',
    md: 'text-xs px-2 py-1 h-6',
    lg: 'text-sm px-2.5 py-1 h-7'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  };

  const badges = [];

  // Always show role badge if not user
  if (role && role !== 'user') {
    let roleConfig;
    switch (role) {
      case 'admin':
        roleConfig = {
          label: 'ADMIN',
          className: 'bg-red-600 hover:bg-red-700 text-white border-none',
          icon: ShieldCheckIcon
        };
        break;
      case 'editor':
        roleConfig = {
          label: 'EDITOR',
          className: 'bg-orange-600 hover:bg-orange-700 text-white border-none',
          icon: PenToolIcon
        };
        break;
      case 'author':
        roleConfig = {
          label: 'AUTHOR',
          className: 'bg-blue-600 hover:bg-blue-700 text-white border-none',
          icon: PenToolIcon
        };
        break;
    }

    if (roleConfig) {
      const IconComponent = roleConfig.icon;
      badges.push(
        <Badge 
          key="role"
          className={`${sizeClasses[size]} ${roleConfig.className} ${className} flex items-center gap-1 font-semibold`}
        >
          {showIcon && IconComponent && (
            <IconComponent className={iconSizes[size]} />
          )}
          {roleConfig.label}
        </Badge>
      );
    }
  }

  // Show membership badge if not free (and showAll is true or no role badge)
  if (membershipTier && membershipTier !== 'free' && (showAll || badges.length === 0)) {
    // Map database tier to frontend tier
    const frontendTier = mapDatabaseTierToFrontend(membershipTier as any);
    
    let membershipConfig;
    switch (frontendTier) {
      case 'pro':
        membershipConfig = {
          label: 'PRO',
          className: 'bg-purple-600 hover:bg-purple-700 text-white border-none',
          icon: CrownIcon
        };
        break;
      case 'supporter':
        membershipConfig = {
          label: 'SUPPORTER',
          className: 'bg-purple-700/80 hover:bg-purple-600 text-white border-none',
          icon: StarIcon
        };
        break;
      case 'enterprise':
        membershipConfig = {
          label: 'ENTERPRISE',
          className: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none',
          icon: SparklesIcon
        };
        break;
    }

    if (membershipConfig) {
      const IconComponent = membershipConfig.icon;
      badges.push(
        <Badge 
          key="membership"
          className={`${sizeClasses[size]} ${membershipConfig.className} ${className} flex items-center gap-1 font-semibold`}
        >
          {showIcon && IconComponent && (
            <IconComponent className={iconSizes[size]} />
          )}
          {membershipConfig.label}
        </Badge>
      );
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {badges}
    </div>
  );
} 