import React, { useEffect, useState } from 'react';
import { useGoogleAds } from './GoogleAdsProvider';
import { useAuth } from '@/lib/AuthContext';

interface AdPlacementProps {
  type: 'banner' | 'sidebar' | 'in-content' | 'article-top' | 'article-bottom' | 'homepage-hero' | 'homepage-grid';
  className?: string;
  style?: React.CSSProperties;
}

// Ad slot IDs - Your actual ad slot IDs from Google AdSense
const AD_SLOTS = {
  'banner': '6196809818',
  'sidebar': '6196809818',
  'in-content': '8790618913',
  'article-top': '8790618913',
  'article-bottom': '8790618913',
  'homepage-hero': '6196809818',
  'homepage-grid': '1889350405',
};

export const AdPlacement: React.FC<AdPlacementProps> = ({ type, className = '', style = {} }) => {
  const { isGoogleAdsLoaded, consentGiven, isAdBlocked } = useGoogleAds();
  const { user } = useAuth();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user has Pro subscription (should block ads)
  const isProSubscriber = user?.membershipTier === 'pro';

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isGoogleAdsLoaded && consentGiven && !adLoaded && !isAdBlocked && !isProSubscriber) {
      // Faster loading for mobile, slightly longer for desktop
      const delay = isMobile ? 200 : 300;
      
      const timer = setTimeout(() => {
        try {
          // Check if ad already exists
          const container = document.querySelector(`.ad-placement.ad-${type}`) as HTMLElement;
          if (container) {
            const existingAd = container.querySelector('.adsbygoogle');
            if (existingAd) {
              const hasGoogleAd = existingAd.querySelector('[id^="aswift_"], [id^="google_ads_"]');
              if (hasGoogleAd) {
                setAdLoaded(true);
                return;
              }
            }
          }
          
          // Load the ad
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
          
        } catch (error) {
          setAdError(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isGoogleAdsLoaded, consentGiven, adLoaded, isAdBlocked, isProSubscriber, type, isMobile]);

  // Don't show ads if ad blocker is detected
  if (isAdBlocked) {
    return (
      <div className={`bg-red-800 border border-red-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-red-200 text-sm">
          Ad blocker detected - Please disable to support our content
        </p>
      </div>
    );
  }

  // Don't show ads if consent not given
  if (!consentGiven) {
    return (
      <div className={`bg-yellow-800 border border-yellow-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-yellow-200 text-sm">
          Advertisement space - Please accept cookies to view ads
        </p>
      </div>
    );
  }

  // Don't show ads for Pro subscribers
  if (isProSubscriber) {
    return (
      <div className={`bg-purple-800 border border-purple-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <div className="text-purple-200 text-sm mb-2">
          🚀 Ad-Free Experience
        </div>
        <div className="text-purple-100 text-xs">
          Pro subscribers enjoy an ad-free browsing experience
        </div>
      </div>
    );
  }

  // Show error state if ad failed to load
  if (adError) {
    return (
      <div className={`bg-red-800 border border-red-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-red-200 text-sm mb-2">
          {isMobile ? 'Mobile ad temporarily unavailable' : 'Advertisement temporarily unavailable'}
        </p>
        <button 
          onClick={() => {
            setAdError(false);
            setAdLoaded(false);
          }}
          className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  // Get ad slot ID for this type
  const adSlot = AD_SLOTS[type];
  
  if (!adSlot) {
    return (
      <div className={`bg-orange-800 border border-orange-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-orange-200 text-sm">
          {isMobile ? 'Mobile ad slot not configured' : 'No ad slot configured for'} {type}
        </p>
      </div>
    );
  }

  // Different ad formats based on type and device
  const getAdFormat = () => {
    // Device-specific ad formats
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isMobile) {
      // Mobile-optimized formats with device-specific adjustments
      switch (type) {
        case 'banner':
          return isIOS ? 'auto' : 'fluid'; // iOS prefers auto, Android prefers fluid
        case 'sidebar':
          return 'auto';
        case 'in-content':
          return 'fluid';
        case 'article-top':
          return isIOS ? 'fluid' : 'auto'; // iOS prefers fluid for better layout
        case 'article-bottom':
          return 'fluid';
        case 'homepage-hero':
          return 'auto';
        case 'homepage-grid':
          return 'fluid';
        default:
          return 'auto';
      }
    }
    
    // Desktop formats
    switch (type) {
      case 'banner':
        return 'auto';
      case 'sidebar':
        return 'auto';
      case 'in-content':
        return 'fluid';
      case 'article-top':
        return 'fluid';
      case 'article-bottom':
        return 'fluid';
      case 'homepage-hero':
        return 'auto';
      case 'homepage-grid':
        return 'fluid';
      default:
        return 'auto';
    }
  };

  const adFormat = getAdFormat();

  // Get dimensions based on device and type with better responsive handling
  const getAdDimensions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isTablet = /ipad|tablet/.test(userAgent) || (window.innerWidth > 768 && window.innerWidth <= 1024);
    
    if (isMobile) {
      // Device-specific mobile dimensions
      if (isIOS) {
        switch (type) {
          case 'banner':
            return { width: '100%', height: '90px', minHeight: '90px' };
          case 'sidebar':
            return { width: '100%', height: '280px', minHeight: '280px' };
          case 'in-content':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'article-top':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'article-bottom':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'homepage-hero':
            return { width: '100%', height: '180px', minHeight: '180px' };
          case 'homepage-grid':
            return { width: '100%', height: '200px', minHeight: '200px' };
          default:
            return { width: '100%', height: '250px', minHeight: '250px' };
        }
      } else if (isAndroid) {
        switch (type) {
          case 'banner':
            return { width: '100%', height: '100px', minHeight: '100px' };
          case 'sidebar':
            return { width: '100%', height: '300px', minHeight: '300px' };
          case 'in-content':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'article-top':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'article-bottom':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'homepage-hero':
            return { width: '100%', height: '200px', minHeight: '200px' };
          case 'homepage-grid':
            return { width: '100%', height: '200px', minHeight: '200px' };
          default:
            return { width: '100%', height: '250px', minHeight: '250px' };
        }
      } else {
        // Other mobile devices
        switch (type) {
          case 'banner':
            return { width: '100%', height: '100px', minHeight: '100px' };
          case 'sidebar':
            return { width: '100%', height: '300px', minHeight: '300px' };
          case 'in-content':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'article-top':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'article-bottom':
            return { width: '100%', height: '250px', minHeight: '250px' };
          case 'homepage-hero':
            return { width: '100%', height: '200px', minHeight: '200px' };
          case 'homepage-grid':
            return { width: '100%', height: '200px', minHeight: '200px' };
          default:
            return { width: '100%', height: '250px', minHeight: '250px' };
        }
      }
    }
    
    // Desktop dimensions
    switch (type) {
      case 'banner':
        return { width: '100%', height: '90px', minHeight: '90px' };
      case 'sidebar':
        return { width: '100%', height: '600px', minHeight: '600px' };
      case 'in-content':
        return { width: '100%', height: '250px', minHeight: '250px' };
      case 'article-top':
        return { width: '100%', height: '250px', minHeight: '250px' };
      case 'article-bottom':
        return { width: '100%', height: '250px', minHeight: '250px' };
      case 'homepage-hero':
        return { width: '100%', height: '280px', minHeight: '280px' };
      case 'homepage-grid':
        return { width: '100%', height: '250px', minHeight: '250px' };
      default:
        return { width: '100%', height: '250px', minHeight: '250px' };
    }
  };

  const dimensions = getAdDimensions();

  return (
    <div 
      className={`ad-placement ad-${type} ${className} relative`} 
      style={{
        ...style,
        width: dimensions.width,
        height: dimensions.height,
        minWidth: isMobile ? '100%' : '300px',
        minHeight: dimensions.minHeight,
        maxWidth: '100%',
        maxHeight: dimensions.height,
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        backgroundColor: isMobile ? '#f0f0f0' : '#f8f9fa',
        border: isMobile ? '1px solid #ddd' : '1px solid #e9ecef',
        borderRadius: isMobile ? '12px' : '8px',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1000,
        // Mobile-specific optimizations
        ...(isMobile && {
          margin: '10px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          // Ensure mobile ads are properly sized
          transform: 'translateZ(0)', // Force hardware acceleration
          WebkitTransform: 'translateZ(0)',
          // Mobile-specific sizing
          maxWidth: '100vw',
          boxSizing: 'border-box'
        })
      }}
    >
      {!adLoaded && !adError && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-xs">
              {isMobile ? 'Loading mobile ad...' : 'Loading advertisement...'}
            </p>
          </div>
        </div>
      )}
      
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block', 
          textAlign: 'center',
          width: '100%',
          height: '100%',
          minHeight: dimensions.minHeight,
          backgroundColor: 'transparent',
          // Device-specific optimizations
          ...(isMobile && {
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          })
        }}
        data-ad-client="ca-pub-9144996607586274"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        // Device-specific ad attributes
        {...(isMobile ? {
          'data-ad-layout': 'in-article',
          'data-ad-layout-key': '-71+eh+1g-3a+2i'
        } : {})}
        {...(type === 'in-content' || type === 'article-top' || type === 'article-bottom' ? {
          'data-ad-layout': 'in-article'
        } : {})}
        {...(type === 'homepage-grid' ? {
          'data-ad-layout-key': '-71+eh+1g-3a+2i'
        } : {})}
        // Cross-platform compatibility attributes
        data-adtest="off"
        data-ad-region="true"
        data-ad-loading-strategy="prefer-viewability"
      />
    </div>
  );
};

// Specific ad placement components for easy use
export const BannerAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="banner" {...props} />
);

export const SidebarAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="sidebar" {...props} />
);

export const InContentAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="in-content" {...props} />
);

export const ArticleTopAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="article-top" {...props} />
);

export const ArticleBottomAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="article-bottom" {...props} />
);

export const HomepageHeroAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="homepage-hero" {...props} />
);

export const HomepageGridAd: React.FC<{ className?: string; style?: React.CSSProperties }> = (props) => (
  <AdPlacement type="homepage-grid" {...props} />
);
