import { useEffect, useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import ArticleContent from "@/components/article/ArticleContent";
import TableOfContents from "@/components/article/TableOfContents";
import CommentSection from "@/components/article/CommentSection";
import Advertisement from "@/components/Advertisement";
import NewsletterSubscription from "@/components/NewsletterSubscription";
import { ChevronLeft, Clock, User, Calendar, Eye, Share2, Bookmark } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { GhostPost } from '../../../server/ghostService';
import { ModernButton } from "@/components/ui/modern-button";
import { shareArticle } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ArticleParams {
  slug: string;
}

function Article() {
  const params = useParams<ArticleParams>();
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; content: string; level: number }>>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
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
      // Debug: Log the article data to see what we're actually getting
      console.log('Article data received in Article component:', {
        id: article.id,
        title: article.title,
        hasReadingTime: !!article.reading_time,
        readingTimeValue: article.reading_time,
        readingTimeType: typeof article.reading_time,
        hasAuthors: !!article.authors,
        authorsLength: article.authors?.length || 0,
        hasPrimaryAuthor: !!article.primary_author,
        primaryAuthorName: article.primary_author?.name,
        authorsData: article.authors?.map(a => ({ id: a.id, name: a.name, profile_image: a.profile_image })) || [],
        primaryAuthorData: article.primary_author ? { 
          id: article.primary_author.id, 
          name: article.primary_author.name, 
          profile_image: article.primary_author.profile_image 
        } : null,
        allFields: Object.keys(article)
      });
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(article.html, 'text/html');
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      const extractedHeadings: Array<{ id: string; content: string; level: number }> = Array.from(headingElements).map((heading, index) => ({
        id: `heading-${index}`,
        content: heading.textContent || '',
        level: Number(heading.tagName[1]) || 1
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
  
  // Share and bookmark functions
  const handleShare = async () => {
    try {
      const result = await shareArticle(
        article?.title,
        `Check out this article: ${article?.title}`,
        window.location.href
      );
      
      if (result.success) {
        if (result.method === 'clipboard') {
          toast({
            title: "Link copied!",
            description: "Article link has been copied to your clipboard",
            duration: 3000,
          });
        }
        // For native sharing, no toast needed as the system provides feedback
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not share the article. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality
    toast({
      title: "Bookmark saved",
      description: "Article has been saved to your bookmarks",
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden flex flex-col">
        {/* Geometric ambient effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
        </div>
        
        <div className="relative z-10 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="animate-spin h-16 w-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto glow-effect"></div>
              <div className="absolute inset-0 animate-ping h-16 w-16 border-2 border-purple-400/30 rounded-full opacity-40"></div>
            </div>
            <p className="text-white/80 text-lg font-medium">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden flex flex-col">
        {/* Geometric ambient effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">⚠️ Error</h1>
            <p className="text-white/70 mb-8 text-lg">Failed to load article</p>
            <Link href="/">
              <ModernButton variant="futuristic">
                Back to Home
              </ModernButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden flex flex-col">
        {/* Geometric ambient effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">📄 Article Not Found</h1>
            <p className="text-white/70 mb-8 text-lg">The article you're looking for doesn't exist.</p>
            <Link href="/">
              <ModernButton variant="futuristic">
                Back to Home
              </ModernButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden flex flex-col">
      {/* Geometric ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-3 md:px-4 py-4 md:py-8 flex-grow">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="mb-6 md:mb-8">
              <Link href="/">
                <ModernButton variant="neon" className="mb-4 md:mb-8 bg-purple-500/10 hover:bg-purple-500/20 border-purple-400/30 hover:border-purple-400 text-purple-400 hover:text-purple-300 transition-all duration-300 text-sm md:text-base">
                  <ChevronLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Back to Articles
                </ModernButton>
              </Link>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent hover:from-purple-400 hover:to-violet-400 transition-all duration-500">{article.title}</h1>
              
              {/* Enhanced metadata section */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/20 shadow-2xl mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 md:gap-6 text-white/80">
                  {/* Authors */}
                  <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                    {article.authors && article.authors.length > 1 ? (
                      <div className="flex items-center gap-2 md:gap-3 group w-full sm:w-auto">
                        <div className="flex -space-x-1 md:-space-x-2 flex-shrink-0">
                          {article.authors.slice(0, 3).map((author, index) => (
                            <div key={author.id} className="relative">
                              <img 
                                src={author.profile_image || '/default-avatar.png'} 
                                alt={author.name || 'Author'} 
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-purple-400/30 transition-all duration-300 group-hover:border-purple-400 group-hover:scale-110"
                                style={{ zIndex: article.authors.length - index }}
                              />
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ))}
                          {article.authors.length > 3 && (
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-purple-400/30 bg-purple-900/50 flex items-center justify-center text-xs font-medium text-white">
                              +{article.authors.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white group-hover:text-purple-300 transition-colors duration-300 text-sm md:text-base truncate">
                            {article.authors.slice(0, 2).map(author => author.name).join(', ')}
                            {article.authors.length > 2 && ` and ${article.authors.length - 2} more`}
                          </span>
                          <span className="text-xs md:text-sm text-white/60">Authors</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 md:gap-3 group w-full sm:w-auto">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={(article.authors?.[0]?.profile_image || article.primary_author?.profile_image) || '/default-avatar.png'} 
                            alt={(article.authors?.[0]?.name || article.primary_author?.name) || 'Author'} 
                            className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-purple-400/30 transition-all duration-300 group-hover:border-purple-400 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white group-hover:text-purple-300 transition-colors duration-300 text-sm md:text-base truncate">
                            {(article.authors?.[0]?.name || article.primary_author?.name) || 'Unknown Author'}
                          </span>
                          <span className="text-xs md:text-sm text-white/60">Author</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="hidden md:block w-px h-6 md:h-8 bg-purple-500/30"></div>
                  
                  {/* Date */}
                  <div className="flex items-center gap-1 md:gap-2 hover:text-purple-300 transition-colors duration-300">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
                    <span className="font-medium text-xs md:text-sm lg:text-base">{format(new Date(article.published_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <div className="hidden md:block w-px h-6 md:h-8 bg-purple-500/30"></div>
                  
                  {/* Reading time */}
                  <div className="flex items-center gap-1 md:gap-2 hover:text-purple-300 transition-colors duration-300">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
                    <span className="font-medium text-xs md:text-sm lg:text-base">{article.reading_time || 5} min read</span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-end sm:ml-auto">
                    <button 
                      onClick={handleShare}
                      className="p-1.5 md:p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 hover:border-purple-400 text-purple-400 hover:text-purple-300 transition-all duration-300 group"
                      aria-label="Share article"
                    >
                      <Share2 className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                    <button 
                      onClick={handleBookmark}
                      className="p-1.5 md:p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 hover:border-purple-400 text-purple-400 hover:text-purple-300 transition-all duration-300 group"
                      aria-label="Bookmark article"
                    >
                      <Bookmark className="w-3 h-3 md:w-4 md:h-4 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
              
              {article.feature_image && (
                <div className="relative mb-8 overflow-hidden rounded-2xl group">
                  <img 
                    src={article.feature_image} 
                    alt={article.title}
                    className="w-full h-[400px] lg:h-[500px] object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-purple-900/10 group-hover:from-black/50 transition-all duration-500"></div>
                  <div className="absolute inset-0 border-2 border-purple-500/20 rounded-2xl group-hover:border-purple-400/40 transition-all duration-500"></div>
                </div>
              )}
            </div>
            
            {/* Article content */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 xl:p-12 border border-purple-500/20 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
              <ArticleContent content={article.html} />
            </div>
            
            {/* Comments section */}
            <div className="mt-8 md:mt-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border border-purple-500/20 shadow-2xl">
                <CommentSection 
                  articleId={parseInt(article.id)} 
                  comments={[]} 
                  refetchComments={() => {}} 
                />
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="mt-8 md:mt-12">
              <NewsletterSubscription variant="article" />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-4 md:space-y-6 lg:space-y-8">
            {headings.length > 0 && (
              <div className="lg:sticky lg:top-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/20 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                    Table of Contents
                  </h3>
                  <TableOfContents 
                    headings={headings} 
                    activeHeadingId={activeHeadingId} 
                  />
                </div>
              </div>
            )}
            
            {/* Advertisement */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/20 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
              <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                Sponsored
              </h3>
              <Advertisement placement="sidebar" />
            </div>
            
            {/* Additional sidebar card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/20 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
              <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-white">📚 Related Articles</h3>
              <p className="text-white/60 text-sm mb-3 md:mb-4">Discover more space exploration content</p>
              <div className="mt-3 md:mt-4">
                <ModernButton variant="neon" className="w-full text-sm">
                  Browse Articles
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Article; 