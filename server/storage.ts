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
  type InsertArticleAuthor
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc, sql, or, like, not } from "drizzle-orm";
import { z } from "zod";

// Storage interface 
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserMembership(id: number, tier: 'free' | 'supporter' | 'pro'): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeData: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  
  // API Key operations
  createApiKey(userId: number, name: string, permissions: string[]): Promise<ApiKey>;
  getApiKeysByUser(userId: number): Promise<ApiKey[]>;
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeyByValue(key: string): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;
  updateApiKeyLastUsed(id: number): Promise<void>;
  
  // Article operations
  getArticles(limit?: number, offset?: number): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticleById(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, data: Partial<Article>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  getArticlesByAuthor(authorId: number): Promise<Article[]>;
  getArticlesByCategory(category: string): Promise<Article[]>;
  getFeaturedArticles(limit?: number): Promise<Article[]>;
  searchArticles(query: string): Promise<Article[]>;
  
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
  
  // Astronomy Photo operations
  getAstronomyPhotos(approved?: boolean): Promise<AstronomyPhoto[]>;
  createAstronomyPhoto(photo: InsertAstronomyPhoto): Promise<AstronomyPhoto>;
  approveAstronomyPhoto(id: number): Promise<AstronomyPhoto | undefined>;
  
  // Job Listing operations
  getJobListings(approved?: boolean): Promise<JobListing[]>;
  createJobListing(listing: InsertJobListing): Promise<JobListing>;
  approveJobListing(id: number): Promise<JobListing | undefined>;
  
  // Advertisement operations
  getAdvertisements(placement?: string): Promise<Advertisement[]>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  approveAdvertisement(id: number): Promise<Advertisement | undefined>;
  
  // Emergency Banner operations
  getActiveBanner(): Promise<EmergencyBanner | undefined>;
  createBanner(message: string, type: string, createdBy: number, expiresAt?: Date): Promise<EmergencyBanner>;
  deactivateBanner(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(): Promise<{ id: number; name: string; slug: string }[]>;
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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
    return await db
      .select()
      .from(articles)
      .where(not(isNull(articles.publishedAt)))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
    return article;
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    
    // If this is a collaborative article, add the primary author to the article_authors table
    if (article.isCollaborative) {
      await this.addAuthorToArticle(newArticle.id, newArticle.primaryAuthorId);
    }
    
    return newArticle;
  }

  async updateArticle(id: number, data: Partial<Article>): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ 
        ...data, 
        updatedAt: new Date(),
        // If lastEditedBy is provided, also update lastEditedAt
        ...(data.lastEditedBy ? { lastEditedAt: new Date() } : {})
      })
      .where(eq(articles.id, id))
      .returning();
    return article;
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
    const [authorRecord] = await db.insert(articleAuthors)
      .values({ articleId, userId, role })
      .returning();
    
    return authorRecord;
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
    const authors = await db.select({
      articleAuthor: articleAuthors,
      user: users
    })
    .from(articleAuthors)
    .innerJoin(users, eq(articleAuthors.userId, users.id))
    .where(eq(articleAuthors.articleId, articleId));
    
    return authors.map(row => ({
      ...row.articleAuthor,
      user: row.user
    }));
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
    return await db
      .select()
      .from(articles)
      .where(eq(articles.authorId, authorId))
      .orderBy(desc(articles.publishedAt));
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
  async getAdvertisements(placement?: string): Promise<Advertisement[]> {
    let query = db
      .select()
      .from(advertisements)
      .where(and(
        eq(advertisements.isApproved, true),
        sql`${advertisements.startDate} <= NOW()`,
        sql`${advertisements.endDate} >= NOW()`
      ));
    
    if (placement) {
      query = query.where(eq(advertisements.placement, placement));
    }
    
    return await query;
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [newAd] = await db.insert(advertisements).values(ad).returning();
    return newAd;
  }

  async approveAdvertisement(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db
      .update(advertisements)
      .set({ isApproved: true })
      .where(eq(advertisements.id, id))
      .returning();
    return ad;
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
}

export const storage = new DatabaseStorage();
