import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleAdsContextType {
  isGoogleAdsLoaded: boolean;
  refreshAds: () => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
}

const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(undefined);

export const useGoogleAds = () => {
  const context = useContext(GoogleAdsContext);
  if (!context) {
    throw new Error('useGoogleAds must be used within a GoogleAdsProvider');
  }
  return context;
};

interface GoogleAdsProviderProps {
  children: React.ReactNode;
}

// Google AdSense Publisher ID - replace with your actual ID
const GOOGLE_ADSENSE_ID = 'ca-pub-XXXXXXXXXXXXXXXXX';
const GOOGLE_ANALYTICS_ID = 'G-XXXXXXXXXX';

export const GoogleAdsProvider: React.FC<GoogleAdsProviderProps> = ({ children }) => {
  const [isGoogleAdsLoaded, setIsGoogleAdsLoaded] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Check for stored consent
    const storedConsent = localStorage.getItem('ads-consent');
    if (storedConsent === 'true') {
      setConsentGiven(true);
    }
  }, []);

  useEffect(() => {
    // Store consent preference
    localStorage.setItem('ads-consent', consentGiven.toString());
    
    if (consentGiven) {
      loadGoogleAds();
      loadGoogleAnalytics();
    }
  }, [consentGiven]);

  const loadGoogleAds = () => {
    if (window.adsbygoogle || isGoogleAdsLoaded) return;

    try {
      // Load Google AdSense script
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_ID}`;
      script.onload = () => {
        setIsGoogleAdsLoaded(true);
        console.log('Google AdSense loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Google AdSense');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Google AdSense:', error);
    }
  };

  const loadGoogleAnalytics = () => {
    try {
      // Load Google Analytics
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GOOGLE_ANALYTICS_ID}', {
          page_title: document.title,
          page_location: window.location.href,
          anonymize_ip: true,
          allow_google_signals: true,
          allow_ad_personalization_signals: true
        });
      `;
      document.head.appendChild(script2);
    } catch (error) {
      console.error('Error loading Google Analytics:', error);
    }
  };

  const refreshAds = () => {
    if (window.adsbygoogle && isGoogleAdsLoaded) {
      try {
        (window.adsbygoogle as any[]).push({});
      } catch (error) {
        console.error('Error refreshing ads:', error);
      }
    }
  };

  const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
    if (consentGiven && window.gtag) {
      try {
        window.gtag('event', eventName, parameters);
      } catch (error) {
        console.error('Error tracking event:', error);
      }
    }
  };

  const value: GoogleAdsContextType = {
    isGoogleAdsLoaded,
    refreshAds,
    trackEvent,
    consentGiven,
    setConsentGiven,
  };

  return (
    <GoogleAdsContext.Provider value={value}>
      {children}
    </GoogleAdsContext.Provider>
  );
};

// Google AdSense Ad Component
interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  adSlot,
  adFormat = 'auto',
  style,
  className
}) => {
  const { isGoogleAdsLoaded, consentGiven } = useGoogleAds();
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (isGoogleAdsLoaded && consentGiven && !adLoaded) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading ad:', error);
      }
    }
  }, [isGoogleAdsLoaded, consentGiven, adLoaded]);

  if (!consentGiven) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-gray-400 text-sm">
          Advertisement space - Please accept cookies to view ads
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={GOOGLE_ADSENSE_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Cookie Consent Banner Component
export const CookieConsentBanner: React.FC = () => {
  const { consentGiven, setConsentGiven } = useGoogleAds();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasSeenBanner = localStorage.getItem('cookie-banner-seen');
    if (!hasSeenBanner && !consentGiven) {
      setShowBanner(true);
    }
  }, [consentGiven]);

  const handleAccept = () => {
    setConsentGiven(true);
    setShowBanner(false);
    localStorage.setItem('cookie-banner-seen', 'true');
  };

  const handleDecline = () => {
    setConsentGiven(false);
    setShowBanner(false);
    localStorage.setItem('cookie-banner-seen', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-white text-sm">
          <p>
            We use cookies to enhance your experience and serve personalized ads. 
            By clicking "Accept", you agree to our use of cookies for analytics and advertising.
          </p>
          <p className="mt-1">
            <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>
            {' | '}
            <a href="/cookies" className="text-cyan-400 hover:underline">Cookie Policy</a>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

// Declare global types for Google services
declare global {
  interface Window {
    adsbygoogle: any[];
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
} 