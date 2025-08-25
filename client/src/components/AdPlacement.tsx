import React, { useEffect, useState } from 'react';
import { useGoogleAds } from './GoogleAdsProvider';

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
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isGoogleAdsLoaded && consentGiven && !adLoaded && !isAdBlocked) {
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
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isGoogleAdsLoaded, consentGiven, adLoaded, isAdBlocked, type]);

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

  // Show error state if ad failed to load
  if (adError) {
    return (
      <div className={`bg-red-800 border border-red-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-red-200 text-sm mb-2">
          Advertisement temporarily unavailable
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
          No ad slot configured for {type}
        </p>
      </div>
    );
  }

  // Different ad formats based on type
  const getAdFormat = () => {
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

  return (
    <div 
      className={`ad-placement ad-${type} ${className} relative`} 
      style={{
        ...style,
        width: '100%',
        height: type === 'sidebar' ? '600px' : type === 'banner' ? '90px' : '250px',
        minWidth: '300px',
        minHeight: type === 'sidebar' ? '600px' : type === 'banner' ? '90px' : '250px',
        maxWidth: '100%',
        maxHeight: type === 'sidebar' ? '600px' : type === 'banner' ? '90px' : '250px',
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1000
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block', 
          textAlign: 'center',
          width: '100%',
          height: '100%',
          minHeight: type === 'sidebar' ? '600px' : type === 'banner' ? '90px' : '250px',
          backgroundColor: 'transparent'
        }}
        data-ad-client="ca-pub-9144996607586274"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        {...(type === 'in-content' || type === 'article-top' || type === 'article-bottom' ? {
          'data-ad-layout': 'in-article'
        } : {})}
        {...(type === 'homepage-grid' ? {
          'data-ad-layout-key': '-71+eh+1g-3a+2i'
        } : {})}
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
