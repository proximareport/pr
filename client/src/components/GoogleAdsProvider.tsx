import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleAdsContextType {
  isGoogleAdsLoaded: boolean;
  refreshAds: () => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
  isAdBlocked: boolean;
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

// Google AdSense Publisher ID - Your actual ID
const GOOGLE_ADSENSE_ID = 'ca-pub-9144996607586274';
const GOOGLE_ANALYTICS_ID = 'G-ZCQJ1XQLT';

export const GoogleAdsProvider: React.FC<GoogleAdsProviderProps> = ({ children }) => {
  const [isGoogleAdsLoaded, setIsGoogleAdsLoaded] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for stored consent
    const storedConsent = localStorage.getItem('ads-consent');
    console.log('GoogleAdsProvider: Stored consent:', storedConsent);
    if (storedConsent === 'true') {
      setConsentGiven(true);
      console.log('GoogleAdsProvider: Consent restored from localStorage');
    }

    // Check if Google AdSense is already loaded from index.html
    if (window.adsbygoogle) {
      console.log('GoogleAdsProvider: Google AdSense already loaded from index.html');
      setIsGoogleAdsLoaded(true);
    }

    // Detect mobile device with more robust detection
    const checkDevice = () => {
      // More comprehensive device detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobileBrowser = /mobile|tablet|ipad|android|blackberry|opera mini|iemobile/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isTablet = /ipad|tablet/.test(userAgent) || (window.innerWidth > 768 && window.innerWidth <= 1024);
      
      // Consider device mobile if any of these conditions are true
      const mobile = isIOS || isAndroid || isMobileBrowser || (isSmallScreen && isTouchDevice) || isTablet;
      
      setIsMobile(mobile);
      
      // Log device info for debugging
      console.log('GoogleAdsProvider Device detection:', {
        userAgent: userAgent.substring(0, 100),
        isIOS,
        isAndroid,
        isMobileBrowser,
        isSmallScreen,
        isTouchDevice,
        isTablet,
        finalResult: mobile
      });
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Check for ad blocker
    checkAdBlocker();

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    console.log('GoogleAdsProvider: Consent changed to:', consentGiven);
    // Store consent preference
    localStorage.setItem('ads-consent', consentGiven.toString());
    
    if (consentGiven) {
      console.log('GoogleAdsProvider: Loading Google services...');
      loadGoogleAds();
      loadGoogleAnalytics();
    }
  }, [consentGiven]);

  const checkAdBlocker = () => {
    // Mobile-optimized ad blocker detection
    if (isMobile) {
      // Mobile browsers handle ads differently, use a more lenient check
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      testAd.style.width = '1px';
      testAd.style.height = '1px';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0 || testAd.offsetWidth === 0;
        setIsAdBlocked(isBlocked);
        document.body.removeChild(testAd);
      }, 200); // Longer timeout for mobile
    } else {
      // Desktop ad blocker detection
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0;
        setIsAdBlocked(isBlocked);
        document.body.removeChild(testAd);
      }, 100);
    }
  };

  const loadGoogleAds = () => {
    console.log('loadGoogleAds called, checking conditions...');
    console.log('window.adsbygoogle exists:', !!window.adsbygoogle);
    console.log('isGoogleAdsLoaded:', isGoogleAdsLoaded);
    console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    // Check if script is already loaded from index.html
    if (window.adsbygoogle) {
      console.log('Google AdSense script already exists, setting state to loaded');
      setIsGoogleAdsLoaded(true);
      return;
    }
    
    if (isGoogleAdsLoaded) {
      console.log('Google Ads already loaded, returning');
      return;
    }

    try {
      console.log('Creating and loading Google AdSense script...');
      // Load Google AdSense script with device-specific optimizations
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_ID}`;
      
      // Device-specific loading optimizations
      if (isMobile) {
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
      }
      
      script.onload = () => {
        console.log('Google AdSense script loaded successfully');
        setIsGoogleAdsLoaded(true);
        console.log('Google AdSense loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Google AdSense');
      };
      document.head.appendChild(script);
      console.log('Google AdSense script added to document head');
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
    isAdBlocked,
  };

  return (
    <GoogleAdsContext.Provider value={value}>
      {children}
    </GoogleAdsContext.Provider>
  );
};

// Google AdSense Ad Component - Fully compliant with Google policies
interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
  fullWidthResponsive?: boolean;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  adSlot,
  adFormat = 'auto',
  style,
  className,
  responsive = true,
  fullWidthResponsive = true
}) => {
  const { isGoogleAdsLoaded, consentGiven, isAdBlocked } = useGoogleAds();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isGoogleAdsLoaded && consentGiven && !adLoaded && !isAdBlocked) {
      try {
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

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={GOOGLE_ADSENSE_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        data-adtest="off"
      />
    </div>
  );
};

// Cookie Consent Banner Component - GDPR/CCPA compliant
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
            We use cookies and similar technologies to enhance your experience, analyze site traffic, 
            and serve personalized advertisements. By clicking "Accept", you consent to our use of 
            cookies for analytics and advertising purposes.
          </p>
          <p className="mt-1">
            <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>
            {' | '}
            <a href="/cookies" className="text-cyan-400 hover:underline">Cookie Policy</a>
            {' | '}
            <a href="/terms" className="text-cyan-400 hover:underline">Terms of Service</a>
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