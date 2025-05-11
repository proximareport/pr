import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

interface SiteSettings {
  id: number;
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteKeywords: string[] | string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  googleAnalyticsId: string | null;
  facebookAppId: string | null;
  twitterUsername: string | null;
  contactEmail: string | null;
  allowComments: boolean;
  requireCommentApproval: boolean;
  allowUserRegistration: boolean;
  supporterTierPrice: number;
  proTierPrice: number;
  maintenanceMode: boolean;
  updatedAt: string;
  updatedBy: number;
}

export function useSiteSettings() {
  const { isAdmin } = useAuth();
  // We have direct access to isAdmin from the AuthContext

  const { data: settings, isLoading, error } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });

  // Only show maintenance mode if:
  // 1. Settings are loaded
  // 2. Maintenance mode is enabled
  // 3. User is not an admin
  const isMaintenanceMode = Boolean(settings?.maintenanceMode && !isAdmin);

  return {
    settings,
    isLoading,
    error,
    isMaintenanceMode
  };
}