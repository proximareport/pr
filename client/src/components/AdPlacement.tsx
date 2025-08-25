import React, { useEffect, useState } from 'react';
import { useGoogleAds } from './GoogleAdsProvider';

interface AdPlacementProps {
  type: 'banner' | 'sidebar' | 'in-content' | 'article-top' | 'article-bottom' | 'homepage-hero' | 'homepage-grid';
  className?: string;
  style?: React.CSSProperties;
}

// Ad slot IDs - You need to replace these with your actual ad slot IDs from Google AdSense
const AD_SLOTS = {
  'banner': '6196809818', // Your real banner ad slot ID
  'sidebar': '1234567891', // Replace with your sidebar ad slot ID
  'in-content': '1234567892', // Replace with your in-content ad slot ID
  'article-top': '1234567893', // Replace with your article top ad slot ID
  'article-bottom': '1234567894', // Replace with your article bottom ad slot ID
  'homepage-hero': '6196809818', // Use the same slot for homepage hero (responsive)
  'homepage-grid': '1234567896', // Replace with your homepage grid ad slot ID
};

export const AdPlacement: React.FC<AdPlacementProps> = ({ type, className = '', style = {} }) => {
  const { isGoogleAdsLoaded, consentGiven, isAdBlocked } = useGoogleAds();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isGoogleAdsLoaded && consentGiven && !adLoaded && !isAdBlocked) {
      try {
        // Push the ad to Google AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading ad:', error);
        setAdError(true);
      }
    }
  }, [isGoogleAdsLoaded, consentGiven, adLoaded, isAdBlocked]);

  // Don't show ads if ad blocker is detected
  if (isAdBlocked) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-gray-400 text-sm">
          Please disable your ad blocker to support our content
        </p>
      </div>
    );
  }

  // Don't show ads if consent not given
  if (!consentGiven) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-gray-400 text-sm">
          Advertisement space - Please accept cookies to view ads
        </p>
      </div>
    );
  }

  // Show error state if ad failed to load
  if (adError) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-gray-400 text-sm">
          Advertisement temporarily unavailable
        </p>
      </div>
    );
  }

  // Get ad slot ID for this type
  const adSlot = AD_SLOTS[type];
  
  if (!adSlot) {
    console.error(`No ad slot configured for type: ${type}`);
    return null;
  }

  // Different ad formats based on type
  const getAdFormat = () => {
    switch (type) {
      case 'banner':
        return 'auto';
      case 'sidebar':
        return 'vertical';
      case 'in-content':
        return 'rectangle';
      case 'article-top':
        return 'horizontal';
      case 'article-bottom':
        return 'horizontal';
      case 'homepage-hero':
        return 'auto';
      case 'homepage-grid':
        return 'rectangle';
      default:
        return 'auto';
    }
  };

  const adFormat = getAdFormat();

  return (
    <div className={`ad-placement ad-${type} ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block', 
          textAlign: 'center',
          minHeight: type === 'sidebar' ? '600px' : type === 'banner' ? '90px' : '250px'
        }}
        data-ad-client="ca-pub-9144996607586274"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        data-adtest="off"
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
