import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/AuthContext';

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
  
  // Get auth context to check if user is admin
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // State to track the selected ad
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [eligibleAds, setEligibleAds] = useState<AdData[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  
  // When ads are loaded, prepare the eligible ads list
  useEffect(() => {
    console.log(`Advertisement component - Placement: ${placement}`, { 
      ads, 
      isAdmin, 
      user,
      adsCount: ads?.length || 0
    });
    
    if (ads && ads.length > 0) {
      // Log each ad received from the server
      ads.forEach(ad => {
        console.log(`Ad received: ID=${ad.id}, title=${ad.title}, isTest=${ad.isTest}, isApproved=${ad.isApproved}`);
      });
      
      // TEMPORARY CHANGE: Allow test ads to be visible to all users
      // This is just for development/testing - in production we would filter them
      // For now, we're showing all ads including test ads to everyone
      console.log("IMPORTANT: Showing test ads to all users for testing purposes");
      
      // Save the full list of eligible ads
      setEligibleAds(ads);
      console.log(`Eligible ads after filtering: ${ads.length}`);
      
      // If we have eligible ads, select the first one initially
      if (ads.length > 0) {
        const selected = ads[0];
        console.log(`Selected ad: ID=${selected.id}, title=${selected.title}`);
        setSelectedAd(selected);
        setCurrentAdIndex(0);
      } else {
        // No eligible ads available
        console.log('No eligible ads available after filtering');
        setSelectedAd(null);
        setCurrentAdIndex(0);
      }
    } else {
      console.log('No ads received from server');
      setSelectedAd(null);
      setEligibleAds([]);
      setCurrentAdIndex(0);
    }
  }, [ads, isAdmin]);
  
  // Cycle through ads every 20 seconds if there are multiple ads
  useEffect(() => {
    if (eligibleAds.length <= 1) return;
    
    // Set up the interval to rotate ads
    const rotationInterval = setInterval(() => {
      setCurrentAdIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % eligibleAds.length;
        const nextAd = eligibleAds[nextIndex];
        console.log(`Rotating to next ad: ID=${nextAd.id}, title=${nextAd.title}, index=${nextIndex}`);
        setSelectedAd(nextAd);
        return nextIndex;
      });
    }, 20000); // 20 seconds rotation
    
    return () => clearInterval(rotationInterval);
  }, [eligibleAds]);

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

  // Debugging info for component rendering states
  console.log('Advertisement render state:', { 
    isLoading, 
    hasError: !!error, 
    hasSelectedAd: !!selectedAd,
    selectedAdId: selectedAd?.id,
    selectedAdTitle: selectedAd?.title,
    placement
  });

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse rounded-md ${className}`} style={{ minHeight: '100px' }}>
        <div className="p-2 text-sm text-gray-500">Loading ad...</div>
      </div>
    );
  }

  if (error) {
    console.error('Advertisement error:', error);
    return (
      <div className={`bg-gray-100 rounded-md ${className}`} style={{ minHeight: '50px' }}>
        <div className="p-2 text-xs text-gray-500">Ad error: {(error as any)?.message || 'Unknown error'}</div>
      </div>
    );
  }

  if (!selectedAd) {
    return (
      <div className={`bg-gray-100 rounded-md ${className}`} style={{ minHeight: '50px' }}>
        <div className="p-2 text-xs text-gray-500">No advertisements available</div>
      </div>
    );
  }

  // Determine if this is a test ad
  const isTestAd = selectedAd.isTest === true || 
                  (selectedAd.adminNotes && selectedAd.adminNotes.toLowerCase().includes('test'));
  
  return (
    <div className={`advertisement ${className} border ${isTestAd ? 'border-amber-400' : 'border-gray-200'} rounded-md overflow-hidden relative`}>
      {isTestAd && (
        <div className="absolute top-0 right-0 bg-amber-400 text-xs px-2 py-1 z-10 text-black font-semibold">
          Test Ad
        </div>
      )}
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