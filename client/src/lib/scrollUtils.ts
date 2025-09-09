/**
 * Utility functions for managing scroll behavior
 */

/**
 * Scrolls to the top of the page with smooth animation
 */
export function scrollToTop(smooth: boolean = true): void {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'instant'
  });
}

/**
 * Scrolls to a specific element by ID
 */
export function scrollToElement(elementId: string, offset: number = 0): void {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Scrolls to a specific position on the page
 */
export function scrollToPosition(top: number, left: number = 0, smooth: boolean = true): void {
  window.scrollTo({
    top,
    left,
    behavior: smooth ? 'smooth' : 'instant'
  });
}

/**
 * Gets the current scroll position
 */
export function getScrollPosition(): { top: number; left: number } {
  return {
    top: window.pageYOffset || document.documentElement.scrollTop,
    left: window.pageXOffset || document.documentElement.scrollLeft
  };
}

/**
 * Checks if the user has scrolled to the bottom of the page
 */
export function isScrolledToBottom(threshold: number = 100): boolean {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  return scrollTop + windowHeight >= documentHeight - threshold;
}

/**
 * Checks if the user has scrolled to the top of the page
 */
export function isScrolledToTop(threshold: number = 100): boolean {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return scrollTop <= threshold;
}
