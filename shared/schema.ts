import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums for role and membership tiers
export const roleEnum = pgEnum("role", ["user", "author", "editor", "admin"]);
export const membershipTierEnum = pgEnum("membership_tier", ["free", "supporter", "pro"]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video", "document", "audio"]);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  profilePicture: text("profile_picture"),
  bio: text("bio").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: roleEnum("role").default("user").notNull(),
  membershipTier: membershipTierEnum("membership_tier").default("free").notNull(),
  themePreference: text("theme_preference").default("dark"),
  profileCustomization: jsonb("profile_customization").default({}).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lastLoginAt: timestamp("last_login_at"),
});

// Articles
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: jsonb("content").notNull(),
  primaryAuthorId: integer("primary_author_id").notNull().references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  featuredImage: text("featured_image"),
  isBreaking: boolean("is_breaking").default(false),
  readTime: integer("read_time").default(0),
  viewCount: integer("view_count").default(0),
  tags: text("tags").array(),
  category: text("category").notNull(),
  status: text("status").default("draft").notNull(), // "draft", "published", "needs_edits", "good_to_publish", "do_not_publish"
  lastEditedBy: integer("last_edited_by").references(() => users.id),
  lastEditedAt: timestamp("last_edited_at"),
  isCollaborative: boolean("is_collaborative").default(false),
  collaborativeSessionId: text("collaborative_session_id"),
});

// Article Authors (many-to-many table for multiple authors per article)
export const articleAuthors = pgTable("article_authors", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("author").notNull(), // "author", "editor", "contributor"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    articleUserIdx: uniqueIndex("article_user_idx").on(table.articleId, table.userId),
  };
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
  parentId: integer("parent_id").references(() => comments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
});

// Votes (for comment voting system)
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  commentId: integer("comment_id").notNull().references(() => comments.id),
  voteType: text("vote_type").notNull(), // "up" or "down"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userCommentIdx: uniqueIndex("user_comment_idx").on(table.userId, table.commentId),
  };
});

// Astronomy Photos
export const astronomyPhotos = pgTable("astronomy_photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isApproved: boolean("is_approved").default(false),
  location: text("location"),
  equipmentUsed: text("equipment_used"),
});

// Job Listings
export const jobListings = pgTable("job_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  salary: text("salary"),
  applicationUrl: text("application_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  userId: integer("user_id").notNull().references(() => users.id),
  isApproved: boolean("is_approved").default(false),
  category: text("category").notNull(),
});

// Advertisements
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  linkUrl: text("link_url").notNull(),
  placement: text("placement").notNull(), // homepage, sidebar, inline
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  isApproved: boolean("is_approved").default(false),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, paused, completed
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, paid, failed
  paymentId: text("payment_id"), // Stripe payment ID
  price: integer("price"), // Price in cents
  adminNotes: text("admin_notes"), // Notes from admin for approval/rejection reasons
  createdAt: timestamp("created_at").defaultNow().notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
});

// Emergency Banners for site-wide notifications
export const emergencyBanners = pgTable("emergency_banners", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  type: text("type").default("info").notNull(), // info, warning, critical
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdBy: integer("created_by").references(() => users.id),
});

