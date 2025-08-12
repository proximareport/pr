// Real Analytics Tracking System
// This file implements actual user behavior tracking

interface PageView {
  path: string;
  timestamp: number;
  referrer: string;
  userAgent: string;
  sessionId: string;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pages: string[];
  duration: number;
}

interface ArticleView {
  slug: string;
  title: string;
  timestamp: number;
  sessionId: string;
  timeOnPage: number;
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private sessionId: string;
  private sessionStartTime: number;
  private currentPage: string = '';
  private pageStartTime: number = 0;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initializeTracking();
  }

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeTracking(): void {
    // Track page views
    this.trackPageView(window.location.pathname);
    
    // Track navigation changes
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });

    // Track before unload to save session data
    window.addEventListener('beforeunload', () => {
      this.saveSessionData();
    });

    // Track visibility changes for session duration
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveSessionData();
      } else {
        this.sessionStartTime = Date.now();
      }
    });

    // Auto-save session data every 30 seconds
    setInterval(() => {
      this.saveSessionData();
    }, 30000);
  }

  public trackPageView(path: string): void {
    const now = Date.now();
    
    // Save previous page data if exists
    if (this.currentPage && this.pageStartTime > 0) {
      this.savePageData(this.currentPage, now - this.pageStartTime);
    }

    // Start tracking new page
    this.currentPage = path;
    this.pageStartTime = now;

    // Create page view record
    const pageView: PageView = {
      path,
      timestamp: now,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    // Save to localStorage
    this.savePageView(pageView);
    
    // Update session data
    this.updateSessionData(path);
  }

  public trackArticleView(slug: string, title: string): void {
    const now = Date.now();
    const timeOnPage = this.pageStartTime > 0 ? now - this.pageStartTime : 0;

    const articleView: ArticleView = {
      slug,
      title,
      timestamp: now,
      sessionId: this.sessionId,
      timeOnPage
    };

    this.saveArticleView(articleView);
  }

  private savePageView(pageView: PageView): void {
    try {
      const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
      const date = new Date(pageView.timestamp).toDateString();
      
      if (!pageViews[date]) {
        pageViews[date] = {};
      }
      
      if (!pageViews[date][pageView.path]) {
        pageViews[date][pageView.path] = 0;
      }
      
      pageViews[date][pageView.path]++;
      
      // Also track total views by path
      const totalViews = JSON.parse(localStorage.getItem('totalPageViews') || '{}');
      totalViews[pageView.path] = (totalViews[pageView.path] || 0) + 1;
      
      localStorage.setItem('pageViews', JSON.stringify(pageViews));
      localStorage.setItem('totalPageViews', JSON.stringify(totalViews));
      
      // Save detailed page view
      const detailedViews = JSON.parse(localStorage.getItem('detailedPageViews') || '[]');
      detailedViews.push(pageView);
      
      // Keep only last 1000 page views to prevent localStorage bloat
      if (detailedViews.length > 1000) {
        detailedViews.splice(0, detailedViews.length - 1000);
      }
      
      localStorage.setItem('detailedPageViews', JSON.stringify(detailedViews));
    } catch (error) {
      console.error('Error saving page view:', error);
    }
  }

  private saveArticleView(articleView: ArticleView): void {
    try {
      const articleViews = JSON.parse(localStorage.getItem('articleViews') || '{}');
      
      if (!articleViews[articleView.slug]) {
        articleViews[articleView.slug] = 0;
      }
      
      articleViews[articleView.slug]++;
      
      localStorage.setItem('articleViews', JSON.stringify(articleViews));
      
      // Save detailed article view
      const detailedArticleViews = JSON.parse(localStorage.getItem('detailedArticleViews') || '[]');
      detailedArticleViews.push(articleView);
      
      if (detailedArticleViews.length > 500) {
        detailedArticleViews.splice(0, detailedArticleViews.length - 500);
      }
      
      localStorage.setItem('detailedArticleViews', JSON.stringify(detailedArticleViews));
    } catch (error) {
      console.error('Error saving article view:', error);
    }
  }

  private updateSessionData(path: string): void {
    try {
      const sessions = JSON.parse(localStorage.getItem('userSessions') || '{}');
      
      if (!sessions[this.sessionId]) {
        sessions[this.sessionId] = {
          sessionId: this.sessionId,
          startTime: this.sessionStartTime,
          lastActivity: Date.now(),
          pages: [],
          duration: 0
        };
      }
      
      const session = sessions[this.sessionId];
      session.lastActivity = Date.now();
      
      if (!session.pages.includes(path)) {
        session.pages.push(path);
      }
      
      localStorage.setItem('userSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  }

  private savePageData(path: string, timeOnPage: number): void {
    try {
      const pageData = JSON.parse(localStorage.getItem('pageData') || '{}');
      
      if (!pageData[path]) {
        pageData[path] = {
          totalTime: 0,
          visits: 0,
          avgTime: 0
        };
      }
      
      pageData[path].totalTime += timeOnPage;
      pageData[path].visits++;
      pageData[path].avgTime = pageData[path].totalTime / pageData[path].visits;
      
      localStorage.setItem('pageData', JSON.stringify(pageData));
    } catch (error) {
      console.error('Error saving page data:', error);
    }
  }

  private saveSessionData(): void {
    try {
      const now = Date.now();
      const sessions = JSON.parse(localStorage.getItem('userSessions') || '{}');
      
      if (sessions[this.sessionId]) {
        sessions[this.sessionId].duration = now - this.sessionStartTime;
        sessions[this.sessionId].lastActivity = now;
        localStorage.setItem('userSessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  public getAnalyticsData() {
    try {
      const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
      const userSessions = JSON.parse(localStorage.getItem('userSessions') || '{}');
      const articleViews = JSON.parse(localStorage.getItem('articleViews') || '{}');
      const pageData = JSON.parse(localStorage.getItem('pageData') || '{}');
      
      return {
        pageViews,
        userSessions,
        articleViews,
        pageData
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return {
        pageViews: {},
        userSessions: {},
        articleViews: {},
        pageData: {}
      };
    }
  }

  public clearOldData(): void {
    try {
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      
      // Clear old detailed views
      const detailedViews = JSON.parse(localStorage.getItem('detailedPageViews') || '[]');
      const filteredViews = detailedViews.filter((view: PageView) => view.timestamp > thirtyDaysAgo);
      localStorage.setItem('detailedPageViews', JSON.stringify(filteredViews));
      
      const detailedArticleViews = JSON.parse(localStorage.getItem('detailedArticleViews') || '[]');
      const filteredArticleViews = detailedArticleViews.filter((view: ArticleView) => view.timestamp > thirtyDaysAgo);
      localStorage.setItem('detailedArticleViews', JSON.stringify(filteredArticleViews));
      
      // Clear old sessions
      const sessions = JSON.parse(localStorage.getItem('userSessions') || '{}');
      const filteredSessions: Record<string, UserSession> = {};
      
      Object.entries(sessions).forEach(([sessionId, session]) => {
        if ((session as UserSession).lastActivity > thirtyDaysAgo) {
          filteredSessions[sessionId] = session as UserSession;
        }
      });
      
      localStorage.setItem('userSessions', JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();

// Export types for use in other components
export type { PageView, UserSession, ArticleView };

// Auto-clean old data every day
setInterval(() => {
  analyticsTracker.clearOldData();
}, 24 * 60 * 60 * 1000);
