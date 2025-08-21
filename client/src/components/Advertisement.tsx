import React from 'react';
import { GoogleAd } from './GoogleAdsProvider';

interface AdvertisementProps {
  position: 'header' | 'sidebar' | 'content' | 'footer' | 'in-article' | 'between-articles';
  className?: string;
  style?: React.CSSProperties;
}

export const Advertisement: React.FC<AdvertisementProps> = ({ 
  position, 
  className = '', 
  style = {} 
}) => {
  // Define ad slots based on position
  const getAdSlot = () => {
    switch (position) {
      case 'header':
        return '1234567890'; // Replace with your actual ad slot ID
      case 'sidebar':
        return '1234567891'; // Replace with your actual ad slot ID
      case 'content':
        return '1234567892'; // Replace with your actual ad slot ID
      case 'footer':
        return '1234567893'; // Replace with your actual ad slot ID
      case 'in-article':
        return '1234567894'; // Replace with your actual ad slot ID
      case 'between-articles':
        return '1234567895'; // Replace with your actual ad slot ID
      default:
        return '1234567890';
    }
  };

  // Define ad format based on position
  const getAdFormat = () => {
    switch (position) {
      case 'header':
        return 'horizontal';
      case 'sidebar':
        return 'vertical';
      case 'content':
        return 'auto';
      case 'footer':
        return 'horizontal';
      case 'in-article':
        return 'auto';
      case 'between-articles':
        return 'auto';
      default:
        return 'auto';
    }
  };

  // Define responsive behavior based on position
  const getResponsiveSettings = () => {
    switch (position) {
      case 'header':
        return { responsive: true, fullWidthResponsive: true };
      case 'sidebar':
        return { responsive: false, fullWidthResponsive: false };
      case 'content':
        return { responsive: true, fullWidthResponsive: true };
      case 'footer':
        return { responsive: true, fullWidthResponsive: true };
      case 'in-article':
        return { responsive: true, fullWidthResponsive: true };
      case 'between-articles':
        return { responsive: true, fullWidthResponsive: true };
      default:
        return { responsive: true, fullWidthResponsive: true };
    }
  };

  const adSlot = getAdSlot();
  const adFormat = getAdFormat();
  const { responsive, fullWidthResponsive } = getResponsiveSettings();

  // Add position-specific styling
  const positionStyles: React.CSSProperties = {
    ...style,
    ...(position === 'sidebar' && {
      minHeight: '250px',
      width: '100%',
      maxWidth: '300px'
    }),
    ...(position === 'in-article' && {
      margin: '2rem 0',
      textAlign: 'center'
    }),
    ...(position === 'between-articles' && {
      margin: '3rem 0',
      textAlign: 'center'
    })
  };

  return (
    <div 
      className={`advertisement advertisement-${position} ${className}`}
      style={positionStyles}
      data-ad-position={position}
    >
      <GoogleAd
        adSlot={adSlot}
        adFormat={adFormat}
        responsive={responsive}
        fullWidthResponsive={fullWidthResponsive}
        style={positionStyles}
        className={className}
      />
    </div>
  );
};

// Specialized ad components for common use cases
export const HeaderAd: React.FC<{ className?: string }> = ({ className }) => (
  <Advertisement position="header" className={className} />
);

export const SidebarAd: React.FC<{ className?: string }> = ({ className }) => (
  <Advertisement position="sidebar" className={className} />
);

export const ContentAd: React.FC<{ className?: string }> = ({ className }) => (
  <Advertisement position="content" className={className} />
);

export const FooterAd: React.FC<{ className?: string }> = ({ className }) => (
  <Advertisement position="footer" className={className} />
);

export const InArticleAd: React.FC<{ className?: string }> = ({ className }) => (
  <Advertisement position="in-article" className={className} />
);

export const BetweenArticlesAd: React.FC<{ className?: string }> = ({ className }) => (
  <Advertisement position="between-articles" className={className} />
);

// Default export for backward compatibility
export default Advertisement;