// Media Library for storing and managing uploaded files
export const mediaLibrary = pgTable("media_library", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: mediaTypeEnum("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  altText: text("alt_text"),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // For videos and audio in seconds
  isPublic: boolean("is_public").default(true).notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("Proxima Report").notNull(),
  siteTagline: text("site_tagline").default("STEM & Space News Platform").notNull(),
  siteDescription: text("site_description").default("A cutting-edge STEM and space news platform delivering interactive content."),
  siteKeywords: text("site_keywords").array().default(["space", "STEM", "science", "technology"]).notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#0f172a"),
  secondaryColor: text("secondary_color").default("#4f46e5"),
  googleAnalyticsId: text("google_analytics_id"),
  facebookAppId: text("facebook_app_id"),
  twitterUsername: text("twitter_username"),
  contactEmail: text("contact_email"),
  allowComments: boolean("allow_comments").default(true).notNull(),
  requireCommentApproval: boolean("require_comment_approval").default(false).notNull(),
  allowUserRegistration: boolean("allow_user_registration").default(true).notNull(),
  supporterTierPrice: integer("supporter_tier_price").default(200).notNull(), // In cents (2.00)
  proTierPrice: integer("pro_tier_price").default(400).notNull(), // In cents (4.00)
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Relations
// API Keys for external applications
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  permissions: text("permissions").array().default([]).notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  primaryAuthorArticles: many(articles, { relationName: "primaryAuthor" }),
  authoredArticles: many(articleAuthors, { relationName: "articleAuthor" }),
  comments: many(comments),
  astronomyPhotos: many(astronomyPhotos),
  jobListings: many(jobListings),
  advertisements: many(advertisements),
  apiKeys: many(apiKeys),
  lastEditedArticles: many(articles, { relationName: "lastEditor" }),
  mediaFiles: many(mediaLibrary),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  primaryAuthor: one(users, {
    fields: [articles.primaryAuthorId],
    references: [users.id],
    relationName: "primaryAuthor",
  }),
  lastEditor: one(users, {
    fields: [articles.lastEditedBy],
    references: [users.id],
    relationName: "lastEditor",
  }),
  authors: many(articleAuthors),
  comments: many(comments),
}));

export const articleAuthorsRelations = relations(articleAuthors, ({ one }) => ({
  article: one(articles, {
    fields: [articleAuthors.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [articleAuthors.userId],
    references: [users.id],
    relationName: "articleAuthor",
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments, {
    relationName: "comment_replies",
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [votes.commentId],
    references: [comments.id],
  }),
}));

export const astronomyPhotosRelations = relations(astronomyPhotos, ({ one }) => ({
  user: one(users, {
    fields: [astronomyPhotos.userId],
    references: [users.id],
  }),
}));

export const jobListingsRelations = relations(jobListings, ({ one }) => ({
  user: one(users, {
    fields: [jobListings.userId],
    references: [users.id],
  }),
}));

export const advertisementsRelations = relations(advertisements, ({ one }) => ({
  user: one(users, {
    fields: [advertisements.userId],
    references: [users.id],
  }),
}));

export const mediaLibraryRelations = relations(mediaLibrary, ({ one }) => ({
  user: one(users, {
    fields: [mediaLibrary.userId],
    references: [users.id],
  }),
}));

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [siteSettings.updatedBy],
    references: [users.id],
  }),
}));

// Zod Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  lastLoginAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  role: true,
});

export const insertArticleSchema = createInsertSchema(articles)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    viewCount: true,
    lastEditedAt: true,
    lastEditedBy: true,
    collaborativeSessionId: true,
  })
  // Add extra fields that aren't in the table but are needed for the API
  .extend({
    // Support for multiple authors in the request
    authors: z.array(
      z.object({
        id: z.number(),
        role: z.string().optional(),
      })
    ).optional(),
  });

export const insertArticleAuthorSchema = createInsertSchema(articleAuthors).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  upvotes: true,
  downvotes: true,
});

export const insertAstronomyPhotoSchema = createInsertSchema(astronomyPhotos).omit({
  id: true,
  createdAt: true,
  isApproved: true,
});

export const insertJobListingSchema = createInsertSchema(jobListings).omit({
  id: true,
  createdAt: true,
  isApproved: true,
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  createdAt: true,
  impressions: true,
  clicks: true,
  isApproved: true,
  status: true,
  paymentStatus: true,
  paymentId: true,
  adminNotes: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
  key: true // We'll generate this
});

export const insertMediaLibrarySchema = createInsertSchema(mediaLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type AstronomyPhoto = typeof astronomyPhotos.$inferSelect;
export type JobListing = typeof jobListings.$inferSelect;
export type Advertisement = typeof advertisements.$inferSelect;
export type EmergencyBanner = typeof emergencyBanners.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ArticleAuthor = typeof articleAuthors.$inferSelect;
export type MediaLibraryItem = typeof mediaLibrary.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertArticleAuthor = z.infer<typeof insertArticleAuthorSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertAstronomyPhoto = z.infer<typeof insertAstronomyPhotoSchema>;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertMediaLibraryItem = z.infer<typeof insertMediaLibrarySchema>;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;
