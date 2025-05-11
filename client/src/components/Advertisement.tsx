import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AdData {
  id: number;
  title: string;
  description?: string;
  imageUrl: string | null;
  linkUrl: string;
  placement: string;
  startDate: string;
  endDate: string;
  isApproved: boolean;
  impressions: number;
  clicks: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface AdvertisementProps {
  placement: string;
  className?: string;
}

const Advertisement: React.FC<AdvertisementProps> = ({ placement, className = '' }) => {
  const { data: ad, isLoading, error } = useQuery({
    queryKey: [`/api/advertisements/${placement}`],
    staleTime: 60 * 1000, // 1 minute
  });

  // Record impression when the ad is viewed
  useEffect(() => {
    if (ad?.id) {
      apiRequest('POST', `/api/advertisements/${ad.id}/impression`, {});
    }
  }, [ad?.id]);

  const handleClick = async () => {
    if (ad?.id) {
      try {
        await apiRequest('POST', `/api/advertisements/${ad.id}/click`, {});
      } catch (err) {
        console.error('Failed to record click:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse rounded-md ${className}`} style={{ minHeight: '100px' }}></div>
    );
  }

  if (error || !ad) {
    return null; // Don't show anything if there's an error or no ad
  }

  return (
    <div className={`advertisement ${className} border border-gray-200 rounded-md overflow-hidden`}>
      <a 
        href={ad.linkUrl} 
        target="_blank" 
        rel="noopener noreferrer sponsored" 
        onClick={handleClick}
        className="block relative"
      >
        {ad.imageUrl ? (
          <div className="relative overflow-hidden">
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              className="w-full h-auto object-cover transition-transform hover:scale-105"
            />
            <span className="absolute top-0 right-0 bg-gray-200 text-xs px-2 py-1 rounded-bl-md text-gray-600">
              Ad
            </span>
          </div>
        ) : (
          <div className="p-4 text-center bg-gray-50">
            <h4 className="font-medium text-gray-800">{ad.title}</h4>
            <p className="text-sm text-gray-600 mt-2">{ad.description}</p>
            <span className="absolute top-0 right-0 bg-gray-200 text-xs px-2 py-1 rounded-bl-md text-gray-600">
              Ad
            </span>
          </div>
        )}
      </a>
    </div>
  );
};

export default Advertisement;