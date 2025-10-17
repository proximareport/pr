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
  const { isGoogleAdsLoaded, consentGiven, isAdBlocked, browserType, isOpera, isFirefox, isMobile } = useGoogleAds();
  const { user } = useAuth();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [adTimeout, setAdTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if user has any paid subscription (should block ads)
  const isPaidSubscriber = user?.membershipTier === 'tier1' || user?.membershipTier === 'tier2' || user?.membershipTier === 'tier3';

  // Browser-specific ad loading timeout
  const getAdTimeout = () => {
    if (isOpera) return 8000; // Opera needs more time
    if (isFirefox) return 6000; // Firefox needs moderate time
    if (isMobile) return 5000; // Mobile browsers need more time
    return 4000; // Desktop browsers
  };

  // Browser-specific retry logic
  const maxRetries = isOpera ? 3 : isFirefox ? 2 : 1;

  useEffect(() => {
    if (isGoogleAdsLoaded && consentGiven && !adLoaded && !isAdBlocked && !isPaidSubscriber) {
      // Browser-specific loading delays
      let delay = 300;
      if (isOpera) delay = 500; // Opera needs more time to initialize
      if (isFirefox) delay = 400; // Firefox needs moderate time
      if (isMobile) delay = 200; // Mobile browsers are faster
      
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
          
          // Load the ad with browser-specific optimizations
          loadAd();
          
        } catch (error) {
          console.error(`Error loading ad for ${type}:`, error);
          setAdError(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isGoogleAdsLoaded, consentGiven, adLoaded, isAdBlocked, isPaidSubscriber, type, isOpera, isFirefox, isMobile]);

  const loadAd = () => {
    try {
      // Clear any existing timeout
      if (adTimeout) {
        clearTimeout(adTimeout);
      }

      console.log(`Loading ad for ${type} on ${browserType} (${isMobile ? 'mobile' : 'desktop'})`);

      // Enhanced browser-specific ad loading with comprehensive error handling
      const pushAd = () => {
        try {
          // Initialize adsbygoogle array if it doesn't exist
          if (!window.adsbygoogle) {
            window.adsbygoogle = [];
          }
          
          // Browser-specific ad loading strategies
          if (isOpera) {
            // Opera-specific ad loading with additional attributes
            (window.adsbygoogle as any[]).push({
              google_ad_client: "ca-pub-9144996607586274",
              enable_page_level_ads: false,
              overlays: {bottom: true}
            });
          } else if (isFirefox) {
            // Firefox-specific ad loading
            (window.adsbygoogle as any[]).push({
              google_ad_client: "ca-pub-9144996607586274",
              enable_page_level_ads: false
            });
          } else if (browserType === 'safari') {
            // Safari-specific ad loading (iOS and macOS)
            (window.adsbygoogle as any[]).push({
              google_ad_client: "ca-pub-9144996607586274",
              enable_page_level_ads: false
            });
          } else if (browserType === 'edge') {
            // Edge-specific ad loading
            (window.adsbygoogle as any[]).push({
              google_ad_client: "ca-pub-9144996607586274",
              enable_page_level_ads: false
            });
          } else {
            // Standard ad loading for Chrome and other browsers
            (window.adsbygoogle as any[]).push({});
          }
        } catch (pushError) {
          console.error(`Error pushing ad for ${browserType}:`, pushError);
          throw pushError;
        }
      };

      pushAd();

      // Enhanced ad success monitoring with multiple detection methods
      const checkAdSuccess = () => {
        const container = document.querySelector(`.ad-placement.ad-${type}`) as HTMLElement;
        if (container) {
          const adElement = container.querySelector('.adsbygoogle');
          if (adElement) {
            // Multiple success indicators for better reliability
            const hasGoogleAd = adElement.querySelector('[id^="aswift_"], [id^="google_ads_"], [id^="div-gpt-ad"], [id^="google_ad_"]');
            const hasAdContent = adElement.innerHTML.length > 100;
            const hasAdDimensions = (adElement as HTMLElement).offsetHeight > 50 && (adElement as HTMLElement).offsetWidth > 50;
            const hasAdImages = adElement.querySelectorAll('img').length > 0;
            const hasAdFrames = adElement.querySelectorAll('iframe').length > 0;
            
            // Browser-specific success criteria
            const isSuccess = hasGoogleAd || 
                            (hasAdContent && hasAdDimensions) || 
                            hasAdImages || 
                            hasAdFrames ||
                            (browserType === 'safari' && hasAdDimensions) || // Safari needs dimension check
                            (isFirefox && hasAdContent); // Firefox needs content check
            
            if (isSuccess) {
              console.log(`Ad loaded successfully for ${type} on ${browserType}`);
              setAdLoaded(true);
              return true;
            }
          }
        }
        return false;
      };

      // Enhanced timeout logic with browser-specific adjustments
      const timeout = setTimeout(() => {
        if (!adLoaded && retryCount < maxRetries) {
          // Check if ad actually loaded but we missed the signal
          if (checkAdSuccess()) {
            return;
          }
          
          console.log(`Retrying ad load for ${type} on ${browserType} (attempt ${retryCount + 1})`);
          setRetryCount(prev => prev + 1);
          setAdError(false);
          
          // Browser-specific retry delays
          const retryDelay = browserType === 'safari' ? 2000 : 
                           browserType === 'firefox' ? 1500 : 
                           browserType === 'opera' ? 1500 : 1000;
          
          setTimeout(() => loadAd(), retryDelay);
        } else if (retryCount >= maxRetries) {
          console.error(`Ad failed to load after ${maxRetries} attempts for ${type} on ${browserType}`);
          setAdError(true);
        }
      }, getAdTimeout());

      setAdTimeout(timeout);

      // Enhanced success checking with browser-specific intervals
      const checkInterval = browserType === 'safari' ? 750 : 
                          browserType === 'firefox' ? 600 : 
                          browserType === 'opera' ? 600 : 500;
      
      const successCheckInterval = setInterval(() => {
        if (checkAdSuccess()) {
          clearInterval(successCheckInterval);
        }
      }, checkInterval);

      // Clean up interval after timeout
      setTimeout(() => clearInterval(successCheckInterval), getAdTimeout());
      
    } catch (error) {
      console.error(`Critical error in loadAd for ${type} on ${browserType}:`, error);
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        const retryDelay = browserType === 'safari' ? 2000 : 1000;
        setTimeout(() => loadAd(), retryDelay);
      } else {
        setAdError(true);
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (adTimeout) {
        clearTimeout(adTimeout);
      }
    };
  }, [adTimeout]);

  // Don't show anything if user has any paid subscription
  if (isPaidSubscriber) {
    return null;
  }

  // Don't show ads if ad blocker is detected
  if (isAdBlocked) {
    return null;
  }

  // Don't show ads if consent not given
  if (!consentGiven) {
    return null;
  }

  // Show error state if ad failed to load
  if (adError) {
    return null;
  }

  // Get ad slot ID for this type
  const adSlot = AD_SLOTS[type];
  
  if (!adSlot) {
    return null;
  }

  // Enhanced ad format selection with comprehensive browser compatibility
  const getAdFormat = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isEdge = /edge|edg/.test(userAgent);
    const isOpera = /opera|opr/.test(userAgent);
    
    if (isMobile) {
      // Mobile-optimized formats with comprehensive device-specific adjustments
      switch (type) {
        case 'banner':
          if (isIOS && isSafari) return 'auto'; // iOS Safari prefers auto
          if (isAndroid) return 'fluid'; // Android prefers fluid
          if (isFirefox) return 'auto'; // Firefox mobile prefers auto
          return 'auto';
        case 'sidebar':
          return 'auto';
        case 'in-content':
          if (isIOS) return 'fluid'; // iOS content ads work better with fluid
          if (isAndroid) return 'auto'; // Android content ads prefer auto
          return 'fluid';
        case 'article-top':
          if (isIOS) return 'fluid'; // iOS prefers fluid for better layout
          if (isAndroid) return 'auto'; // Android prefers auto
          if (isFirefox) return 'fluid'; // Firefox mobile works better with fluid
          return 'fluid';
        case 'article-bottom':
          return 'fluid';
        case 'homepage-hero':
          if (isIOS) return 'auto'; // iOS hero ads prefer auto
          if (isAndroid) return 'fluid'; // Android hero ads prefer fluid
          return 'auto';
        case 'homepage-grid':
          return 'fluid';
        default:
          return 'auto';
      }
    }
    
    // Desktop formats with browser-specific optimizations
    switch (type) {
      case 'banner':
        if (isSafari) return 'auto'; // Safari desktop prefers auto
        if (isFirefox) return 'auto'; // Firefox desktop prefers auto
        if (isEdge) return 'auto'; // Edge prefers auto
        if (isOpera) return 'fluid'; // Opera prefers fluid
        return 'auto';
      case 'sidebar':
        return 'auto';
      case 'in-content':
        if (isSafari) return 'fluid'; // Safari content ads work better with fluid
        if (isFirefox) return 'auto'; // Firefox content ads prefer auto
        if (isEdge) return 'fluid'; // Edge content ads prefer fluid
        return 'fluid';
      case 'article-top':
        if (isSafari) return 'fluid'; // Safari article ads prefer fluid
        if (isFirefox) return 'auto'; // Firefox article ads prefer auto
        if (isEdge) return 'fluid'; // Edge article ads prefer fluid
        if (isOpera) return 'auto'; // Opera article ads prefer auto
        return 'fluid';
      case 'article-bottom':
        return 'fluid';
      case 'homepage-hero':
        if (isSafari) return 'auto'; // Safari hero ads prefer auto
        if (isFirefox) return 'auto'; // Firefox hero ads prefer auto
        if (isEdge) return 'auto'; // Edge hero ads prefer auto
        if (isOpera) return 'fluid'; // Opera hero ads prefer fluid
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
              {isOpera ? 'Loading ad for Opera...' :
               isFirefox ? 'Loading ad for Firefox...' :
               isMobile ? 'Loading mobile ad...' : 
               'Loading advertisement...'}
            </p>
            {retryCount > 0 && (
              <p className="text-gray-400 text-xs mt-1">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </p>
            )}
            {browserType && (
              <p className="text-gray-400 text-xs mt-1">
                Browser: {browserType.charAt(0).toUpperCase() + browserType.slice(1)}
              </p>
            )}
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
          // Comprehensive browser-specific optimizations
          ...(isMobile && {
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            // Mobile-specific optimizations
            WebkitPerspective: '1000',
            perspective: '1000',
            WebkitTransformStyle: 'preserve-3d',
            transformStyle: 'preserve-3d'
          }),
          // Safari-specific optimizations
          ...(browserType === 'safari' && {
            WebkitTransform: 'translate3d(0,0,0)',
            transform: 'translate3d(0,0,0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }),
          // Firefox-specific optimizations
          ...(isFirefox && {
            MozTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
          }),
          // Edge-specific optimizations
          ...(browserType === 'edge' && {
            msTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
          }),
          // Opera-specific optimizations
          ...(isOpera && {
            OTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
          })
        }}
        data-ad-client="ca-pub-9144996607586274"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        // Enhanced browser-specific ad attributes
        {...(isOpera ? {
          'data-ad-layout': 'in-article',
          'data-ad-layout-key': '-71+eh+1g-3a+2i',
          'data-ad-region': 'true',
          'data-ad-loading-strategy': 'prefer-viewability',
          'data-ad-format-key': 'auto'
        } : {})}
        {...(isFirefox ? {
          'data-ad-layout': 'in-article',
          'data-ad-loading-strategy': 'prefer-viewability',
          'data-ad-region': 'true',
          'data-ad-format-key': 'auto'
        } : {})}
        {...(browserType === 'safari' ? {
          'data-ad-layout': 'in-article',
          'data-ad-loading-strategy': 'prefer-viewability',
          'data-ad-region': 'true',
          'data-ad-format-key': 'auto'
        } : {})}
        {...(browserType === 'edge' ? {
          'data-ad-layout': 'in-article',
          'data-ad-loading-strategy': 'prefer-viewability',
          'data-ad-region': 'true',
          'data-ad-format-key': 'auto'
        } : {})}
        // Device-specific ad attributes
        {...(isMobile ? {
          'data-ad-layout': 'in-article',
          'data-ad-layout-key': '-71+eh+1g-3a+2i',
          'data-ad-loading-strategy': 'prefer-viewability'
        } : {})}
        {...(type === 'in-content' || type === 'article-top' || type === 'article-bottom' ? {
          'data-ad-layout': 'in-article',
          'data-ad-loading-strategy': 'prefer-viewability'
        } : {})}
        {...(type === 'homepage-grid' ? {
          'data-ad-layout-key': '-71+eh+1g-3a+2i',
          'data-ad-loading-strategy': 'prefer-viewability'
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
