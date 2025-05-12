import { db } from "./db";
import { articles, searchHistory, users, categories } from "../shared/schema";
import { eq, like, and, or, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { SQL } from "drizzle-orm/sql";

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

/**
 * Save a search query to the database
 */
export async function saveSearch(query: string, userId: number | null, resultCount: number, filters: any = {}) {
  try {
    await db.insert(searchHistory).values({
      query,
      userId: userId || undefined,
      resultCount,
      filters,
      isAnonymous: !userId,
    });
    return true;
  } catch (error) {
    console.error("Error saving search:", error);
    return false;
  }
}

/**
 * Search articles with pagination and filtering
 */
export async function searchArticles(
  query: string,
  options: SearchOptions = { page: 1, limit: 10, orderBy: 'publishedAt', orderDirection: 'desc' },
  filters: SearchFilters = {},
): Promise<SearchResult<any>> {
  try {
    const offset = (options.page - 1) * options.limit;
    
    // Create base query conditions
    const conditions: SQL[] = [
      // Only include published articles
      sql`${articles.publishedAt} IS NOT NULL`,
    ];
    
    // Add query search condition if provided
    if (query) {
      conditions.push(
        or(
          like(articles.title, `%${query}%`),
          like(articles.summary, `%${query}%`),
          like(articles.category, `%${query}%`),
          sql`${articles.tags}::text LIKE ${'%' + query + '%'}`
        )
      );
    }
    
    // Add category filter
    if (filters.category) {
      conditions.push(eq(articles.category, filters.category));
    }
    
    // Add tag filter
    if (filters.tags && filters.tags.length > 0) {
      // This uses array overlap operator && for PostgreSQL
      conditions.push(sql`${articles.tags} && ${filters.tags}`);
    }
    
    // Add author filter
    if (filters.author) {
      conditions.push(eq(articles.primaryAuthorId, filters.author));
    }
    
    // Add date range filters
    if (filters.dateFrom) {
      conditions.push(gte(articles.publishedAt, filters.dateFrom));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(articles.publishedAt, filters.dateTo));
    }
    
    // Create ordering SQL
    let orderSql;
    if (options.orderDirection === 'asc') {
      orderSql = asc(articles[options.orderBy as keyof typeof articles]);
    } else {
      orderSql = desc(articles[options.orderBy as keyof typeof articles]);
    }
    
    // Count total results
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(...conditions));
    
    const total = countResult[0]?.count || 0;
    
    // Fetch paginated results
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        summary: articles.summary,
        category: articles.category,
        tags: articles.tags,
        publishedAt: articles.publishedAt,
        featuredImage: articles.featuredImage,
        primaryAuthorId: articles.primaryAuthorId,
        viewCount: articles.viewCount,
      })
      .from(articles)
      .where(and(...conditions))
      .orderBy(orderSql)
      .limit(options.limit)
      .offset(offset);
    
    // Save the search query if it's a text search
    if (query) {
      await saveSearch(query, null, total, filters);
    }
    
    return {
      data: results,
      total,
      page: options.page,
      totalPages: Math.ceil(total / options.limit),
    };
  } catch (error) {
    console.error("Error searching articles:", error);
    return {
      data: [],
      total: 0,
      page: options.page,
      totalPages: 0,
    };
  }
}

/**
 * Search users with pagination
 */
export async function searchUsers(
  query: string,
  options: SearchOptions = { page: 1, limit: 10, orderBy: 'username', orderDirection: 'asc' },
): Promise<SearchResult<any>> {
  try {
    const offset = (options.page - 1) * options.limit;
    
    // Create base query conditions
    const conditions: SQL[] = [];
    
    // Add query search condition if provided
    if (query) {
      conditions.push(
        or(
          like(users.username, `%${query}%`),
          like(users.email, `%${query}%`),
          like(users.bio, `%${query}%`)
        )
      );
    }
    
    // Create ordering SQL
    let orderSql;
    if (options.orderDirection === 'asc') {
      orderSql = asc(users[options.orderBy as keyof typeof users]);
    } else {
      orderSql = desc(users[options.orderBy as keyof typeof users]);
    }
    
    // Count total results
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count || 0;
    
    // Fetch paginated results
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        role: users.role,
      })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderSql)
      .limit(options.limit)
      .offset(offset);
    
    return {
      data: results,
      total,
      page: options.page,
      totalPages: Math.ceil(total / options.limit),
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return {
      data: [],
      total: 0,
      page: options.page,
      totalPages: 0,
    };
  }
}

/**
 * Get popular searches
 */
export async function getPopularSearches(limit: number = 5): Promise<{ query: string, count: number }[]> {
  try {
    const result = await db.execute(sql`
      SELECT query, COUNT(*) as count
      FROM ${searchHistory}
      WHERE searched_at > NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `);
    
    return (result.rows as any[]).map(row => ({
      query: row.query,
      count: parseInt(row.count, 10),
    }));
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return [];
  }
}