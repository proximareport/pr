import { useEffect } from 'react';

export const useGoogleAdSense = () => {
  useEffect(() => {
    // Check if script already exists to avoid duplicates
    const existingScript = document.querySelector('script[src*="googlesyndication"]');
    if (existingScript) {
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9144996607586274';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const scriptToRemove = document.querySelector('script[src*="googlesyndication"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);
};
