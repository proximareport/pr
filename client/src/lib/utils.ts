import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { calculateReadingTime, formatReadingTime } from "../../../shared/utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export shared utilities for easy access
export { calculateReadingTime, formatReadingTime }

/**
 * Get consistent reading time display for articles
 * @param article - Article object with reading_time or html content
 * @returns Formatted reading time string
 */
export function getReadingTimeDisplay(article: { reading_time?: number; html?: string }): string {
  // If reading_time is provided and valid, use it
  if (article.reading_time && article.reading_time > 0) {
    return `${article.reading_time} min read`;
  }
  
  // Otherwise calculate from content
  if (article.html) {
    const calculatedTime = calculateReadingTime(article.html);
    return `${calculatedTime} min read`;
  }
  
  // Fallback to default
  return '5 min read';
}

// Share article function with native sharing and clipboard fallback
export async function shareArticle(title?: string, text?: string, url?: string) {
  const shareData = {
    title: title || document.title,
    text: text || "Check out this article on Proxima Report",
    url: url || window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error) {
      console.log("Error sharing article:", error);
      // Fall back to clipboard if sharing is cancelled
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return { success: false, error };
  }
}
