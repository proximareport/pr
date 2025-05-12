import { Request, Response } from "express";
import { pool } from "./db";
import { storage } from "./storage";

// SessionData interface
interface SessionData {
  userId: number;
  isAdmin: boolean;
}

/**
 * Special endpoint just for changing article status (publish/unpublish)
 * This uses direct SQL to avoid ORM issues
 */
export async function updateArticleStatus(req: Request, res: Response) {
  try {
    const articleId = Number(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }
    
    // Get the user from session
    const { userId } = req.session as SessionData;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get current article state
    const article = await storage.getArticleById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    // Check permissions - see if user is author of this article
    // Get the article authors
    const articleAuthors = await storage.getArticleAuthors(articleId);
    const isAuthor = articleAuthors.some(aa => aa.user.id === userId);
    const canModify = user.role === 'admin' || user.role === 'editor' || isAuthor;
    
    if (!canModify) {
      return res.status(403).json({ message: "You do not have permission to modify this article" });
    }
    
    // Check new status value
    const { status } = req.body;
    if (!status || (status !== 'draft' && status !== 'published')) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    console.log(`Status change request: ${article.status} → ${status}`);
    
    // Only editors and admins can publish
    if (status === 'published' && article.status !== 'published') {
      const canPublish = user.role === 'admin' || user.role === 'editor';
      if (!canPublish) {
        return res.status(403).json({ 
          message: "Only editors and admins can publish articles" 
        });
      }
    }
    
    // Direct SQL update for reliable status change
    const directSql = `
      UPDATE articles 
      SET status = $1, 
          ${status === 'published' && article.status !== 'published' ? 'published_at = $2, updated_at = $2' : 'updated_at = $2'}
      WHERE id = $3
      RETURNING *
    `;
    
    const now = new Date();
    const result = await pool.query(directSql, [status, now, articleId]);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ message: "Failed to update article status" });
    }
    
    // Return the full updated article
    const updatedArticle = result.rows[0];
    
    console.log("Article status updated:", { 
      id: updatedArticle.id, 
      status: updatedArticle.status,
      publishedAt: updatedArticle.published_at
    });
    
    return res.json({
      success: true, 
      article: updatedArticle,
      message: status === 'published' ? "Article published successfully" : "Article saved as draft"
    });
    
  } catch (error) {
    console.error("Error updating article status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}