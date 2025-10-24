import { useAuth } from '@/lib/AuthContext';
import { isPaidTier } from '@/lib/tierMapping';

export type SubscriptionTier = 'free' | 'tier1' | 'tier2' | 'tier3';

export const useSubscriptionAccess = () => {
  const { user } = useAuth();
  const userTier = (user?.membershipTier as SubscriptionTier) || 'free';

  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (requiredTier === 'free') return true;
    if (!isPaidTier(userTier)) return false;
    
    switch (requiredTier) {
      case 'tier1':
        return userTier === 'tier1' || userTier === 'tier2' || userTier === 'tier3';
      case 'tier2':
        return userTier === 'tier2' || userTier === 'tier3';
      case 'tier3':
        return userTier === 'tier3';
      default:
        return false;
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    switch (feature) {
      case 'premium_themes':
      case 'no_ads':
      case 'profile_customization':
        return hasAccess('tier1');
      case 'proxihub_basic':
      case 'mission_control_basic':
        return hasAccess('tier1');
      case 'proxihub_advanced':
      case 'mission_control_advanced':
        return hasAccess('tier2');
      case 'comment_boosting':
      case 'work_in_progress':
      case 'special_badge':
      case 'priority_comments':
      case 'custom_art_upload':
      case 'exclusive_articles':
      case 'exclusive_themes':
        return hasAccess('tier3');
      // Free ProxiHub tools
      case 'space_fact_generator':
      case 'planet_name_generator':
      case 'space_mission_generator':
      case 'planet_calculator':
      case 'astronomy_data':
        return true; // Always available to all users
      default:
        return false;
    }
  };

  const getRequiredTier = (feature: string): SubscriptionTier => {
    switch (feature) {
      case 'premium_themes':
      case 'no_ads':
      case 'profile_customization':
      case 'proxihub_basic':
      case 'mission_control_basic':
        return 'tier1';
      case 'proxihub_advanced':
      case 'mission_control_advanced':
        return 'tier2';
      case 'comment_boosting':
      case 'work_in_progress':
      case 'special_badge':
      case 'priority_comments':
      case 'custom_art_upload':
      case 'exclusive_articles':
      case 'exclusive_themes':
        return 'tier3';
      // Free ProxiHub tools
      case 'space_fact_generator':
      case 'planet_name_generator':
      case 'space_mission_generator':
      case 'planet_calculator':
      case 'astronomy_data':
        return 'free';
      default:
        return 'free';
    }
  };

  return {
    userTier,
    hasAccess,
    canAccessFeature,
    getRequiredTier,
    isPaidUser: isPaidTier(userTier),
  };
};
