import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scrollToTop, isScrolledToTop } from '@/lib/scrollUtils';

interface ScrollToTopButtonProps {
  threshold?: number; // Show button when scrolled past this point
  className?: string;
}

export function ScrollToTopButton({ threshold = 300, className = '' }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolledToTop = isScrolledToTop(threshold);
      setIsVisible(!scrolledToTop);
    };

    // Check initial scroll position
    handleScroll();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const handleScrollToTop = () => {
    scrollToTop(true); // Use smooth scroll for user interaction
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={handleScrollToTop}
      size="icon"
      className={`fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all duration-300 hover:scale-110 ${className}`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}
