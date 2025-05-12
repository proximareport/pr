import { db } from './db';
import { articles, users, searchHistory } from '@shared/schema';
import { eq, ilike, or, and, desc, sql } from 'drizzle-orm';

export interface SearchFilters {
  category?: string;
  tags?: string[];
  author?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchOptions {
  page: number;
  limit: number;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Save search to history
export async function saveSearch(query: string, userId: number | null, resultCount: number, filters: any = {}) {
  try {
    await db.insert(searchHistory).values({
      query,
      userId: userId || null,
      resultCount,
      filters,
      isAnonymous: !userId,
    });
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

// Search articles
export async function searchArticles(
  query: string,
  options: SearchOptions = { page: 1, limit: 10, orderBy: 'publishedAt', orderDirection: 'desc' },
  filters: SearchFilters = {},
  userId?: number
): Promise<SearchResult<typeof articles.$inferSelect>> {
  try {
    const offset = (options.page - 1) * options.limit;
    
    // Build query conditions
    const conditions = [
      or(
        ilike(articles.title, `%${query}%`),
        ilike(articles.summary, `%${query}%`),
        ilike(articles.category, `%${query}%`)
      ),
      // Only include published articles for non-admin users
      eq(articles.status, 'published'),
      filters.category ? eq(articles.category, filters.category) : undefined,
      filters.author ? eq(articles.primaryAuthorId, filters.author) : undefined,
      filters.dateFrom ? sql`${articles.publishedAt} >= ${filters.dateFrom}` : undefined,
      filters.dateTo ? sql`${articles.publishedAt} <= ${filters.dateTo}` : undefined,
    ].filter(Boolean);

    // Add tags filter if present
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => 
        sql`${articles.tags} @> ARRAY[${tag}]::TEXT[]`
      );
      conditions.push(or(...tagConditions));
    }

    // Count total results
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(...conditions));

    // Execute search query
    const results = await db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(options.orderDirection === 'desc' 
        ? desc(articles[options.orderBy as keyof typeof articles]) 
        : articles[options.orderBy as keyof typeof articles])
      .limit(options.limit)
      .offset(offset);

    // Save search to history
    await saveSearch(query, userId || null, Number(count), filters);

    return {
      data: results,
      total: Number(count),
      page: options.page,
      totalPages: Math.ceil(Number(count) / options.limit),
    };
  } catch (error) {
    console.error('Error searching articles:', error);
    return {
      data: [],
      total: 0,
      page: options.page,
      totalPages: 0,
    };
  }
}

// Search users
export async function searchUsers(
  query: string,
  options: SearchOptions = { page: 1, limit: 10, orderBy: 'username', orderDirection: 'asc' },
  adminMode: boolean = false
): Promise<SearchResult<typeof users.$inferSelect>> {
  try {
    const offset = (options.page - 1) * options.limit;
    
    // Build query conditions - search by username, email, or bio
    const conditions = [
      or(
        ilike(users.username, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.bio, `%${query}%`)
      ),
    ];

    // Count total results
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));

    // Execute search query
    const results = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(options.orderDirection === 'desc' 
        ? desc(users[options.orderBy as keyof typeof users]) 
        : users[options.orderBy as keyof typeof users])
      .limit(options.limit)
      .offset(offset);

    // In non-admin mode, strip sensitive information
    const sanitizedResults = adminMode 
      ? results 
      : results.map(({ password, ...rest }) => ({ 
          ...rest, 
          email: rest.email.replace(/(.{2})(.*)@(.*)/, '$1***@$3') // Partially mask email
        }));

    return {
      data: sanitizedResults as typeof users.$inferSelect[],
      total: Number(count),
      page: options.page,
      totalPages: Math.ceil(Number(count) / options.limit),
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      data: [],
      total: 0,
      page: options.page,
      totalPages: 0,
    };
  }
}

// Get popular searches
export async function getPopularSearches(limit: number = 5): Promise<{ query: string, count: number }[]> {
  try {
    const popularSearches = await db
      .select({
        query: searchHistory.query,
        count: sql<number>`count(*)`,
      })
      .from(searchHistory)
      .groupBy(searchHistory.query)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(limit);
    
    return popularSearches;
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [];
  }
}