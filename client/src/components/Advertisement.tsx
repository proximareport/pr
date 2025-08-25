import React from 'react';
import { 
  SidebarAd, 
  BannerAd, 
  InContentAd, 
  ArticleTopAd, 
  ArticleBottomAd, 
  HomepageHeroAd, 
  HomepageGridAd 
} from './AdPlacement';

interface AdvertisementProps {
  placement?: string;
}

const Advertisement: React.FC<AdvertisementProps> = ({ placement = 'sidebar' }) => {
  // Map placement to ad type
  const getAdType = () => {
    switch (placement) {
      case 'sidebar':
        return 'sidebar';
      case 'banner':
        return 'banner';
      case 'in-content':
        return 'in-content';
      case 'article-top':
        return 'article-top';
      case 'article-bottom':
        return 'article-bottom';
      case 'homepage-hero':
        return 'homepage-hero';
      case 'homepage-grid':
        return 'homepage-grid';
      default:
        return 'sidebar';
    }
  };

  const adType = getAdType();

  // Use the appropriate ad component based on type
  switch (adType) {
    case 'sidebar':
      return <SidebarAd className="w-full" />;
    case 'banner':
      return <BannerAd className="w-full" />;
    case 'in-content':
      return <InContentAd className="w-full" />;
    case 'article-top':
      return <ArticleTopAd className="w-full" />;
    case 'article-bottom':
      return <ArticleBottomAd className="w-full" />;
    case 'homepage-hero':
      return <HomepageHeroAd className="w-full" />;
    case 'homepage-grid':
      return <HomepageGridAd className="w-full" />;
    default:
      return <SidebarAd className="w-full" />;
  }
};

export default Advertisement;