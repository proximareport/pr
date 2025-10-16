import { useEffect, useState } from "react";
import { useLocation, Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import ArticleContent from "@/components/article/ArticleContent";
import TableOfContents from "@/components/article/TableOfContents";
import CommentSection from "@/components/article/CommentSection";
import ReadingProgress from "@/components/article/ReadingProgress";
import Advertisement from "@/components/Advertisement";
import NewsletterSubscription from "@/components/NewsletterSubscription";
import { ChevronLeft, Clock, User, Calendar, Eye, Share2, Bookmark, ArrowUp, ArrowDown, MessageCircle, Heart, Menu, X, Star, TrendingUp, BookOpen, Users, Zap } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { GhostPost } from '../../../server/ghostService';
import { ModernButton } from "@/components/ui/modern-button";
import { shareArticle } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { analyticsTracker } from "@/lib/analytics";
import { getReadingTimeDisplay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useGoogleAdSense } from "@/hooks/useGoogleAdSense";
import { ArticleTopAd, ArticleBottomAd, InContentAd } from "@/components/AdPlacement";
import { scrollToTop } from "@/lib/scrollUtils";
import SEO from "@/components/SEO";
import { generateArticleSEO } from "@/lib/seoUtils";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedArticles from "@/components/RelatedArticles";

interface ArticleParams {
  slug: string;
}

function Article() {
  const params = useParams<ArticleParams>();
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; content: string; level: number }>>([]);
  const [showMobileTOC, setShowMobileTOC] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
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

  // Fetch comments for the article
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['article-comments', article?.id],
    queryFn: async () => {
      if (!article?.id) return [];
      
      try {
        const response = await axios.get(`/api/ghost/posts/${article.id}/comments`);
        return response.data;
      } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!article?.id
  });

  // Fetch related articles based on current article's tags
  const { data: relatedArticlesData } = useQuery<GhostPost[]>({
    queryKey: ['related-articles', article?.primary_tag?.slug],
    queryFn: async () => {
      if (!article?.primary_tag?.slug) return [];
      
      // Fetch articles with the same primary tag
      const response = await axios.get(`/api/ghost/posts/tag/${article.primary_tag.slug}?limit=5`);
      return response.data || [];
    },
    enabled: !!article?.primary_tag?.slug,
  });
  
  // Extract headings from article content for TOC
  useEffect(() => {
        if (article?.html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(article.html, 'text/html');
        const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

        const extractedHeadings: Array<{ id: string; content: string; level: number }> = Array.from(headingElements).map((heading, index) => ({
          id: `heading-${index}`,
          content: heading.textContent || '',
          level: Number(heading.tagName[1]) || 1
        }));

        setHeadings(extractedHeadings);
      } catch (error) {
        console.error('Error extracting headings:', error);
        setHeadings([]);
      }
    } else {
      setHeadings([]);
    }
  }, [article]);

  // Track article view for analytics
  useEffect(() => {
    if (article?.title && article?.slug) {
      analyticsTracker.trackArticleView(article.slug, article.title);
    }
  }, [article?.title, article?.slug]);

  // Scroll to top when article loads
  useEffect(() => {
    scrollToTop(false); // Use instant scroll for immediate effect
  }, [slug]);

  // Also scroll to top when article data loads (in case of slow loading)
  useEffect(() => {
    if (article && !isLoading) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        scrollToTop(false); // Use instant scroll for immediate effect
      }, 100);
    }
  }, [article, isLoading]);

  // Load Google AdSense script
  useGoogleAdSense();

  // Check if article is already saved by the user
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !article?.id) return;
      
      try {
        const response = await fetch(`/api/articles/${article.id}/saved`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const { isSaved } = await response.json();
          setIsBookmarked(isSaved);
        }
      } catch (error) {
        console.error('Error checking if article is saved:', error);
      }
    };

    checkIfSaved();
  }, [user, article?.id]);
  
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
      
      if (result) {
        toast({
          title: "Article shared!",
          description: "Your article has been shared successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share the article. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to save articles.",
        variant: "destructive",
      });
      return;
    }

    if (!article?.id) {
      toast({
        title: "Error",
        description: "Article not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const action = isBookmarked ? 'unsave' : 'save';
      const response = await fetch(`/api/articles/${article.id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
        toast({
          title: isBookmarked ? "Bookmark removed" : "Article bookmarked!",
          description: isBookmarked 
            ? "Article removed from your bookmarks." 
            : "Article added to your bookmarks.",
        });
      } else {
        throw new Error('Failed to save/unsave article');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save/unsave article. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    toast({
      title: isLiked ? "Like removed" : "Article liked!",
      description: isLiked 
        ? "You unliked this article." 
        : "You liked this article!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="text-white/80 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Article Not Found</h1>
          <p className="text-white/60">The article you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Debug SEO data
  const seoConfig = article ? generateArticleSEO(article) : {
    title: "Article | Proxima Report",
    description: "Read the latest article on Proxima Report",
    keywords: "space news, STEM education, astronomy, space exploration, NASA, SpaceX, rocket launches, space missions, science news",
    url: "https://proximareport.com/articles",
    type: "website" as const
  };

  // Debug logging for SEO
  if (article) {
    console.log('Article SEO Debug:', {
      title: article.title,
      excerpt: article.excerpt,
      custom_excerpt: article.custom_excerpt,
      finalDescription: seoConfig.description,
      tags: article.tags?.map(tag => tag.name),
      author: article.primary_author?.name
    });
  }

  return (
    <>
      <SEO {...seoConfig} />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Enhanced Reading Progress */}
      <ReadingProgress 
        totalWords={article?.html ? article.html.split(' ').length : 0}
        readingSpeed={200}
      />

      {/* Enhanced geometric ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-violet-400/8 rounded-full blur-2xl animate-pulse delay-5000"></div>
      </div>

      <div className="relative z-10">
        {/* Mobile Table of Contents Overlay */}
        {showMobileTOC && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowMobileTOC(false)}></div>
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Table of Contents
                  </h3>
                  <button 
                    onClick={() => setShowMobileTOC(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <TableOfContents 
                  headings={headings} 
                  activeHeadingId={activeHeadingId} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header with TOC Button */}
        <div className="lg:hidden sticky top-0 z-40 bg-gray-900/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            
            {headings.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileTOC(true)}
                className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <Menu className="mr-2 h-4 w-4" />
                Contents
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          {/* Desktop Back Navigation */}
          <div className="hidden lg:block mb-6">
            <Link href="/">
              <Button 
                variant="ghost" 
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 text-white/80 hover:text-purple-300 transition-all duration-500 rounded-2xl px-6 py-3 backdrop-blur-md hover:shadow-lg hover:shadow-purple-500/20"
              >
                <ChevronLeft className="mr-3 h-5 w-5 group-hover:-translate-x-1 transition-transform duration-500" />
                Back to Articles
              </Button>
            </Link>
          </div>

          {/* Breadcrumbs */}
          <div className="mb-8 lg:mb-12">
            <Breadcrumbs 
              items={[
                { name: 'Articles', href: '/' },
                ...(article.primary_tag ? [{ name: article.primary_tag.name, href: `/tag/${article.primary_tag.slug}` }] : []),
                { name: article.title, href: `/articles/${article.slug}` }
              ]}
              className="text-white/70"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Content Area - Optimized for reading */}
            <div className="lg:col-span-9 space-y-8 lg:space-y-12">
              {/* Article Header */}
              <div className="space-y-6 lg:space-y-8">
                {/* Title - Enhanced typography and spacing */}
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent tracking-tight">
                    {article.title}
                  </h1>
                  
                  {/* Enhanced subtitle with reading stats */}
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>Article</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span>Featured</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced metadata section - Better mobile layout */}
                <div className="bg-gradient-to-r from-white/5 via-purple-500/5 to-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/10 shadow-xl hover:shadow-purple-500/20 transition-all duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-center">
                    {/* Authors - Improved mobile layout */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      {article.authors && article.authors.length > 1 ? (
                        <div className="flex items-center gap-3 group">
                          <div className="flex -space-x-2 flex-shrink-0">
                            {article.authors.slice(0, 3).map((author, index) => (
                              <Link key={author.id} href={`/profile/${author.id}`}>
                                <div className="relative cursor-pointer">
                                  <img 
                                    src={author.profile_image || '/default-avatar.png'} 
                                    alt={author.name || 'Author'} 
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400/40 transition-all duration-500 group-hover:border-purple-400 group-hover:scale-110 shadow-lg hover:scale-110"
                                    style={{ zIndex: article.authors.length - index }}
                                  />
                                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                              </Link>
                            ))}
                            {article.authors.length > 3 && (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400/40 bg-gradient-to-br from-purple-900/80 to-violet-900/80 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                +{article.authors.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white group-hover:text-purple-300 transition-colors duration-500 text-sm lg:text-base truncate">
                              {article.authors.slice(0, 2).map(author => author.name).join(', ')}
                              {article.authors.length > 2 && ` and ${article.authors.length - 2} more`}
                            </span>
                            <span className="text-xs text-white/60 flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              Collaborative Authors
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Link href={`/profile/${(article.authors?.[0]?.id || article.primary_author?.id) || 'unknown'}`}>
                          <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative flex-shrink-0">
                              <img 
                                src={(article.authors?.[0]?.profile_image || article.primary_author?.profile_image) || '/default-avatar.png'} 
                                alt={(article.authors?.[0]?.name || article.primary_author?.name) || 'Author'} 
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400/40 transition-all duration-500 group-hover:border-purple-400 group-hover:scale-110 shadow-lg hover:scale-110"
                              />
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-white group-hover:text-purple-300 transition-colors duration-500 text-sm lg:text-base truncate">
                                {(article.authors?.[0]?.name || article.primary_author?.name) || 'Unknown Author'}
                              </span>
                              <span className="text-xs text-white/60 flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Author
                              </span>
                            </div>
                          </div>
                        </Link>
                      )}
                    </div>
                    
                    {/* Date and Reading time - Better mobile layout */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5">
                      <div className="flex items-center gap-2 hover:text-purple-300 transition-colors duration-500 group">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-all duration-300">
                          <Calendar className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm lg:text-base">{format(new Date(article.published_at), 'MMM d, yyyy')}</span>
                          <span className="text-xs text-white/60">Published</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 hover:text-purple-300 transition-colors duration-500 group">
                        <div className="p-1.5 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-all duration-300">
                          <Clock className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm lg:text-base">{getReadingTimeDisplay(article)}</span>
                          <span className="text-xs text-white/60">Reading time</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons - Better mobile layout */}
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={handleLike}
                        className={`p-2 rounded-xl transition-all duration-500 group ${
                          isLiked 
                            ? 'bg-red-500/20 border border-red-400/40 text-red-400 hover:bg-red-500/30' 
                            : 'bg-purple-500/10 border border-purple-400/30 text-purple-400 hover:bg-purple-500/20'
                        }`}
                        aria-label={isLiked ? 'Unlike article' : 'Like article'}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} group-hover:scale-110 transition-transform duration-300`} />
                      </button>
                      
                      <button 
                        onClick={handleBookmark}
                        className={`p-2 rounded-xl transition-all duration-500 group ${
                          isBookmarked 
                            ? 'bg-purple-500/20 border border-purple-400/40 text-purple-400 hover:bg-purple-500/30' 
                            : 'bg-purple-500/10 border border-purple-400/30 text-purple-400 hover:bg-purple-500/20'
                        }`}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''} group-hover:scale-110 transition-transform duration-300`} />
                      </button>
                      
                      <button 
                        onClick={handleShare}
                        className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 hover:border-purple-400 text-purple-400 hover:text-purple-300 transition-all duration-500 group"
                        aria-label="Share article"
                      >
                        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Feature Image - Enhanced with better effects */}
                {article.feature_image && (
                  <div className="relative overflow-hidden rounded-3xl group">
                    <img 
                      src={article.feature_image} 
                      alt={article.title}
                      className="w-full h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[500px] object-cover transition-all duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-purple-900/20 group-hover:from-black/70 group-hover:to-purple-900/30 transition-all duration-700"></div>
                    <div className="absolute inset-0 border-2 border-purple-500/30 rounded-3xl group-hover:border-purple-400/50 transition-all duration-700"></div>
                  </div>
                )}

                {/* Article Top Advertisement */}
                <div className="my-8">
                  <ArticleTopAd className="w-full" />
                </div>
              </div>
              
              {/* Article content - Enhanced with better typography */}
              <div className="bg-gradient-to-br from-white/5 via-purple-500/5 to-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 border border-white/10 shadow-2xl hover:border-purple-400/30 transition-all duration-700">
                <ArticleContent content={article.html} />
              </div>
              
              {/* Enhanced Article Actions */}
              <div className="bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-purple-400/20 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button 
                      onClick={handleLike}
                      className={`flex items-center gap-3 px-4 sm:px-6 py-3 rounded-2xl transition-all duration-500 group ${
                        isLiked 
                          ? 'bg-red-500/20 border border-red-400/40 text-red-400 hover:bg-red-500/30' 
                          : 'bg-purple-500/10 border border-purple-400/30 text-purple-400 hover:bg-purple-500/20'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''} group-hover:scale-110 transition-transform duration-300`} />
                      <span className="font-semibold">{isLiked ? 'Liked' : 'Like'}</span>
                    </button>
                    
                    <button className="flex items-center gap-3 px-4 sm:px-6 py-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 hover:border-purple-400 text-purple-400 hover:text-purple-300 transition-all duration-500 group">
                      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Comment</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBookmark}
                      className={`p-3 rounded-2xl transition-all duration-500 group ${
                        isBookmarked 
                          ? 'bg-purple-500/20 border border-purple-400/40 text-purple-400' 
                          : 'bg-purple-500/10 border border-purple-400/30 text-purple-400 hover:bg-purple-500/20'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''} group-hover:scale-110 transition-transform duration-300`} />
                    </button>
                    
                    <button 
                      onClick={handleShare}
                      className="px-6 sm:px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base group"
                    >
                      <Share2 className="w-5 h-5 mr-2 inline group-hover:scale-110 transition-transform duration-300" />
                      Share Article
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Comments section */}
              <div className="bg-gradient-to-br from-white/5 via-purple-500/5 to-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/10 shadow-2xl hover:border-purple-400/20 transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-purple-500/20">
                    <MessageCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Join the Discussion</h2>
                    <p className="text-white/60 text-sm lg:text-base">Share your thoughts and insights with the community</p>
                  </div>
                </div>
                <CommentSection 
                  articleId={article.id} 
                  comments={comments} 
                  refetchComments={refetchComments} 
                />
              </div>

              {/* Enhanced Newsletter Subscription */}
              <div className="bg-gradient-to-r from-purple-500/20 via-violet-500/15 to-purple-500/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-purple-400/30 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500">
                <NewsletterSubscription variant="article" />
              </div>

              {/* Article Bottom Advertisement */}
              <div className="my-8">
                <ArticleBottomAd className="w-full" />
              </div>
            </div>

            {/* Right Sidebar - Table of Contents and Ads */}
            <div className="hidden lg:block lg:col-span-3 space-y-8">
              {/* Tags Section */}
              {article.primary_tag && (
                <div className="bg-gradient-to-br from-white/5 via-purple-500/5 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
                  <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">
                      {article.primary_tag.name}
                    </Badge>
                    {/* Add more tags here if available */}
                  </div>
                </div>
              )}

              {/* Enhanced Table of Contents */}
              <div className="lg:sticky lg:top-8">
                <div className="bg-gradient-to-br from-white/5 via-purple-500/5 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
                  <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    Table of Contents
                  </h3>
                  {headings.length > 0 ? (
                    <TableOfContents 
                      headings={headings} 
                      activeHeadingId={activeHeadingId} 
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">No headings found in this article</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced Advertisement */}
              <div className="bg-gradient-to-br from-white/5 via-purple-500/5 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:border-purple-400/30 transition-all duration-500">
                <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <Share2 className="w-5 h-5 text-purple-400" />
                  </div>
                  Sponsored Content
                </h3>
                {/* Temporarily removed sidebar ad due to dimension constraints */}
                <div className="text-center py-8">
                  <div className="p-2 rounded-xl bg-purple-500/20 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-white/60 text-sm">Advertisement space</p>
                </div>
              </div>
              
              {/* Related Articles */}
              {relatedArticlesData && relatedArticlesData.length > 0 && (
                <RelatedArticles 
                  articles={relatedArticlesData}
                  currentArticleSlug={article?.slug}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Article; 