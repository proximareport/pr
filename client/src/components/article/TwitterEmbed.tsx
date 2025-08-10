import { useEffect, useRef } from 'react';

interface TwitterEmbedProps {
  url: string;
  className?: string;
}

function TwitterEmbed({ url, className = '' }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    // Extract tweet ID from various Twitter URL formats
    const getTweetId = (url: string): string | null => {
      const patterns = [
        /twitter\.com\/\w+\/status\/(\d+)/,
        /x\.com\/\w+\/status\/(\d+)/,
        /twitter\.com\/i\/web\/status\/(\d+)/,
        /x\.com\/i\/web\/status\/(\d+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const tweetId = getTweetId(url);
    if (!tweetId) {
      // If we can't extract a tweet ID, show the URL as a link
      containerRef.current.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 underline">
          ${url}
        </a>
      `;
      return;
    }

    // Create the Twitter embed
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.createTweet(tweetId, containerRef.current, {
        conversation: 'none',
        cards: 'visible',
        theme: 'dark'
      });
    } else {
      // Fallback if Twitter widgets aren't loaded yet
      const checkTwitterWidgets = setInterval(() => {
        if (window.twttr && window.twttr.widgets) {
          clearInterval(checkTwitterWidgets);
          window.twttr.widgets.createTweet(tweetId, containerRef.current, {
            conversation: 'none',
            cards: 'visible',
            theme: 'dark'
          });
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkTwitterWidgets), 10000);
    }
  }, [url]);

  return (
    <div 
      ref={containerRef} 
      className={`twitter-embed my-6 ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
}

export default TwitterEmbed;
