import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LockIcon, Share2Icon, BookmarkIcon, EyeIcon, ClockIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RoleBadges } from "@/components/ui/role-badge";
import { formatDistance } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shareArticle } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ArticleContentProps {
  content: string;
}

function ArticleContent({ content }: ArticleContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Share article using shared utility
  const handleShareArticle = async () => {
    try {
      const result = await shareArticle(
        "Article Title",
        "Check out this article on Proxima Report",
        window.location.href
      );
      
      if (result) {
        toast({
          title: "Article shared!",
          description: "The article has been shared successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Failed to share the article. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading article content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-content prose prose-invert max-w-none">
      <div 
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      <style jsx>{`
        .prose-content {
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.8;
        }
        .prose-content h1, .prose-content h2, .prose-content h3, .prose-content h4, .prose-content h5, .prose-content h6 {
          color: white;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .prose-content h1 {
          font-size: 2.25rem;
          border-bottom: 2px solid rgba(168, 85, 247, 0.3);
          padding-bottom: 0.5rem;
        }
        .prose-content h2 {
          font-size: 1.875rem;
          border-bottom: 1px solid rgba(168, 85, 247, 0.2);
          padding-bottom: 0.25rem;
        }
        .prose-content h3 {
          font-size: 1.5rem;
          color: #d1d5db;
        }
        .prose-content h4, .prose-content h5, .prose-content h6 {
          font-size: 1.25rem;
          color: #9ca3af;
        }
        .prose-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
          color: #e5e7eb;
        }
        .prose-content strong {
          color: #ffffff;
          font-weight: 600;
        }
        .prose-content em {
          color: #d1d5db;
        }
        .prose-content ul, .prose-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .prose-content li {
          margin-bottom: 0.5rem;
          color: #e5e7eb;
        }
        .prose-content blockquote {
          border-left: 4px solid #a855f7;
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: #d1d5db;
          background-color: rgba(168, 85, 247, 0.05);
          padding: 1.5rem;
          border-radius: 0.5rem;
        }
        .prose-content blockquote p {
          margin: 0;
        }
        .prose-content img {
          border-radius: 0.75rem;
          margin: 2rem 0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease;
        }
        .prose-content img:hover {
          transform: scale(1.02);
        }
        .prose-content a {
          color: #a855f7;
          text-decoration: none;
          border-bottom: 1px solid rgba(168, 85, 247, 0.3);
          transition: all 0.3s ease;
        }
        .prose-content a:hover {
          color: #c084fc;
          border-bottom-color: #c084fc;
        }
        .prose-content code {
          background-color: rgba(168, 85, 247, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875em;
          color: #fbbf24;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .prose-content pre {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }
        .prose-content pre code {
          background: none;
          padding: 0;
          border: none;
          color: #e5e7eb;
        }
        .prose-content hr {
          border-color: rgba(255, 255, 255, 0.1);
          margin: 3rem 0;
        }
        .prose-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          overflow-x: auto;
          display: block;
        }
        .prose-content th, .prose-content td {
          padding: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-align: left;
        }
        .prose-content th {
          background-color: rgba(168, 85, 247, 0.1);
          color: white;
        }
        .prose-content td {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}

export default ArticleContent;
