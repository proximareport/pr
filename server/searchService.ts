import { db } from "./db";
import { pool } from "./db";
import { articles, users, categories } from "../shared/schema";
// Keep these imports for type checking, but we'll use direct SQL in the implementation
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
    
    // Determine order by clause - map ORM field names to database column names
    let orderColumn = options.orderBy || 'published_at';
    // Convert camelCase to snake_case for the column names
    if (orderColumn === 'publishedAt') orderColumn = 'published_at';
    if (orderColumn === 'featuredImage') orderColumn = 'featured_image';
    if (orderColumn === 'viewCount') orderColumn = 'view_count';
    if (orderColumn === 'readTime') orderColumn = 'read_time';
    if (orderColumn === 'isBreaking') orderColumn = 'is_breaking';
    if (orderColumn === 'authorId') orderColumn = 'author_id';
    if (orderColumn === 'createdAt') orderColumn = 'created_at';
    if (orderColumn === 'updatedAt') orderColumn = 'updated_at';
    
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
      ORDER BY ${orderColumn} ${orderDirection}
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
    
    // Build WHERE clause
    let whereClause = "";
    const queryParams = [] as any[];
    let paramIndex = 1;
    
    // Add query search condition if provided
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      whereClause = `username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR bio ILIKE $${paramIndex}`;
      queryParams.push(searchTerm);
    }
    
    // Complete WHERE clause if we have search conditions
    const finalWhereClause = whereClause ? `WHERE ${whereClause}` : '';
    
    // Count total results
    const countQuery = `SELECT COUNT(*) FROM users ${finalWhereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count, 10) || 0;
    
    // Determine order by clause (map frontend field names to database column names)
    let orderColumn = options.orderBy || 'username';
    // Convert camelCase to snake_case for the column names
    if (orderColumn === 'profilePicture') orderColumn = 'profile_picture';
    if (orderColumn === 'createdAt') orderColumn = 'created_at';
    if (orderColumn === 'updatedAt') orderColumn = 'updated_at';
    
    const orderDirection = options.orderDirection || 'asc';
    const orderByClause = `${orderColumn} ${orderDirection}`;
    
    // Fetch paginated results
    const sqlQuery = `
      SELECT 
        id, 
        username, 
        profile_picture as "profilePicture", 
        bio, 
        role
      FROM users
      ${finalWhereClause}
      ORDER BY ${orderColumn} ${orderDirection}
      LIMIT ${options.limit}
      OFFSET ${offset}
    `;
    
    console.log("Executing SQL:", sqlQuery.replace(/\s+/g, ' '));
    const result = await pool.query(sqlQuery, queryParams);
    const results = result.rows;
    
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
 * Get popular searches - dummy implementation until search_history table is created
 */
export async function getPopularSearches(limit: number = 5): Promise<{ query: string, count: number }[]> {
  try {
    console.log("Note: Using dummy implementation for popular searches since search_history table doesn't exist");
    
    // Return empty array since we don't have a search_history table yet
    return [];
    
    // When search_history table is created, use this implementation:
    /*
    const result = await pool.query(`
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE searched_at > NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows.map(row => ({
      query: row.query,
      count: parseInt(row.count, 10),
    }));
    */
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    return [];
  }
}