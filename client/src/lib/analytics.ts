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

interface ToolUsage {
  toolName: string;
  toolCategory: string;
  timestamp: number;
  sessionId: string;
  usageDuration: number;
  isExternal: boolean;
}

interface ToolGroupAnalytics {
  category: string;
  totalUsage: number;
  uniqueUsers: number;
  avgUsageTime: number;
  topTools: Array<{
    name: string;
    usageCount: number;
    avgTime: number;
  }>;
  lastUpdated: number;
}

interface GalleryAnalytics {
  totalPageViews: number;
  totalImageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  lastUpdated: number;
}

interface MissionControlAnalytics {
  totalPageViews: number;
  satelliteTracking: number;
  launchViews: number;
  avgSessionTime: number;
  lastUpdated: number;
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private sessionId: string;
  private sessionStartTime: number;
  private currentPage: string = '';
  private pageStartTime: number = 0;
  private currentTool: string = '';
  private toolStartTime: number = 0;
  private currentGalleryItem: string = '';
  private galleryStartTime: number = 0;
  private currentMissionControlFeature: string = '';
  private missionControlStartTime: number = 0;

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
      if (this.currentTool) {
        this.trackToolUsage(this.currentTool, '', 0, false);
      }
      if (this.currentGalleryItem) {
        this.stopGalleryTracking();
      }
      if (this.currentMissionControlFeature) {
        this.stopMissionControlTracking();
      }
    });

    // Track visibility changes for session duration
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveSessionData();
        if (this.currentTool) {
          this.trackToolUsage(this.currentTool, '', 0, false);
        }
        if (this.currentGalleryItem) {
          this.stopGalleryTracking();
        }
        if (this.currentMissionControlFeature) {
          this.stopMissionControlTracking();
        }
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

    this.savePageView(pageView);
    this.updateSessionData(path);
  }

  public trackArticleView(slug: string, title: string): void {
    const now = Date.now();
    
    const articleView: ArticleView = {
      slug,
      title,
      timestamp: now,
      sessionId: this.sessionId,
      timeOnPage: 0
    };

    this.saveArticleView(articleView);
  }

  public trackToolUsage(toolName: string, category: string, usageDuration: number = 0, isExternal: boolean = false): void {
    const now = Date.now();
    
    // If we have a current tool, save its usage data
    if (this.currentTool && this.toolStartTime > 0) {
      const duration = now - this.toolStartTime;
      this.saveToolUsage(this.currentTool, category, duration, isExternal);
    }

    // Start tracking new tool
    this.currentTool = toolName;
    this.toolStartTime = now;

    // Create tool usage record
    const toolUsage: ToolUsage = {
      toolName,
      toolCategory: category,
      timestamp: now,
      sessionId: this.sessionId,
      usageDuration: 0,
      isExternal
    };

    this.saveToolUsage(toolUsage.toolName, toolUsage.toolCategory, toolUsage.usageDuration, toolUsage.isExternal);
  }

  public stopToolTracking(): void {
    if (this.currentTool && this.toolStartTime > 0) {
      const duration = Date.now() - this.toolStartTime;
      this.saveToolUsage(this.currentTool, '', duration, false);
      this.currentTool = '';
      this.toolStartTime = 0;
    }
  }

  public trackGalleryItem(imageId: string): void {
    if (this.currentGalleryItem && this.currentGalleryItem !== imageId) {
      this.stopGalleryTracking();
    }
    
    if (!this.currentGalleryItem) {
      this.currentGalleryItem = imageId;
      this.galleryStartTime = Date.now();
    }
  }

  public stopGalleryTracking(): void {
    if (this.currentGalleryItem && this.galleryStartTime > 0) {
      const duration = Date.now() - this.galleryStartTime;
      this.saveGalleryItemView(this.currentGalleryItem, duration);
      this.currentGalleryItem = '';
      this.galleryStartTime = 0;
    }
  }

  public trackMissionControlFeature(feature: string): void {
    if (this.currentMissionControlFeature && this.currentMissionControlFeature !== feature) {
      this.stopMissionControlTracking();
    }
    
    if (!this.currentMissionControlFeature) {
      this.currentMissionControlFeature = feature;
      this.missionControlStartTime = Date.now();
    }
  }

  public stopMissionControlTracking(): void {
    if (this.currentMissionControlFeature && this.missionControlStartTime > 0) {
      const duration = Date.now() - this.missionControlStartTime;
      this.saveMissionControlFeatureUsage(this.currentMissionControlFeature, duration);
      this.currentMissionControlFeature = '';
      this.missionControlStartTime = 0;
    }
  }

  private savePageView(pageView: PageView): void {
    try {
      const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
      
      if (!pageViews[pageView.path]) {
        pageViews[pageView.path] = {
          totalViews: 0,
          uniqueSessions: [],
          lastViewed: 0
        };
      }
      
      // Ensure uniqueSessions is a Set
      const uniqueSessions = new Set(pageViews[pageView.path].uniqueSessions || []);
      
      pageViews[pageView.path].totalViews++;
      uniqueSessions.add(pageView.sessionId);
      pageViews[pageView.path].lastViewed = pageView.timestamp;
      
      // Convert Set to Array for localStorage
      pageViews[pageView.path].uniqueSessions = Array.from(uniqueSessions);
      
      localStorage.setItem('pageViews', JSON.stringify(pageViews));
      
      // Also save detailed view for analytics
      const detailedViews = JSON.parse(localStorage.getItem('detailedPageViews') || '[]');
      detailedViews.push(pageView);
      localStorage.setItem('detailedPageViews', JSON.stringify(detailedViews));
    } catch (error) {
      console.error('Error saving page view:', error);
    }
  }

  private saveArticleView(articleView: ArticleView): void {
    try {
      const articleViews = JSON.parse(localStorage.getItem('articleViews') || '{}');
      
      if (!articleViews[articleView.slug]) {
        articleViews[articleView.slug] = {
          totalViews: 0,
          uniqueSessions: [],
          totalTimeOnPage: 0,
          avgTimeOnPage: 0
        };
      }
      
      // Ensure uniqueSessions is a Set
      const uniqueSessions = new Set(articleViews[articleView.slug].uniqueSessions || []);
      
      articleViews[articleView.slug].totalViews++;
      uniqueSessions.add(articleView.sessionId);
      
      // Convert Set to Array for localStorage
      articleViews[articleView.slug].uniqueSessions = Array.from(uniqueSessions);
      
      localStorage.setItem('articleViews', JSON.stringify(articleViews));
      
      // Also save detailed view for analytics
      const detailedArticleViews = JSON.parse(localStorage.getItem('detailedArticleViews') || '[]');
      detailedArticleViews.push(articleView);
      localStorage.setItem('detailedArticleViews', JSON.stringify(detailedArticleViews));
    } catch (error) {
      console.error('Error saving article view:', error);
    }
  }

  private saveToolUsage(toolName: string, category: string, usageDuration: number, isExternal: boolean): void {
    try {
      const toolUsage = JSON.parse(localStorage.getItem('toolUsage') || '{}');
      
      if (!toolUsage[toolName]) {
        toolUsage[toolName] = {
          totalUsage: 0,
          uniqueSessions: [],
          totalUsageTime: 0,
          avgUsageTime: 0,
          category: category,
          isExternal: isExternal,
          lastUsed: 0
        };
      }
      
      // Ensure uniqueSessions is a Set
      const uniqueSessions = new Set(toolUsage[toolName].uniqueSessions || []);
      
      toolUsage[toolName].totalUsage++;
      uniqueSessions.add(this.sessionId);
      toolUsage[toolName].totalUsageTime += usageDuration;
      toolUsage[toolName].avgUsageTime = toolUsage[toolName].totalUsageTime / toolUsage[toolName].totalUsage;
      toolUsage[toolName].lastUsed = Date.now();
      
      // Convert Set to Array for localStorage
      toolUsage[toolName].uniqueSessions = Array.from(uniqueSessions);
      
      localStorage.setItem('toolUsage', JSON.stringify(toolUsage));
      
      // Also save detailed usage for analytics
      const detailedToolUsage = JSON.parse(localStorage.getItem('detailedToolUsage') || '[]');
      detailedToolUsage.push({
        toolName,
        toolCategory: category,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        usageDuration,
        isExternal
      });
      localStorage.setItem('detailedToolUsage', JSON.stringify(detailedToolUsage));
    } catch (error) {
      console.error('Error saving tool usage:', error);
    }
  }

  private saveGalleryItemView(imageId: string, duration: number): void {
    try {
      const galleryData = JSON.parse(localStorage.getItem('galleryData') || '{}');
      
      if (!galleryData[imageId]) {
        galleryData[imageId] = {
          totalViews: 0,
          uniqueSessions: [],
          totalTime: 0,
          avgTime: 0,
          lastViewed: 0
        };
      }
      
      // Ensure uniqueSessions is a Set
      const uniqueSessions = new Set(galleryData[imageId].uniqueSessions || []);
      
      galleryData[imageId].totalViews++;
      uniqueSessions.add(this.sessionId);
      galleryData[imageId].totalTime += duration;
      galleryData[imageId].avgTime = galleryData[imageId].totalTime / galleryData[imageId].totalViews;
      galleryData[imageId].lastViewed = Date.now();
      
      // Convert Set to Array for localStorage
      galleryData[imageId].uniqueSessions = Array.from(uniqueSessions);
      
      localStorage.setItem('galleryData', JSON.stringify(galleryData));
    } catch (error) {
      console.error('Error saving gallery item view:', error);
    }
  }

  private saveMissionControlFeatureUsage(feature: string, duration: number): void {
    try {
      const missionControlData = JSON.parse(localStorage.getItem('missionControlData') || '{}');
      
      if (!missionControlData[feature]) {
        missionControlData[feature] = {
          totalUsage: 0,
          uniqueSessions: [],
          totalTime: 0,
          avgTime: 0,
          lastUsed: 0
        };
      }
      
      // Ensure uniqueSessions is a Set
      const uniqueSessions = new Set(missionControlData[feature].uniqueSessions || []);
      
      missionControlData[feature].totalUsage++;
      uniqueSessions.add(this.sessionId);
      missionControlData[feature].totalTime += duration;
      missionControlData[feature].avgTime = missionControlData[feature].totalTime / missionControlData[feature].totalUsage;
      missionControlData[feature].lastUsed = Date.now();
      
      // Convert Set to Array for localStorage
      missionControlData[feature].uniqueSessions = Array.from(uniqueSessions);
      
      localStorage.setItem('missionControlData', JSON.stringify(missionControlData));
    } catch (error) {
      console.error('Error saving mission control feature usage:', error);
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
      const toolUsage = JSON.parse(localStorage.getItem('toolUsage') || '{}');
      const galleryData = JSON.parse(localStorage.getItem('galleryData') || '{}');
      const missionControlData = JSON.parse(localStorage.getItem('missionControlData') || '{}');
      
      // Calculate gallery analytics
      const galleryAnalytics: GalleryAnalytics = {
        totalPageViews: pageViews['/gallery']?.totalViews || 0,
        totalImageViews: Object.values(galleryData).reduce((sum: number, item: any) => sum + (item.totalViews || 0), 0),
        uniqueVisitors: Object.values(galleryData).reduce((sum: number, item: any) => sum + (item.uniqueSessions?.length || 0), 0),
        avgTimeOnPage: pageData['/gallery']?.avgTime || 0,
        lastUpdated: Date.now()
      };

      // Calculate mission control analytics
      const missionControlAnalytics: MissionControlAnalytics = {
        totalPageViews: pageViews['/mission-control']?.totalViews || 0,
        satelliteTracking: missionControlData['satellite_tracking']?.totalUsage || 0,
        launchViews: missionControlData['launch_data']?.totalUsage || 0,
        avgSessionTime: pageData['/mission-control']?.avgTime || 0,
        lastUpdated: Date.now()
      };
      
      return {
        pageViews,
        userSessions,
        articleViews,
        pageData,
        toolUsage,
        gallery: galleryAnalytics,
        missionControl: missionControlAnalytics
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return {
        pageViews: {},
        userSessions: {},
        articleViews: {},
        pageData: {},
        toolUsage: {},
        gallery: {
          totalPageViews: 0,
          totalImageViews: 0,
          uniqueVisitors: 0,
          avgTimeOnPage: 0,
          lastUpdated: Date.now()
        },
        missionControl: {
          totalPageViews: 0,
          satelliteTracking: 0,
          launchViews: 0,
          avgSessionTime: 0,
          lastUpdated: Date.now()
        }
      };
    }
  }

  public getToolGroupAnalytics(): ToolGroupAnalytics[] {
    try {
      const toolUsage = JSON.parse(localStorage.getItem('toolUsage') || '{}');
      const groupAnalytics: Record<string, ToolGroupAnalytics> = {};
      
      Object.entries(toolUsage).forEach(([toolName, tool]: [string, any]) => {
        const category = tool.category || 'Uncategorized';
        
        if (!groupAnalytics[category]) {
          groupAnalytics[category] = {
            category,
            totalUsage: 0,
            uniqueUsers: 0,
            avgUsageTime: 0,
            topTools: [],
            lastUpdated: 0
          };
        }
        
        groupAnalytics[category].totalUsage += tool.totalUsage;
        groupAnalytics[category].uniqueUsers += tool.uniqueSessions.length;
        groupAnalytics[category].avgUsageTime += tool.totalUsageTime;
        groupAnalytics[category].lastUpdated = Math.max(groupAnalytics[category].lastUpdated, tool.lastUsed);
        
        groupAnalytics[category].topTools.push({
          name: toolName,
          usageCount: tool.totalUsage,
          avgTime: tool.avgUsageTime
        });
      });
      
      // Calculate averages and sort top tools
      Object.values(groupAnalytics).forEach(group => {
        if (group.totalUsage > 0) {
          group.avgUsageTime = group.avgUsageTime / group.totalUsage;
        }
        group.topTools.sort((a, b) => b.usageCount - a.usageCount);
        group.topTools = group.topTools.slice(0, 5); // Top 5 tools per group
      });
      
      return Object.values(groupAnalytics).sort((a, b) => b.totalUsage - a.totalUsage);
    } catch (error) {
      console.error('Error getting tool group analytics:', error);
      return [];
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
      
      const detailedToolUsage = JSON.parse(localStorage.getItem('detailedToolUsage') || '[]');
      const filteredToolUsage = detailedToolUsage.filter((usage: ToolUsage) => usage.timestamp > thirtyDaysAgo);
      localStorage.setItem('detailedToolUsage', JSON.stringify(filteredToolUsage));
      
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
export type { PageView, UserSession, ArticleView, ToolUsage, ToolGroupAnalytics, GalleryAnalytics, MissionControlAnalytics };

// Auto-clean old data every day
setInterval(() => {
  analyticsTracker.clearOldData();
}, 24 * 60 * 60 * 1000);
