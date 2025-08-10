declare global {
  interface Window {
    twttr: {
      widgets: {
        createTweet: (
          tweetId: string, 
          element: HTMLElement, 
          options?: {
            conversation?: 'none' | 'all';
            cards?: 'hidden' | 'visible';
            theme?: 'light' | 'dark';
          }
        ) => Promise<HTMLElement>;
        load: (element?: HTMLElement) => Promise<void>;
      };
    };
  }
}

export {};
