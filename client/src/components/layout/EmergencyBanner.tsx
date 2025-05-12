import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AlertTriangleIcon, InfoIcon, AlertOctagonIcon } from 'lucide-react';

interface EmergencyBanner {
  id: number;
  message: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  createdBy: number;
}

function EmergencyBanner() {
  // Query for active banner
  const { data: banner, isLoading } = useQuery({
    queryKey: ['/api/emergency-banner'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/emergency-banner');
        return response.json();
      } catch (error) {
        console.error("Failed to fetch emergency banner:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // If no banner or loading, don't render anything
  if (isLoading || !banner) {
    return null;
  }

  // Get Banner Icon based on type
  const getBannerIcon = () => {
    switch (banner.type) {
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <AlertOctagonIcon className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get banner background color based on type
  const getBannerBackground = () => {
    switch (banner.type) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/50';
      case 'critical':
        return 'bg-red-500/10 border-red-500/50';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/50';
    }
  };

  return (
    <div className={`py-2 px-4 w-full border-b ${getBannerBackground()}`}>
      <div className="container mx-auto flex items-center">
        <div className="mr-3">
          {getBannerIcon()}
        </div>
        <div className="text-sm font-medium">{banner.message}</div>
      </div>
    </div>
  );
}

export default EmergencyBanner;