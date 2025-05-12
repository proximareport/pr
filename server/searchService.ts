import { db } from "./db";
import { pool } from "./db";
import { articles, users, categories } from "../shared/schema";
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
 * Save a search query to the database - disabled for now since table doesn't exist
 */
export async function saveSearch(query: string, userId: number | null, resultCount: number, filters: any = {}) {
  try {
    // Skip saving search history since the table doesn't exist yet
    console.log("Search history recording skipped (table doesn't exist):", {
      query,
      userId: userId || undefined,
      resultCount
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
  searchQuery: string,
  options: SearchOptions = { page: 1, limit: 10, orderBy: 'publishedAt', orderDirection: 'desc' },
  filters: SearchFilters = {},
): Promise<SearchResult<any>> {
  try {
    const offset = (options.page - 1) * options.limit;
    
    // Use direct SQL queries instead of the ORM since we have a schema mismatch
    // Build WHERE clause for the query
    let whereClause = "published_at IS NOT NULL";
    const queryParams = [] as any[];
    let paramIndex = 1;
    
    // Add search condition if query is provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      whereClause += ` AND (title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex} OR category ILIKE $${paramIndex} OR tags::text ILIKE $${paramIndex})`;
      queryParams.push(searchTerm);
      paramIndex++;
    }
    
    // Add category filter
    if (filters.category) {
      whereClause += ` AND category = $${paramIndex}`;
      queryParams.push(filters.category);
      paramIndex++;
    }
    
    // Add tags filter
    if (filters.tags && filters.tags.length > 0) {
      whereClause += ` AND tags && $${paramIndex}::text[]`;
      queryParams.push(filters.tags);
      paramIndex++;
    }
    
    // Add author filter
    if (filters.author) {
      whereClause += ` AND author_id = $${paramIndex}`;
      queryParams.push(filters.author);
      paramIndex++;
    }
    
    // Add date range filters
    if (filters.dateFrom) {
      whereClause += ` AND published_at >= $${paramIndex}`;
      queryParams.push(filters.dateFrom);
      paramIndex++;
    }
    
    if (filters.dateTo) {
      whereClause += ` AND published_at <= $${paramIndex}`;
      queryParams.push(filters.dateTo);
      paramIndex++;
    }
    
    // Count total results first
    const countQuery = `SELECT COUNT(*) FROM articles WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10) || 0;
    
    // Determine order by clause
    const orderColumn = options.orderBy || 'published_at';
    const orderDirection = options.orderDirection || 'desc';
    const orderByClause = `${orderColumn} ${orderDirection}`;
    
    // Fetch the articles with pagination
    const sqlQuery = `
      SELECT 
        id, 
        title, 
        slug, 
        summary, 
        content, 
        author_id as "authorId", 
        published_at as "publishedAt", 
        created_at as "createdAt", 
        updated_at as "updatedAt", 
        featured_image as "featuredImage", 
        is_breaking as "isBreaking", 
        read_time as "readTime",
        view_count as "viewCount",
        tags,
        category,
        status
      FROM articles 
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ${options.limit}
      OFFSET ${offset}
    `;
    
    console.log("Executing SQL:", sqlQuery.replace(/\s+/g, ' '));
    const result = await pool.query(sqlQuery, queryParams);
    const results = result.rows;
    
    // Skip saving search history as the table doesn't exist yet
    
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