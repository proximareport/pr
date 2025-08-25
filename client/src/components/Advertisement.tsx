import React from 'react';
import { SidebarAd } from './AdPlacement';

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
      return <SidebarAd className="w-full" />; // Fallback to sidebar for now
    case 'in-content':
      return <SidebarAd className="w-full" />; // Fallback to sidebar for now
    case 'article-top':
      return <SidebarAd className="w-full" />; // Fallback to sidebar for now
    case 'article-bottom':
      return <SidebarAd className="w-full" />; // Fallback to sidebar for now
    case 'homepage-hero':
      return <SidebarAd className="w-full" />; // Fallback to sidebar for now
    case 'homepage-grid':
      return <SidebarAd className="w-full" />; // Fallback to sidebar for now
    default:
      return <SidebarAd className="w-full" />;
  }
};

export default Advertisement;