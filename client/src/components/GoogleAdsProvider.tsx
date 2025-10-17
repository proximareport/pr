import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleAdsContextType {
  isGoogleAdsLoaded: boolean;
  refreshAds: () => void;
  recoverFromAdErrors: () => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
  isAdBlocked: boolean;
  browserType: string;
  isOpera: boolean;
  isFirefox: boolean;
  isMobile: boolean;
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
  const [browserType, setBrowserType] = useState('');
  const [isOpera, setIsOpera] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    // Check for stored consent
    const storedConsent = localStorage.getItem('ads-consent');
    if (storedConsent === 'true') {
      setConsentGiven(true);
    }

  // Enhanced browser detection with better compatibility
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isOperaBrowser = /opera|opr/.test(userAgent);
    const isFirefoxBrowser = /firefox/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !isOperaBrowser;
    const isSafari = /safari/.test(userAgent) && !isChrome && !isOperaBrowser;
    const isEdge = /edge|edg/.test(userAgent);
    const isSamsungInternet = /samsungbrowser/.test(userAgent);
    const isUCBrowser = /ucbrowser/.test(userAgent);
    const isMobileBrowser = /mobile|tablet|ipad|android|blackberry|opera mini|iemobile/.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isTablet = /ipad|tablet/.test(userAgent) || (window.innerWidth > 768 && window.innerWidth <= 1024);
    
    // Consider device mobile if any of these conditions are true
    const mobile = isIOS || isAndroid || isMobileBrowser || (isSmallScreen && isTouchDevice) || isTablet;
    
    setIsMobile(mobile);
    setIsOpera(isOperaBrowser);
    setIsFirefox(isFirefoxBrowser);
    
    // Set browser type for debugging and optimization
    let browser = 'unknown';
    if (isOperaBrowser) browser = 'opera';
    else if (isFirefoxBrowser) browser = 'firefox';
    else if (isChrome) browser = 'chrome';
    else if (isSafari) browser = 'safari';
    else if (isEdge) browser = 'edge';
    else if (isSamsungInternet) browser = 'samsung';
    else if (isUCBrowser) browser = 'ucbrowser';
    
    setBrowserType(browser);
    
    // Enhanced device detection logging for debugging
    console.log('Enhanced browser detection:', {
      userAgent: userAgent.substring(0, 100),
      isIOS,
      isAndroid,
      isOperaBrowser,
      isFirefoxBrowser,
      isChrome,
      isSafari,
      isEdge,
      isSamsungInternet,
      isUCBrowser,
      isMobileBrowser,
      isSmallScreen,
      isTouchDevice,
      isTablet,
      finalResult: mobile,
      browserType: browser
    });
  };
    
    detectBrowser();
    window.addEventListener('resize', detectBrowser);

    // Check if Google AdSense is already loaded from index.html
    if (window.adsbygoogle) {
      setIsGoogleAdsLoaded(true);
    }

    // Check for ad blocker with browser-specific logic
    checkAdBlocker();

    return () => window.removeEventListener('resize', detectBrowser);
  }, []);

  useEffect(() => {
    // Store consent preference
    localStorage.setItem('ads-consent', consentGiven.toString());
    
    if (consentGiven) {
      loadGoogleAds();
      loadGoogleAnalytics();
    }
  }, [consentGiven]);

  const checkAdBlocker = () => {
    // Browser-specific ad blocker detection
    if (isOpera || isFirefox) {
      // Opera and Firefox need more lenient detection
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      testAd.style.width = '1px';
      testAd.style.height = '1px';
      testAd.style.visibility = 'hidden';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0 || testAd.offsetWidth === 0;
        setIsAdBlocked(isBlocked);
        document.body.removeChild(testAd);
      }, 300); // Longer timeout for Opera/Firefox
    } else if (isMobile) {
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
    // Check if script is already loaded from index.html
    if (window.adsbygoogle) {
      setIsGoogleAdsLoaded(true);
      return;
    }
    
    if (isGoogleAdsLoaded) {
      return;
    }

    try {
      // Load Google AdSense script with comprehensive browser optimizations
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_ID}`;
      
      // Comprehensive browser-specific loading optimizations
      if (isOpera) {
        // Opera-specific optimizations
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
        script.setAttribute('data-ad-region', 'true');
        script.setAttribute('data-ad-loading-strategy', 'prefer-viewability');
      } else if (isFirefox) {
        // Firefox-specific optimizations
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
        script.setAttribute('data-ad-loading-strategy', 'prefer-viewability');
        script.setAttribute('data-ad-region', 'true');
      } else if (browserType === 'safari') {
        // Safari-specific optimizations (iOS and macOS)
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
        script.setAttribute('data-ad-loading-strategy', 'prefer-viewability');
      } else if (browserType === 'edge') {
        // Edge-specific optimizations
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
        script.setAttribute('data-ad-region', 'true');
      } else if (browserType === 'samsung') {
        // Samsung Internet optimizations
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
        script.setAttribute('data-ad-loading-strategy', 'prefer-viewability');
      } else if (isMobile) {
        // Mobile-specific optimizations
        script.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
        script.setAttribute('data-adtest', 'off');
        script.setAttribute('data-ad-loading-strategy', 'prefer-viewability');
      }
      
      script.onload = () => {
        console.log(`Google Ads loaded successfully for ${browserType}`);
        setIsGoogleAdsLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error(`Google Ads script failed to load for ${browserType}:`, error);
        
        // Enhanced retry logic for problematic browsers
        if (isOpera || isFirefox || browserType === 'safari' || browserType === 'edge') {
          setTimeout(() => {
            try {
              console.log(`Retrying Google Ads load for ${browserType}...`);
              const retryScript = document.createElement('script');
              retryScript.async = true;
              retryScript.crossOrigin = 'anonymous';
              retryScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_ID}&libraries=adsense`;
              
              // Add retry-specific attributes
              retryScript.setAttribute('data-ad-client', GOOGLE_ADSENSE_ID);
              retryScript.setAttribute('data-adtest', 'off');
              retryScript.setAttribute('data-ad-loading-strategy', 'prefer-viewability');
              
              retryScript.onload = () => {
                console.log(`Google Ads retry successful for ${browserType}`);
                setIsGoogleAdsLoaded(true);
              };
              
              retryScript.onerror = (retryError) => {
                console.error(`Google Ads retry failed for ${browserType}:`, retryError);
              };
              
              document.head.appendChild(retryScript);
            } catch (retryError) {
              console.error(`Retry script creation failed for ${browserType}:`, retryError);
            }
          }, browserType === 'safari' ? 2000 : 1000); // Safari needs more time
        }
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error creating Google AdSense script:', error);
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
        
        // Browser-specific refresh optimizations
        if (isOpera) {
          setTimeout(() => {
            try {
              (window.adsbygoogle as any[]).push({});
            } catch (error) {
              console.error('Opera ad refresh error:', error);
            }
          }, 1000);
        } else if (isFirefox) {
          setTimeout(() => {
            try {
              (window.adsbygoogle as any[]).push({});
            } catch (error) {
              console.error('Firefox ad refresh error:', error);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error refreshing ads:', error);
      }
    }
  };

  // Global ad error recovery
  const recoverFromAdErrors = () => {
    // Check if ads are actually working
    if (window.adsbygoogle) {
      try {
        // Force reload ads
        (window.adsbygoogle as any[]).push({});
      } catch (error) {
        console.error('Ad recovery failed:', error);
        
        // For problematic browsers, try to reload the script
        if (isOpera || isFirefox) {
          loadGoogleAds();
        }
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
    recoverFromAdErrors,
    trackEvent,
    consentGiven,
    setConsentGiven,
    isAdBlocked,
    browserType,
    isOpera,
    isFirefox,
    isMobile,
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
        <p className="text-gray-500 text-xs mt-2">
          Debug: Ad failed to load
        </p>
      </div>
    );
  }

  // Show loading state with debug info
  if (!adLoaded) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 text-center ${className}`} style={style}>
        <p className="text-gray-400 text-sm">
          Loading advertisement...
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Debug: Ads loaded: {isGoogleAdsLoaded ? 'Yes' : 'No'}, Consent: {consentGiven ? 'Yes' : 'No'}, Blocked: {isAdBlocked ? 'Yes' : 'No'}
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