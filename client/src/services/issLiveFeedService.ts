import { useQuery } from '@tanstack/react-query';

export interface ISSLiveFeed {
  id: number;
  feedId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  embedUrl: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchFeedSchedule {
  id: number;
  launchId: string;
  launchName: string;
  launchDate: string;
  feedId?: string;
  youtubeUrl?: string;
  embedUrl?: string;
  switchTimeMinutes: number;
  isSwitched: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentLiveFeed {
  feed: ISSLiveFeed | null;
  isLaunchFeed: boolean;
  launchInfo?: {
    launchId: string;
    launchName: string;
    launchDate: string;
    timeUntilSwitch: number; // minutes
  };
}

// Get current live feed (ISS or upcoming launch)
export function useCurrentLiveFeed() {
  return useQuery<CurrentLiveFeed>({
    queryKey: ['iss-live-feed', 'current'],
    queryFn: async () => {
      const response = await fetch('/api/iss-live-feed/current');
      if (!response.ok) {
        throw new Error('Failed to fetch current live feed');
      }
      return response.json();
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get all ISS live feeds
export function useISSLiveFeeds() {
  return useQuery<ISSLiveFeed[]>({
    queryKey: ['iss-live-feed', 'feeds'],
    queryFn: async () => {
      const response = await fetch('/api/iss-live-feed/feeds');
      if (!response.ok) {
        throw new Error('Failed to fetch ISS live feeds');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get launch feed schedules
export function useLaunchFeedSchedules() {
  return useQuery<LaunchFeedSchedule[]>({
    queryKey: ['iss-live-feed', 'schedules'],
    queryFn: async () => {
      const response = await fetch('/api/iss-live-feed/schedules');
      if (!response.ok) {
        throw new Error('Failed to fetch launch feed schedules');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// API functions for admin operations
export const issLiveFeedAPI = {
  // Add new ISS live feed
  async addFeed(data: {
    feedId: string;
    title: string;
    description?: string;
    youtubeUrl: string;
    embedUrl: string;
    isActive?: boolean;
    isDefault?: boolean;
    priority?: number;
  }): Promise<ISSLiveFeed> {
    const response = await fetch('/api/iss-live-feed/feeds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add ISS live feed');
    }
    
    return response.json();
  },

  // Update ISS live feed
  async updateFeed(feedId: string, updates: Partial<{
    title: string;
    description: string;
    youtubeUrl: string;
    embedUrl: string;
    isActive: boolean;
    isDefault: boolean;
    priority: number;
  }>): Promise<ISSLiveFeed> {
    const response = await fetch(`/api/iss-live-feed/feeds/${feedId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update ISS live feed');
    }
    
    return response.json();
  },

  // Schedule launch feed
  async scheduleLaunch(data: {
    launchId: string;
    launchName: string;
    launchDate: string;
    feedId?: string;
    youtubeUrl?: string;
    embedUrl?: string;
    switchTimeMinutes?: number;
  }): Promise<LaunchFeedSchedule> {
    const response = await fetch('/api/iss-live-feed/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to schedule launch feed');
    }
    
    return response.json();
  },

  // Mark launch feed as switched
  async markLaunchSwitched(launchId: string): Promise<void> {
    const response = await fetch(`/api/iss-live-feed/schedules/${launchId}/switch`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark launch feed as switched');
    }
  },

  // Cleanup old launch schedules
  async cleanupOldSchedules(): Promise<void> {
    const response = await fetch('/api/iss-live-feed/cleanup', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to cleanup old launch schedules');
    }
  },
};
