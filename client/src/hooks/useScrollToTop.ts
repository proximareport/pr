import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { scrollToTop } from '@/lib/scrollUtils';

/**
 * Custom hook that scrolls to the top of the page whenever the route changes
 * This ensures that when users navigate between pages, they always start at the top
 */
export function useScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top whenever the location changes
    scrollToTop(false); // Use instant scroll for immediate effect
  }, [location]);
}
