import { db } from './db.js';
import { issLiveFeeds, launchFeedSchedules } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

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
  createdAt: Date;
  updatedAt: Date;
}

export interface LaunchFeedSchedule {
  id: number;
  launchId: string;
  launchName: string;
  launchDate: Date;
  feedId?: string;
  youtubeUrl?: string;
  embedUrl?: string;
  switchTimeMinutes: number;
  isSwitched: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get the current active feed (either ISS default or upcoming launch)
export async function getCurrentLiveFeed(): Promise<{
  feed: ISSLiveFeed | null;
  isLaunchFeed: boolean;
  launchInfo?: {
    launchId: string;
    launchName: string;
    launchDate: Date;
    timeUntilSwitch: number; // minutes
  };
}> {
  try {
    console.log('🔍 Getting ISS live feed...');
    
    // Use raw SQL to query the database directly
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const result = await pool.query(`
      SELECT * FROM iss_live_feeds 
      WHERE "isDefault" = true AND "isActive" = true 
      LIMIT 1
    `);
    
    await pool.end();
    
    if (result.rows.length > 0) {
      console.log('🔍 Database feed found:', result.rows[0]);
      return {
        feed: result.rows[0],
        isLaunchFeed: false
      };
    }
    
    // Fallback to the correct ISS video
    console.log('🔍 No ISS feed found in database, using fallback');
    const fallbackFeed = {
      id: 1,
      feedId: 'nasa-iss-24-7-fallback',
      title: 'NASA ISS 24/7 Live Stream',
      description: 'Live views of Earth from the International Space Station, 24 hours a day.',
      youtubeUrl: 'https://www.youtube.com/watch?v=iYmvCUonukw',
      embedUrl: 'https://www.youtube.com/embed/iYmvCUonukw?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=1&cc_load_policy=0&iv_load_policy=3&start=0',
      isActive: true,
      isDefault: true,
      priority: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return {
      feed: fallbackFeed,
      isLaunchFeed: false
    };
  } catch (error) {
    console.error('Error getting current live feed:', error);
    return { feed: null, isLaunchFeed: false };
  }
}

// Get all ISS live feeds
export async function getAllISSLiveFeeds(): Promise<ISSLiveFeed[]> {
  try {
    const feeds = await db
      .select()
      .from(issLiveFeeds)
      .orderBy(desc(issLiveFeeds.priority), asc(issLiveFeeds.createdAt));
    
    return feeds;
  } catch (error) {
    console.error('Error getting ISS live feeds:', error);
    return [];
  }
}

// Add a new ISS live feed
export async function addISSLiveFeed(data: {
  feedId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  embedUrl: string;
  isActive?: boolean;
  isDefault?: boolean;
  priority?: number;
}): Promise<ISSLiveFeed> {
  const [feed] = await db
    .insert(issLiveFeeds)
    .values({
      feedId: data.feedId,
      title: data.title,
      description: data.description,
      youtubeUrl: data.youtubeUrl,
      embedUrl: data.embedUrl,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
      priority: data.priority ?? 0,
      updatedAt: new Date(),
    })
    .returning();

  return feed;
}

// Update ISS live feed
export async function updateISSLiveFeed(
  feedId: string,
  data: Partial<{
    title: string;
    description: string;
    youtubeUrl: string;
    embedUrl: string;
    isActive: boolean;
    isDefault: boolean;
    priority: number;
  }>
): Promise<ISSLiveFeed | null> {
  const [feed] = await db
    .update(issLiveFeeds)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(issLiveFeeds.feedId, feedId))
    .returning();

  return feed || null;
}

// Schedule a launch feed
export async function scheduleLaunchFeed(data: {
  launchId: string;
  launchName: string;
  launchDate: Date;
  feedId?: string;
  youtubeUrl?: string;
  embedUrl?: string;
  switchTimeMinutes?: number;
}): Promise<LaunchFeedSchedule> {
  const [schedule] = await db
    .insert(launchFeedSchedules)
    .values({
      launchId: data.launchId,
      launchName: data.launchName,
      launchDate: data.launchDate,
      feedId: data.feedId,
      youtubeUrl: data.youtubeUrl,
      embedUrl: data.embedUrl,
      switchTimeMinutes: data.switchTimeMinutes ?? 30,
      updatedAt: new Date(),
    })
    .returning();

  return schedule;
}

// Get launch feed schedules
export async function getLaunchFeedSchedules(): Promise<LaunchFeedSchedule[]> {
  try {
    const schedules = await db
      .select()
      .from(launchFeedSchedules)
      .orderBy(asc(launchFeedSchedules.launchDate));
    
    return schedules;
  } catch (error) {
    console.error('Error getting launch feed schedules:', error);
    return [];
  }
}

// Mark launch feed as switched
export async function markLaunchFeedSwitched(launchId: string): Promise<void> {
  await db
    .update(launchFeedSchedules)
    .set({
      isSwitched: true,
      updatedAt: new Date(),
    })
    .where(eq(launchFeedSchedules.launchId, launchId));
}

// Clean up old launch schedules
export async function cleanupOldLaunchSchedules(): Promise<void> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  await db
    .delete(launchFeedSchedules)
    .where(
      and(
        eq(launchFeedSchedules.isSwitched, true),
        // Add date condition here if needed
      )
    );
}
