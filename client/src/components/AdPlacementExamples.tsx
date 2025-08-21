import React from 'react';
import { 
  HeaderAd, 
  SidebarAd, 
  ContentAd, 
  FooterAd, 
  InArticleAd, 
  BetweenArticlesAd 
} from './Advertisement';

// Example: Header advertisement placement
export const HeaderAdExample: React.FC = () => (
  <div className="w-full bg-gray-50 border-b border-gray-200 py-4">
    <div className="container mx-auto">
      <HeaderAd className="mx-auto" />
    </div>
  </div>
);

// Example: Sidebar advertisement placement
export const SidebarAdExample: React.FC = () => (
  <div className="sidebar-ads space-y-6">
    <SidebarAd className="mx-auto" />
    <SidebarAd className="mx-auto" />
  </div>
);

// Example: In-article advertisement placement
export const InArticleAdExample: React.FC = () => (
  <article className="prose prose-lg max-w-none">
    <h1>Article Title</h1>
    
    <p>First paragraph of content...</p>
    <p>Second paragraph of content...</p>
    
    {/* Place ad after 2-3 paragraphs */}
    <InArticleAd className="my-8" />
    
    <p>Continue with more content...</p>
    <p>Another paragraph...</p>
    
    {/* Second ad placement */}
    <InArticleAd className="my-8" />
    
    <p>Final content...</p>
  </article>
);

// Example: Between articles advertisement
export const BetweenArticlesAdExample: React.FC = () => (
  <div className="articles-list space-y-8">
    <article className="article-card">
      <h2>First Article</h2>
      <p>Article content...</p>
    </article>
    
    {/* Ad between articles */}
    <BetweenArticlesAd className="my-8" />
    
    <article className="article-card">
      <h2>Second Article</h2>
      <p>Article content...</p>
    </article>
  </div>
);

// Example: Footer advertisement placement
export const FooterAdExample: React.FC = () => (
  <div className="footer-ads bg-gray-50 border-t border-gray-200 py-8">
    <div className="container mx-auto">
      <FooterAd className="mx-auto" />
    </div>
  </div>
);

// Example: Content area advertisement
export const ContentAdExample: React.FC = () => (
  <div className="content-area">
    <div className="main-content">
      <h1>Page Content</h1>
      <p>Your main content here...</p>
    </div>
    
    <div className="sidebar">
      <ContentAd className="mb-6" />
      <ContentAd className="mb-6" />
    </div>
  </div>
);

// Example: Responsive ad grid
export const ResponsiveAdGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="ad-slot">
      <ContentAd className="h-64" />
    </div>
    <div className="ad-slot">
      <ContentAd className="h-64" />
    </div>
    <div className="ad-slot">
      <ContentAd className="h-64" />
    </div>
  </div>
);

// Example: Conditional ad loading based on user consent
export const ConditionalAdExample: React.FC = () => {
  const [showAds, setShowAds] = React.useState(false);
  
  React.useEffect(() => {
    const consent = localStorage.getItem('ads-consent');
    setShowAds(consent === 'true');
  }, []);
  
  if (!showAds) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">
          Enable ads to support our content
        </p>
        <button 
          onClick={() => setShowAds(true)}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enable Ads
        </button>
      </div>
    );
  }
  
  return <ContentAd className="mx-auto" />;
};

// Example: Ad loading with fallback
export const AdWithFallback: React.FC = () => {
  const [adLoaded, setAdLoaded] = React.useState(false);
  const [adError, setAdError] = React.useState(false);
  
  React.useEffect(() => {
    // Simulate ad loading
    const timer = setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        setAdLoaded(true);
      } else {
        setAdError(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (adError) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">
          Advertisement temporarily unavailable
        </p>
      </div>
    );
  }
  
  if (!adLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return <ContentAd className="mx-auto" />;
};

// Example: Ad performance tracking
export const TrackedAd: React.FC = () => {
  const handleAdView = () => {
    // Track ad view for analytics
    if (window.gtag) {
      window.gtag('event', 'ad_view', {
        ad_position: 'content',
        ad_slot: '1234567892'
      });
    }
  };
  
  const handleAdClick = () => {
    // Track ad click for analytics
    if (window.gtag) {
      window.gtag('event', 'ad_click', {
        ad_position: 'content',
        ad_slot: '1234567892'
      });
    }
  };
  
  return (
    <div onMouseEnter={handleAdView}>
      <ContentAd 
        className="mx-auto cursor-pointer" 
        onClick={handleAdClick}
      />
    </div>
  );
};
