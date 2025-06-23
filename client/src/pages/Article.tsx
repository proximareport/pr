import { useEffect, useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import ArticleContent from "@/components/article/ArticleContent";
import TableOfContents from "@/components/article/TableOfContents";
import CommentSection from "@/components/article/CommentSection";
import Advertisement from "@/components/Advertisement";
import { ChevronLeft } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { GhostPost } from '../../../server/ghostService';

interface ArticleParams {
  slug: string;
}

function Article() {
  const params = useParams<ArticleParams>();
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; content: string; level: number }>>([]);
  const { user } = useAuth();
  
  // Get slug from URL params
  const slug = params?.slug;
  
  // Fetch article data from Ghost
  const { data: article, isLoading, error } = useQuery<GhostPost>({
    queryKey: ['ghost-article', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');
      
      const response = await axios.get<GhostPost>(`/api/ghost/posts/slug/${slug}`);
      return response.data;
    },
    enabled: !!slug
  });
  
  // Extract headings from article content for TOC
  useEffect(() => {
    if (article?.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(article.html, 'text/html');
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      const extractedHeadings = Array.from(headingElements).map((heading, index) => ({
        id: `heading-${index}`,
        content: heading.textContent || '',
        level: parseInt(heading.tagName[1])
      }));
      
      setHeadings(extractedHeadings);
    }
  }, [article]);
  
  // Set up intersection observer for headings
  useEffect(() => {
    if (!headings.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );
    
    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [headings]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading article...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70 mb-6">Failed to load article</p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-white/70 mb-6">The article you're looking for doesn't exist.</p>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D17]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="mb-8">
              <Button asChild variant="ghost" className="mb-4">
                <Link href="/">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Articles
                </Link>
              </Button>
              
              <h1 className="text-4xl font-bold text-white mb-4">{article.title}</h1>
              
              <div className="flex items-center gap-4 text-white/70 mb-8">
                <div className="flex items-center gap-2">
                  <img 
                    src={article.primary_author?.profile_image || '/default-avatar.png'} 
                    alt={article.primary_author?.name || 'Author'} 
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{article.primary_author?.name || 'Unknown Author'}</span>
                </div>
                <span>•</span>
                <span>{format(new Date(article.published_at), 'MMMM d, yyyy')}</span>
                <span>•</span>
                <span>{article.reading_time || 5} min read</span>
              </div>
              
              {article.feature_image && (
                <img 
                  src={article.feature_image} 
                  alt={article.title}
                  className="w-full h-[400px] object-cover rounded-lg mb-8"
                />
              )}
            </div>
            
            <ArticleContent content={article.html} />
            
            <div className="mt-12">
              <CommentSection articleId={article.id} />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-8">
            {headings.length > 0 && (
              <div className="sticky top-8">
                <TableOfContents 
                  headings={headings} 
                  activeHeadingId={activeHeadingId} 
                />
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-bold mb-4">Sponsored</h3>
              <Advertisement placement="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Article; 