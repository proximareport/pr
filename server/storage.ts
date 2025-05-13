import { 
  users, 
  articles, 
  comments, 
  astronomyPhotos, 
  jobListings, 
  advertisements, 
  emergencyBanners, 
  votes,
  categories,
  apiKeys,
  articleAuthors,
  mediaLibrary,
  siteSettings,
  type User, 
  type InsertUser, 
  type Article, 
  type InsertArticle, 
  type Comment, 
  type InsertComment, 
  type AstronomyPhoto, 
  type InsertAstronomyPhoto, 
  type JobListing, 
  type InsertJobListing, 
  type Advertisement, 
  type InsertAdvertisement, 
  type EmergencyBanner,
  type ApiKey,
  type InsertApiKey,
  type ArticleAuthor,
  type InsertArticleAuthor,
  type MediaLibraryItem,
  type InsertMediaLibraryItem,
  type SiteSettings,
  type UpdateSiteSettings
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, isNull, desc, sql, or, like, not, inArray, asc } from "drizzle-orm";
import { z } from "zod";

// Storage interface 
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByRole(role: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserMembership(id: number, tier: 'free' | 'supporter' | 'pro'): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeData: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // API Key operations
  createApiKey(userId: number, name: string, permissions: string[]): Promise<ApiKey>;
  getApiKeysByUser(userId: number): Promise<ApiKey[]>;
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeyByValue(key: string): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;
  updateApiKeyLastUsed(id: number): Promise<void>;
  
  // Article operations
  getArticles(limit?: number, offset?: number): Promise<Article[]>;
  getAllArticles(): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, data: Partial<Article>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  getArticlesByAuthor(authorId: number): Promise<Article[]>;
  getArticlesByCategory(category: string): Promise<Article[]>;
  getFeaturedArticles(limit?: number): Promise<Article[]>;
  searchArticles(query: string): Promise<Article[]>;
  getArticlesByStatus(status: string): Promise<Article[]>;
  getAuthorDrafts(authorId: number): Promise<Article[]>;
  
  // Article Author operations
  addAuthorToArticle(articleId: number, userId: number, role?: string): Promise<ArticleAuthor>;
  removeAuthorFromArticle(articleId: number, userId: number): Promise<boolean>;
  getArticleAuthors(articleId: number): Promise<(ArticleAuthor & { user: User })[]>;
  getAuthoredArticles(userId: number): Promise<(ArticleAuthor & { article: Article })[]>;
  
  // Comment operations
  getCommentsByArticle(articleId: number): Promise<Comment[]>;
  getCommentById(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  getCommentReplies(commentId: number): Promise<Comment[]>;
  
  // Vote operations
  addVote(userId: number, commentId: number, voteType: string): Promise<void>;
  removeVote(userId: number, commentId: number): Promise<void>;
  getVote(userId: number, commentId: number): Promise<{ voteType: string } | undefined>;
  
  // Media Library operations
  getMediaLibraryItems(userId?: number): Promise<MediaLibraryItem[]>;
  getMediaLibraryItemById(id: number): Promise<MediaLibraryItem | undefined>;
  createMediaLibraryItem(item: InsertMediaLibraryItem): Promise<MediaLibraryItem>;
  updateMediaLibraryItem(id: number, data: Partial<MediaLibraryItem>): Promise<MediaLibraryItem | undefined>;
  deleteMediaLibraryItem(id: number): Promise<boolean>;
  searchMediaLibrary(query: string, userId?: number): Promise<MediaLibraryItem[]>;
  getMediaLibraryItemsByType(fileType: string, userId?: number): Promise<MediaLibraryItem[]>;
  
  // Aliases for compatibility with existing code
  getMediaItem(id: number): Promise<MediaLibraryItem | undefined>;
  createMediaItem(item: InsertMediaLibraryItem): Promise<MediaLibraryItem>;
  updateMediaItem(id: number, data: Partial<MediaLibraryItem>): Promise<MediaLibraryItem | undefined>;
  deleteMediaItem(id: number): Promise<boolean>;
  
  // Category compatibility
  getCategory(id: number): Promise<{ id: number; name: string; slug: string } | undefined>;
  
  // Astronomy Photo operations
  getAstronomyPhotos(approved?: boolean): Promise<AstronomyPhoto[]>;
  createAstronomyPhoto(photo: InsertAstronomyPhoto): Promise<AstronomyPhoto>;
  approveAstronomyPhoto(id: number): Promise<AstronomyPhoto | undefined>;
  
  // Job Listing operations
  getJobListings(approved?: boolean): Promise<JobListing[]>;
  createJobListing(listing: InsertJobListing): Promise<JobListing>;
  approveJobListing(id: number): Promise<JobListing | undefined>;
  
  // Advertisement operations
  getAdvertisements(
    page?: number, 
    limit?: number, 
    includeUserData?: boolean,
    placement?: string, 
    includeNotApproved?: boolean
  ): Promise<Advertisement[]>;
  getAdvertisementById(id: number): Promise<Advertisement | undefined>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  createAdvertisementWithStatus(ad: any): Promise<Advertisement>;
  updateAdvertisement(id: number, data: Partial<Advertisement>): Promise<Advertisement | undefined>;
  approveAdvertisement(id: number): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<boolean>;
  incrementAdClick(id: number): Promise<void>;
  incrementAdImpression(id: number): Promise<void>;
  
  // Emergency Banner operations
  getActiveBanner(): Promise<EmergencyBanner | undefined>;
  createBanner(message: string, type: string, createdBy: number, expiresAt?: Date): Promise<EmergencyBanner>;
  deactivateBanner(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(): Promise<{ id: number; name: string; slug: string }[]>;
  getCategoryByName(name: string): Promise<{ id: number; name: string; slug: string } | undefined>;
  getCategoryBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | undefined>;
  createCategory(data: { name: string; description?: string; }): Promise<{ id: number; name: string; slug: string }>;
  updateCategory(id: number, data: { name?: string; slug?: string; description?: string; }): Promise<{ id: number; name: string; slug: string } | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Site Settings operations
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(settingsId: number, data: Partial<SiteSettings>, updatedBy: number): Promise<SiteSettings | undefined>;
  createDefaultSiteSettings(adminUserId: number): Promise<SiteSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // First try exact match
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (user) return user;
    
    // If no exact match, try case insensitive match
    const results = await db.select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    
    return results[0];
  }
  
  async getUserByRole(role: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.role, role))
        .limit(1);
      return user;
    } catch (error) {
      console.error("Error getting user by role:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserMembership(id: number, tier: 'free' | 'supporter' | 'pro'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        membershipTier: tier,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: number, stripeData: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeData.stripeCustomerId,
        stripeSubscriptionId: stripeData.stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(users.username);
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  
  // API Key implementations
  async createApiKey(userId: number, name: string, permissions: string[]): Promise<ApiKey> {
    // Generate a random API key (UUID + random string)
    const key = `pk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;
    
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        userId,
        name,
        key,
        permissions,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year expiry by default
      })
      .returning();
    
    return apiKey;
  }
  
  async getApiKeysByUser(userId: number): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }
  
  async getApiKey(id: number): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id));
    return apiKey;
  }
  
  async getApiKeyByValue(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key));
    return apiKey;
  }
  
  async deleteApiKey(id: number): Promise<boolean> {
    const result = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id));
    return !!result;
  }
  
  async updateApiKeyLastUsed(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));
  }

  // Article operations
  async getArticles(limit = 10, offset = 0): Promise<Article[]> {
    try {
      // Use a simple SQL query to avoid schema mismatch issues during migration
      const result = await db.execute(sql`
        SELECT * FROM articles 
        WHERE published_at IS NOT NULL 
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      
      return result.rows as Article[];
    } catch (error) {
      console.error("Error in getArticles:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  }
  
  async getAllArticles(): Promise<Article[]> {
    try {
      // Get all articles without filtering by status
      const result = await db.execute(sql`
        SELECT * FROM articles 
        ORDER BY updated_at DESC
      `);
      
      return result.rows as Article[];
    } catch (error) {
      console.error("Error in getAllArticles:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return [];
    }
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    try {
      // Use a more explicit query with proper column mappings like we do in getArticleById
      const query = `
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
        WHERE slug = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [slug]);
      
      if (result.rows.length > 0) {
        console.log("Article found with slug:", slug);
        return result.rows[0] as Article;
      }
      
      console.log("No article found with slug:", slug);
      return undefined;
    } catch (error) {
      console.error("Error in getArticleBySlug:", error);
      return undefined;
    }
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    try {
      // Use a simple direct query with fixed column mapping for known columns
      const query = `
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
        WHERE id = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length > 0) {
        console.log("Article found with id:", id);
        return result.rows[0] as Article;
      }
      
      console.log("No article found with id:", id);
      return undefined;
    } catch (error) {
      console.error("Error in getArticleById:", error);
      return undefined;
    }
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    try {
      // Extract authors data if present
      const { authors, authorId, primaryAuthorId, ...articleData } = article as any;
      
      // Use either authorId or primaryAuthorId (for backward compatibility)
      // The database column is actually 'author_id' not 'primary_author_id'
      const authorIdToUse = authorId || primaryAuthorId;
      
      console.log("Starting article creation with authorId:", authorIdToUse);
      
      if (!authorIdToUse) {
        throw new Error("Author ID is required for article creation");
      }
      
      // Create the article using direct SQL with inline values to avoid parameter binding issues
      // Process content field if it's a string
      const contentToSave = typeof articleData.content === 'string' 
        ? { content: articleData.content } 
        : articleData.content;
      
      const contentForDb = JSON.stringify(contentToSave).replace(/'/g, "''"); // Escape single quotes for PostgreSQL
      const summary = (articleData.summary || '').replace(/'/g, "''");
      const title = articleData.title.replace(/'/g, "''");
      const slug = articleData.slug.replace(/'/g, "''");
      const category = articleData.category.replace(/'/g, "''");
      const status = (articleData.status || 'draft').replace(/'/g, "''");
      
      // Use a minimal set of columns that we know exist in the database
      const query = `
        INSERT INTO articles 
          (title, slug, summary, content, author_id, category, status) 
        VALUES 
          ('${title}', '${slug}', '${summary}', '${contentForDb}', ${authorIdToUse}, '${category}', '${status}')
        RETURNING *
      `;
      
      console.log("Executing article insert with direct SQL");
      
      const result = await pool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error("Article creation failed - no rows returned");
      }
      
      console.log("Article created successfully with ID:", result.rows[0].id);
      
      const newArticle = result.rows[0];
      
      // Map the result back to application's expected format
      // The database uses snake_case but our app expects camelCase
      newArticle.primaryAuthorId = newArticle.author_id;
      newArticle.featuredImage = newArticle.featured_image;
      newArticle.isBreaking = newArticle.is_breaking;
      newArticle.readTime = newArticle.read_time;
      newArticle.publishedAt = newArticle.published_at;
      newArticle.createdAt = newArticle.created_at;
      newArticle.updatedAt = newArticle.updated_at;
      // Add properties that don't exist in the database but are expected by the front-end
      newArticle.isCollaborative = false;
      
      // Add authors array to the article
      newArticle.authors = [];
      
      // Always add authors to the article
      // First add the primary author
      const primaryAuthor = await this.addAuthorToArticle(newArticle.id, authorIdToUse, "primary");
      newArticle.authors.push({
        userId: authorIdToUse,
        articleId: newArticle.id,
        role: "primary"
      });
      
      // Add coauthors if provided
      if (articleData.authors && Array.isArray(articleData.authors)) {
        for (const author of articleData.authors) {
          // Skip the primary author as we already added them
          if (author.id !== authorIdToUse) {
            await this.addAuthorToArticle(newArticle.id, author.id, author.role || "coauthor");
            newArticle.authors.push({
              userId: author.id,
              articleId: newArticle.id,
              role: author.role || "coauthor"
            });
          }
        }
      }
      
      return newArticle;
    } catch (error: any) {
      console.error("Error creating article:", error);
      
      // Pass through Postgres errors with their codes intact
      if (error.code) {
        throw error;
      }
      
      // Format other errors
      throw new Error(`Error creating article: ${error.message || String(error)}`);
    }
  }

  async updateArticle(id: number, data: Partial<Article>): Promise<Article | undefined> {
    try {
      // Let's use a different approach with a direct SQL update
      // to avoid schema mismatches between code and database
      
      // Prepare fields we want to update
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Add each field that's defined
      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }
      
      if (data.slug !== undefined) {
        updates.push(`slug = $${paramIndex++}`);
        values.push(data.slug);
      }
      
      if (data.summary !== undefined) {
        updates.push(`summary = $${paramIndex++}`);
        // Ensure summary is a string to avoid JSON formatting issues
        const summaryString = data.summary === '' ? ' ' : data.summary || ' ';
        values.push(summaryString);
      }
      
      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        // Properly handle JSONB content
        try {
          // If it's an object, convert to JSON string
          if (typeof data.content === 'object') {
            values.push(JSON.stringify(data.content || {}));
          } else if (typeof data.content === 'string') {
            // If it's a string, make sure it's valid JSON
            try {
              // Try to parse it to validate it's proper JSON
              JSON.parse(data.content);
              // If it doesn't throw, it's valid JSON
              values.push(data.content);
            } catch (e) {
              // If not valid JSON, wrap it as a JSON string
              values.push(JSON.stringify({ content: data.content || '' }));
            }
          } else {
            // Default fallback
            values.push('{}');
          }
        } catch (error) {
          console.error("Error handling content as JSON:", error);
          values.push('{}');
        }
      }
      
      if (data.featuredImage !== undefined) {
        updates.push(`featured_image = $${paramIndex++}`);
        values.push(data.featuredImage);
      }
      
      if (data.isBreaking !== undefined) {
        updates.push(`is_breaking = $${paramIndex++}`);
        values.push(data.isBreaking);
      }
      
      if (data.readTime !== undefined) {
        updates.push(`read_time = $${paramIndex++}`);
        values.push(data.readTime);
      }
      
      if (data.tags !== undefined) {
        if (Array.isArray(data.tags) && data.tags.length > 0) {
          // For non-empty arrays, we need to handle each element as a separate parameter
          const placeholders = data.tags.map((_, idx) => `$${paramIndex + idx}`).join(',');
          updates.push(`tags = ARRAY[${placeholders}]::TEXT[]`);
          data.tags.forEach(tag => values.push(tag));
          paramIndex += data.tags.length;
        } else {
          // For empty arrays, use a SQL expression that creates an empty array
          updates.push(`tags = '{}'::TEXT[]`);
        }
      }
      
      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(data.category);
      }
      
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      
      // Always update the timestamp
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());
      
      // Add the ID as the last parameter
      values.push(id);
      
      // If no fields to update, just return the original article
      if (updates.length === 0) {
        return this.getArticleById(id);
      }
      
      // Create and execute the SQL query
      const sql = `
        UPDATE articles 
        SET ${updates.join(', ')} 
        WHERE id = $${values.length} 
        RETURNING *
      `;
      
      const result = await pool.query(sql, values);
      
      if (result.rows.length > 0) {
        return result.rows[0] as Article;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error in updateArticle:", error);
      throw error;
    }
  }

  async deleteArticle(id: number): Promise<boolean> {
    // First delete all author associations
    await db.delete(articleAuthors).where(eq(articleAuthors.articleId, id));
    
    // Then delete the article
    const result = await db.delete(articles).where(eq(articles.id, id));
    return true;
  }
  
  // Article Author operations
  async addAuthorToArticle(articleId: number, userId: number, role = "author"): Promise<ArticleAuthor> {
    try {
      // Use direct SQL to avoid schema mismatches
      const query = `
        INSERT INTO article_authors
          (article_id, user_id, role, created_at, updated_at)
        VALUES 
          (${articleId}, ${userId}, '${role}', NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error("Failed to add author to article");
      }
      
      // Map snake_case to camelCase
      const authorRecord = result.rows[0];
      authorRecord.articleId = authorRecord.article_id;
      authorRecord.userId = authorRecord.user_id;
      authorRecord.createdAt = authorRecord.created_at;
      authorRecord.updatedAt = authorRecord.updated_at;
      
      return authorRecord;
    } catch (error) {
      console.error("Error adding author to article:", error);
      throw error;
    }
  }

  async removeAuthorFromArticle(articleId: number, userId: number): Promise<boolean> {
    await db.delete(articleAuthors)
      .where(and(
        eq(articleAuthors.articleId, articleId),
        eq(articleAuthors.userId, userId)
      ));
    
    return true;
  }

  async getArticleAuthors(articleId: number): Promise<(ArticleAuthor & { user: User })[]> {
    try {
      const authors = await db.select({
        articleId: articleAuthors.articleId,
        userId: articleAuthors.userId,
        role: articleAuthors.role,
        createdAt: articleAuthors.createdAt,
        user: users
      })
      .from(articleAuthors)
      .innerJoin(users, eq(articleAuthors.userId, users.id))
      .where(eq(articleAuthors.articleId, articleId));
      
      return authors.map(row => ({
        articleId: row.articleId,
        userId: row.userId,
        role: row.role,
        createdAt: row.createdAt,
        user: row.user
      }));
    } catch (error) {
      console.error("Error fetching article authors:", error);
      return [];
    }
  }

  async getAuthoredArticles(userId: number): Promise<(ArticleAuthor & { article: Article })[]> {
    const authoredArticles = await db.select({
      articleAuthor: articleAuthors,
      article: articles
    })
    .from(articleAuthors)
    .innerJoin(articles, eq(articleAuthors.articleId, articles.id))
    .where(eq(articleAuthors.userId, userId));
    
    return authoredArticles.map(row => ({
      ...row.articleAuthor,
      article: row.article
    }));
  }

  async getArticlesByAuthor(authorId: number): Promise<Article[]> {
    try {
      // Use a direct SQL query during migration to avoid schema issues
      // This will find articles where the user is the author (original schema)
      const result = await db.execute(sql`
        SELECT * FROM articles 
        WHERE author_id = ${authorId}
        ORDER BY published_at DESC
      `);
      
      return result.rows as Article[];
    } catch (error) {
      console.error("Error in getArticlesByAuthor:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // If the query failed (probably because author_id doesn't exist anymore),
      // return an empty array until we complete the migration
      return [];
    }
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(and(
        eq(articles.category, category),
        not(isNull(articles.publishedAt))
      ))
      .orderBy(desc(articles.publishedAt));
  }

  async getFeaturedArticles(limit = 5): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(and(
        not(isNull(articles.publishedAt)),
        eq(articles.isBreaking, true)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  }

  async searchArticles(query: string): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(and(
        not(isNull(articles.publishedAt)),
        or(
          like(articles.title, `%${query}%`),
          like(articles.summary, `%${query}%`)
        )
      ))
      .orderBy(desc(articles.publishedAt));
  }
  
  async getArticlesByStatus(status: string): Promise<Article[]> {
    try {
      // Use a direct SQL query during migration to avoid schema issues
      const result = await db.execute(sql`
        SELECT * FROM articles 
        WHERE status = ${status}
        ORDER BY updated_at DESC
      `);
      
      return result.rows as Article[];
    } catch (error) {
      console.error("Error fetching articles by status:", error);
      return [];
    }
  }
  
  async getAuthorDrafts(authorId: number): Promise<Article[]> {
    try {
      // First get all article IDs where the user is an author
      const authoredArticlesResult = await db.execute(sql`
        SELECT article_id FROM article_authors
        WHERE user_id = ${authorId}
      `);
      
      // Extract article IDs
      const articleIds = authoredArticlesResult.rows.map(row => row.article_id);
      
      if (articleIds.length === 0) {
        return [];
      }
      
      // Format IDs for SQL IN clause
      const idList = articleIds.join(',');
      
      // Get all draft articles where the user is an author
      const result = await db.execute(sql`
        SELECT * FROM articles 
        WHERE id IN (${sql.raw(idList)}) 
        AND status = 'draft'
        ORDER BY updated_at DESC
      `);
      
      return result.rows as Article[];
    } catch (error) {
      console.error("Error fetching author drafts:", error);
      return [];
    }
  }

  // Comment operations
  async getCommentsByArticle(articleId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(and(
        eq(comments.articleId, articleId),
        isNull(comments.parentId) // Get only top-level comments
      ))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentById(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    const [comment] = await db
      .update(comments)
      .set({ 
        content,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async getCommentReplies(commentId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.parentId, commentId))
      .orderBy(desc(comments.createdAt));
  }

  // Vote operations
  async addVote(userId: number, commentId: number, voteType: string): Promise<void> {
    // First remove any existing vote
    await db.delete(votes).where(
      and(
        eq(votes.userId, userId),
        eq(votes.commentId, commentId)
      )
    );
    
    // Then add the new vote
    await db.insert(votes).values({
      userId,
      commentId,
      voteType
    });
    
    // Update the comment's vote counts
    if (voteType === 'up') {
      await db
        .update(comments)
        .set({
          upvotes: sql`${comments.upvotes} + 1`
        })
        .where(eq(comments.id, commentId));
    } else if (voteType === 'down') {
      await db
        .update(comments)
        .set({
          downvotes: sql`${comments.downvotes} + 1`
        })
        .where(eq(comments.id, commentId));
    }
  }

  async removeVote(userId: number, commentId: number): Promise<void> {
    // First get the existing vote
    const [existingVote] = await db
      .select({ voteType: votes.voteType })
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.commentId, commentId)
        )
      );
    
    if (!existingVote) return;
    
    // Remove the vote
    await db.delete(votes).where(
      and(
        eq(votes.userId, userId),
        eq(votes.commentId, commentId)
      )
    );
    
    // Update the comment's vote counts
    if (existingVote.voteType === 'up') {
      await db
        .update(comments)
        .set({
          upvotes: sql`${comments.upvotes} - 1`
        })
        .where(eq(comments.id, commentId));
    } else if (existingVote.voteType === 'down') {
      await db
        .update(comments)
        .set({
          downvotes: sql`${comments.downvotes} - 1`
        })
        .where(eq(comments.id, commentId));
    }
  }

  async getVote(userId: number, commentId: number): Promise<{ voteType: string } | undefined> {
    const [vote] = await db
      .select({ voteType: votes.voteType })
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.commentId, commentId)
        )
      );
    return vote;
  }

  // Astronomy Photo operations
  async getAstronomyPhotos(approved = true): Promise<AstronomyPhoto[]> {
    return await db
      .select()
      .from(astronomyPhotos)
      .where(eq(astronomyPhotos.isApproved, approved))
      .orderBy(desc(astronomyPhotos.createdAt));
  }

  async createAstronomyPhoto(photo: InsertAstronomyPhoto): Promise<AstronomyPhoto> {
    const [newPhoto] = await db.insert(astronomyPhotos).values(photo).returning();
    return newPhoto;
  }

  async approveAstronomyPhoto(id: number): Promise<AstronomyPhoto | undefined> {
    const [photo] = await db
      .update(astronomyPhotos)
      .set({ isApproved: true })
      .where(eq(astronomyPhotos.id, id))
      .returning();
    return photo;
  }

  // Job Listing operations
  async getJobListings(approved = true): Promise<JobListing[]> {
    return await db
      .select()
      .from(jobListings)
      .where(eq(jobListings.isApproved, approved))
      .orderBy(desc(jobListings.createdAt));
  }

  async createJobListing(listing: InsertJobListing): Promise<JobListing> {
    const [newListing] = await db.insert(jobListings).values(listing).returning();
    return newListing;
  }

  async approveJobListing(id: number): Promise<JobListing | undefined> {
    const [listing] = await db
      .update(jobListings)
      .set({ isApproved: true })
      .where(eq(jobListings.id, id))
      .returning();
    return listing;
  }

  // Advertisement operations
  async getAdvertisements(
    page: number = 1, 
    limit: number = 10, 
    includeUserData: boolean = false, 
    placement?: string, 
    includeNotApproved: boolean = false
  ): Promise<Advertisement[]> {
    let conditions = [];
    
    console.log(`Running advertisement query with params:`, { 
      page, 
      limit, 
      includeUserData, 
      placement, 
      includeNotApproved 
    });
    
    // Only apply approval and date filters if we're not including unapproved ads
    if (!includeNotApproved) {
      // Check both isApproved field AND status field for consistency
      conditions.push(eq(advertisements.isApproved, true));
      conditions.push(sql`${advertisements.status} = 'active'`);
      conditions.push(sql`${advertisements.startDate} <= NOW()`);
      conditions.push(sql`${advertisements.endDate} >= NOW()`);
    }
    
    // Add placement filter if provided and not 'all'
    if (placement && placement !== 'all') {
      conditions.push(eq(advertisements.placement, placement));
    }
    
    // Build base query
    let baseQuery;
    if (conditions.length > 0) {
      baseQuery = db.select().from(advertisements).where(and(...conditions));
    } else {
      // If no conditions (or 'all' with includeNotApproved=true), just get all ads
      baseQuery = db.select().from(advertisements);
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    
    // If includeUserData is true, join with users table to get user information
    let results;
    if (includeUserData) {
      results = await db.select({
        advertisement: advertisements,
        user: {
          id: users.id,
          username: users.username,
          email: users.email
        }
      })
      .from(advertisements)
      .leftJoin(users, eq(advertisements.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(advertisements.createdAt));
      
      // Transform results to include user as a nested object
      results = results.map(row => ({
        ...row.advertisement,
        user: row.user.id ? {
          id: row.user.id,
          username: row.user.username,
          email: row.user.email
        } : null
      }));
    } else {
      // Standard query without user data
      results = await baseQuery
        .limit(limit)
        .offset(offset)
        .orderBy(desc(advertisements.createdAt));
    }
    
    console.log(`Found ${results.length} advertisements` + (includeNotApproved ? ' (including unapproved)' : ' (approved only)'));
    
    // Log a more detailed breakdown
    if (results.length > 0) {
      console.log(`Ad distribution: approved=${results.filter(ad => ad.isApproved).length}, unapproved=${results.filter(ad => !ad.isApproved).length}`);
      
      if (results.length <= 5) {
        // Log each ad for debugging when there aren't too many
        results.forEach(ad => {
          console.log(`Ad ID ${ad.id}: "${ad.title}" - isApproved=${ad.isApproved}, placement=${ad.placement}`);
        });
      }
    }
    
    return results;
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [newAd] = await db.insert(advertisements).values(ad).returning();
    return newAd;
  }
  
  async createAdvertisementWithStatus(ad: any): Promise<Advertisement> {
    const [newAd] = await db.insert(advertisements).values(ad).returning();
    return newAd;
  }

  async approveAdvertisement(id: number): Promise<Advertisement | undefined> {
    // Update both isApproved field and status field for consistency
    const [ad] = await db
      .update(advertisements)
      .set({ 
        isApproved: true,
        status: 'active'  // Synchronize status with isApproved
      })
      .where(eq(advertisements.id, id))
      .returning();
    
    console.log(`Advertisement ${id} approved: status=${ad.status}, isApproved=${ad.isApproved}`);
    return ad;
  }
  
  async getAdvertisementById(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id))
      .limit(1);
    
    return ad;
  }
  
  async updateAdvertisement(id: number, data: Partial<Advertisement>): Promise<Advertisement | undefined> {
    const [ad] = await db
      .update(advertisements)
      .set(data)
      .where(eq(advertisements.id, id))
      .returning();
    
    return ad;
  }
  
  async getAdvertisementsByUser(userId: number): Promise<Advertisement[]> {
    try {
      return await db.select()
        .from(advertisements)
        .where(eq(advertisements.userId, userId))
        .orderBy(desc(advertisements.createdAt));
    } catch (error) {
      console.error("Error fetching user advertisements:", error);
      return [];
    }
  }
  
  async deleteAdvertisement(id: number): Promise<boolean> {
    const result = await db
      .delete(advertisements)
      .where(eq(advertisements.id, id))
      .returning({ id: advertisements.id });
    
    return result.length > 0;
  }
  
  async incrementAdClick(id: number): Promise<void> {
    await db
      .update(advertisements)
      .set({ 
        clicks: sql`${advertisements.clicks} + 1` 
      })
      .where(eq(advertisements.id, id));
  }
  
  async incrementAdImpression(id: number): Promise<void> {
    await db
      .update(advertisements)
      .set({ 
        impressions: sql`${advertisements.impressions} + 1` 
      })
      .where(eq(advertisements.id, id));
  }

  // Emergency Banner operations
  async getActiveBanner(): Promise<EmergencyBanner | undefined> {
    const [banner] = await db
      .select()
      .from(emergencyBanners)
      .where(and(
        eq(emergencyBanners.isActive, true),
        or(
          isNull(emergencyBanners.expiresAt),
          sql`${emergencyBanners.expiresAt} > NOW()`
        )
      ))
      .orderBy(desc(emergencyBanners.createdAt))
      .limit(1);
    
    return banner;
  }

  async createBanner(message: string, type: string, createdBy: number, expiresAt?: Date): Promise<EmergencyBanner> {
    // First deactivate all current banners
    await db
      .update(emergencyBanners)
      .set({ isActive: false })
      .where(eq(emergencyBanners.isActive, true));
    
    // Then create the new banner
    const [banner] = await db
      .insert(emergencyBanners)
      .values({
        message,
        type,
        isActive: true,
        createdBy,
        expiresAt,
      })
      .returning();
    
    return banner;
  }

  async deactivateBanner(id: number): Promise<boolean> {
    await db
      .update(emergencyBanners)
      .set({ isActive: false })
      .where(eq(emergencyBanners.id, id));
    
    return true;
  }

  // Category operations
  async getCategories(): Promise<{ id: number; name: string; slug: string }[]> {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories);
  }

  async getCategoryByName(name: string): Promise<{ id: number; name: string; slug: string } | undefined> {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(eq(categories.name, name));
    
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | undefined> {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(eq(categories.slug, slug));
    
    return category;
  }
  
  // Alias for compatibility with existing code
  async getCategory(id: number): Promise<{ id: number; name: string; slug: string } | undefined> {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .where(eq(categories.id, id));
    
    return category;
  }
  
  async createCategory(data: { name: string; description?: string; }): Promise<{ id: number; name: string; slug: string }> {
    // Create a slug from the name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: data.name,
        slug: slug,
        description: data.description,
      })
      .returning({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      });
    
    return newCategory;
  }
  
  async updateCategory(id: number, data: { name?: string; slug?: string; description?: string; }): Promise<{ id: number; name: string; slug: string } | undefined> {
    // If name is changing but slug isn't provided, auto-generate slug
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      });
    
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    
    return result.rowCount > 0;
  }

  // Media Library operations
  // Aliases for compatibility with existing code
  getMediaItem(id: number): Promise<MediaLibraryItem | undefined> {
    return this.getMediaLibraryItemById(id);
  }
  
  createMediaItem(item: InsertMediaLibraryItem): Promise<MediaLibraryItem> {
    return this.createMediaLibraryItem(item);
  }
  
  updateMediaItem(id: number, data: Partial<MediaLibraryItem>): Promise<MediaLibraryItem | undefined> {
    return this.updateMediaLibraryItem(id, data);
  }
  
  deleteMediaItem(id: number): Promise<boolean> {
    return this.deleteMediaLibraryItem(id);
  }
  
  async getMediaLibraryItems(userId?: number): Promise<MediaLibraryItem[]> {
    let query = db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
    
    if (userId) {
      query = query.where(eq(mediaLibrary.userId, userId));
    }
    
    return await query;
  }
  
  async getMediaLibraryItemById(id: number): Promise<MediaLibraryItem | undefined> {
    const [item] = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id));
    return item;
  }
  
  async createMediaLibraryItem(item: InsertMediaLibraryItem): Promise<MediaLibraryItem> {
    const [newItem] = await db.insert(mediaLibrary).values(item).returning();
    return newItem;
  }
  
  async updateMediaLibraryItem(id: number, data: Partial<MediaLibraryItem>): Promise<MediaLibraryItem | undefined> {
    const [updatedItem] = await db
      .update(mediaLibrary)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(mediaLibrary.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async deleteMediaLibraryItem(id: number): Promise<boolean> {
    const result = await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
    return !!result;
  }
  
  async searchMediaLibrary(query: string, userId?: number): Promise<MediaLibraryItem[]> {
    let dbQuery = db
      .select()
      .from(mediaLibrary)
      .where(
        or(
          like(mediaLibrary.fileName, `%${query}%`),
          like(mediaLibrary.altText || '', `%${query}%`),
          like(mediaLibrary.caption || '', `%${query}%`)
        )
      )
      .orderBy(desc(mediaLibrary.createdAt));
    
    if (userId) {
      dbQuery = dbQuery.where(eq(mediaLibrary.userId, userId));
    }
    
    return await dbQuery;
  }
  
  async getMediaLibraryItemsByType(fileType: string, userId?: number): Promise<MediaLibraryItem[]> {
    let query = db
      .select()
      .from(mediaLibrary)
      .where(eq(mediaLibrary.fileType, fileType as any))
      .orderBy(desc(mediaLibrary.createdAt));
    
    if (userId) {
      query = query.where(eq(mediaLibrary.userId, userId));
    }
    
    return await query;
  }
  
  // Site Settings Operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    try {
      const [settings] = await db.select().from(siteSettings).limit(1);
      return settings;
    } catch (error) {
      console.error("Error fetching site settings:", error);
      return undefined;
    }
  }
  
  async updateSiteSettings(settingsId: number, data: Partial<SiteSettings>, updatedBy: number): Promise<SiteSettings | undefined> {
    try {
      console.log("Storage: Updating site settings with ID:", settingsId);
      console.log("Storage: Update data:", data);
      console.log("Storage: Updated by user ID:", updatedBy);
      
      // First check if the settings exist
      const existingSettings = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.id, settingsId))
        .limit(1);
        
      if (!existingSettings || existingSettings.length === 0) {
        console.error("Settings with ID", settingsId, "not found");
        return undefined;
      }
      
      console.log("Storage: Existing settings found:", existingSettings[0]);
      
      // Prepare data for update, filtering out any null/undefined values and ensuring proper date types
      const updateData: Record<string, any> = { 
        updatedAt: new Date(),
        updatedBy 
      };
      
      // Only include defined values from the input data, convert string dates to Date objects
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          // Handle timestamp fields
          if (key === 'updatedAt' && typeof value === 'string') {
            updateData[key] = new Date(value);
          } 
          // Special handling for maintenanceEndTime
          else if (key === 'maintenanceEndTime') {
            // Convert empty strings to null for the timestamp field
            if (value === '' || value === null) {
              updateData[key] = null;
            } else if (typeof value === 'string' && value.trim()) {
              // Only set the date if we have a non-empty string
              updateData[key] = new Date(value);
            }
          } else {
            updateData[key] = value;
          }
        }
      });
      
      console.log("Storage: Final update data:", updateData);
      
      // Perform the update
      const [updatedSettings] = await db
        .update(siteSettings)
        .set(updateData)
        .where(eq(siteSettings.id, settingsId))
        .returning();
        
      console.log("Storage: Update result:", updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error("Error updating site settings:", error);
      return undefined;
    }
  }
  
  async createDefaultSiteSettings(adminUserId: number): Promise<SiteSettings> {
    try {
      // Check if settings already exist
      const existingSettings = await this.getSiteSettings();
      if (existingSettings) {
        return existingSettings;
      }
      
      // Create default settings
      const [newSettings] = await db
        .insert(siteSettings)
        .values({
          updatedBy: adminUserId,
        })
        .returning();
        
      return newSettings;
    } catch (error) {
      console.error("Error creating default site settings:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
