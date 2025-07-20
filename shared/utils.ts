// Calculate reading time from HTML or text content
export function calculateReadingTime(content: string): number {
  if (!content) return 1;

  // Remove HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace and filter out empty strings)
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Average reading speed is about 200-250 words per minute
  // Using 225 as a middle ground
  const wordsPerMinute = 225;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / wordsPerMinute));
  
  return readingTimeMinutes;
}

// Format reading time for display
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
} 