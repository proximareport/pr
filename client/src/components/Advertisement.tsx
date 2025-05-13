import React, { useEffect, useState } from 'react';
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
  isTest?: boolean;
  adminNotes?: string;
}

interface AdvertisementProps {
  placement: string;
  className?: string;
}

const Advertisement: React.FC<AdvertisementProps> = ({ placement, className = '' }) => {
  const { data: ads, isLoading, error } = useQuery<AdData[]>({
    queryKey: [`/api/advertisements/${placement}`],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // State to track the selected ad
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  
  // When ads are loaded, select one randomly - filtering out test ads
  useEffect(() => {
    if (ads && ads.length > 0) {
      // Filter out test advertisements for regular users
      const eligibleAds = ads.filter(ad => {
        // Make sure we don't display test ads to regular users
        const isTestAd = ad.isTest === true || 
                         (ad.adminNotes && ad.adminNotes.toLowerCase().includes('test'));
        
        // Only show ads that are not test ads
        return !isTestAd;
      });
      
      // If we have eligible ads, select one randomly
      if (eligibleAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * eligibleAds.length);
        setSelectedAd(eligibleAds[randomIndex]);
      } else {
        // No eligible ads available
        setSelectedAd(null);
      }
    } else {
      setSelectedAd(null);
    }
  }, [ads]);

  // Record impression when the ad is viewed
  useEffect(() => {
    if (selectedAd?.id) {
      apiRequest('POST', `/api/advertisements/${selectedAd.id}/impression`, {})
        .catch(err => console.error('Failed to record impression:', err));
    }
  }, [selectedAd?.id]);

  const handleClick = async () => {
    if (selectedAd?.id) {
      try {
        await apiRequest('POST', `/api/advertisements/${selectedAd.id}/click`, {});
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

  if (error || !selectedAd) {
    return null; // Don't show anything if there's an error or no ad
  }

  return (
    <div className={`advertisement ${className} border border-gray-200 rounded-md overflow-hidden`}>
      <a 
        href={selectedAd.linkUrl} 
        target="_blank" 
        rel="noopener noreferrer sponsored" 
        onClick={handleClick}
        className="block relative"
      >
        {selectedAd.imageUrl ? (
          <div className="relative overflow-hidden">
            <img 
              src={selectedAd.imageUrl} 
              alt={selectedAd.title} 
              className="w-full h-auto object-cover transition-transform hover:scale-105"
            />
            <span className="absolute top-0 right-0 bg-gray-200 text-xs px-2 py-1 rounded-bl-md text-gray-600">
              {selectedAd.isTest ? 'Test Ad' : 'Ad'}
            </span>
          </div>
        ) : (
          <div className="p-4 text-center bg-gray-50">
            <h4 className="font-medium text-gray-800">{selectedAd.title}</h4>
            <p className="text-sm text-gray-600 mt-2">{selectedAd.description}</p>
            <span className="absolute top-0 right-0 bg-gray-200 text-xs px-2 py-1 rounded-bl-md text-gray-600">
              {selectedAd.isTest ? 'Test Ad' : 'Ad'}
            </span>
          </div>
        )}
      </a>
    </div>
  );
};

export default Advertisement;