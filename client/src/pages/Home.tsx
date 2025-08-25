import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Zap,
  ImageIcon,
  ExternalLink
} from 'lucide-react';
import { useGallery } from '@/services/galleryService';
import ArticleCard from "@/components/article/ArticleCard";
import FeaturedArticle from "@/components/article/FeaturedArticle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import type { GhostPost } from '../../../server/ghostService';
import NewsletterSubscription from "@/components/NewsletterSubscription";
import SEO from "@/components/SEO";

// Gallery Section Component
const GallerySection: React.FC = () => {
  const { data: galleryData, isLoading, error } = useGallery(1, 4);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/5 border-white/20">
        <CardContent className="p-6 text-center">
          <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 mb-4">Unable to load gallery at the moment</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!galleryData?.items || galleryData.items.length === 0) {
    return (
      <Card className="bg-white/5 border-white/20">
        <CardContent className="p-6 text-center">
          <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 mb-4">No featured images available at the moment</p>
          <p className="text-white/40 text-sm">Check back later for stunning space imagery</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {galleryData.items.slice(0, 4).map((item, index) => {
          const imageUrl = item.feature_image || (item.content_images?.[0]?.url);
          const title = item.title || `Gallery Image ${index + 1}`;
          
          return (
            <Card 
              key={item.id} 
              className="relative aspect-square overflow-hidden group cursor-pointer bg-white/5 border-white/20 hover:border-purple-500/50 transition-all duration-300"
            >
              {imageUrl ? (
                <>
                  <div className="relative w-full h-full">
                    <img 
                      src={imageUrl} 
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback for broken images
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center bg-white/5">
                      <ImageIcon className="w-12 h-12 text-white/40" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2">{title}</h4>
                      <div className="flex items-center text-purple-400 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View in Gallery
                      </div>
                    </div>
                  </div>
                  <Link href="/gallery">
                    <div className="absolute inset-0 cursor-pointer" />
                  </Link>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <ImageIcon className="w-12 h-12 text-white/40" />
                  <span className="ml-2 text-white/60 text-sm">No image</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* View All Gallery Button */}
      <div className="flex justify-center mt-6">
        <Button 
          asChild
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
        >
          <Link href="/gallery">
            View Full Gallery
            <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </>
  );
};

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [allPosts, setAllPosts] = useState<GhostPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<GhostPost | null>(null);
  const [hasReadingTime, setHasReadingTime] = useState(false);
  const [readingTimeValue, setReadingTimeValue] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch posts data with pagination
  const { data: postsData, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['posts-data', currentPage],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/ghost/posts?limit=10&page=${currentPage}`);
        console.log(`Posts API response for page ${currentPage}:`, response.data);
        return response.data;
      } catch (error) {
        console.error('Posts fetch error:', error);
        return { posts: [] };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update posts when new data arrives
  useEffect(() => {
    if (postsData?.posts) {
      if (currentPage === 1) {
        setAllPosts(postsData.posts);
      } else {
        // Only append new posts, avoid duplicates
        setAllPosts(prev => {
          const existingIds = new Set(prev.map(post => post.id));
          const newPosts = postsData.posts.filter((post: GhostPost) => !existingIds.has(post.id));
          return [...prev, ...newPosts];
        });
      }
      
      // Reset loading state
      setIsLoadingMore(false);
      
      // Check if there are more posts available
      const pagination = postsData.meta?.pagination;
      if (pagination) {
        const hasMore = pagination.next !== null && 
                       pagination.page < pagination.pages &&
                       pagination.limit > 0;
        setHasMorePosts(!!hasMore);
      } else {
        // Fallback: if no pagination data, assume there might be more posts
        // This is a conservative approach for better UX
        setHasMorePosts(postsData.posts.length >= 10);
      }
    }
  }, [postsData, currentPage]);

  const featuredPostData = allPosts[0];
  const otherPosts = allPosts.slice(1);

  // Debug: Log the posts data to see what we're getting
  console.log('Home page posts data:', {
    totalPosts: allPosts.length,
    currentPage,
    hasMorePosts,
    isLoadingMore,
    paginationInfo: postsData?.meta?.pagination,
    firstPost: allPosts[0] ? {
      title: allPosts[0].title,
      hasReadingTime: !!allPosts[0].reading_time,
      readingTimeValue: allPosts[0].reading_time,
      hasAuthors: !!allPosts[0].authors,
      authorsLength: allPosts[0].authors?.length || 0
    } : null
  });

  // Extract unique categories from posts
  const categoryNames = allPosts.map((post: GhostPost) => post.primary_tag?.name).filter(Boolean) as string[];
  const categories: string[] = ['all', ...Array.from(new Set(categoryNames))];

  // Filter posts by category
  const filteredPosts = selectedCategory === 'all' 
    ? otherPosts 
    : otherPosts.filter((post: GhostPost) => post.primary_tag?.name === selectedCategory);

  const loadMorePosts = async () => {
    if (!postsLoading && !isLoadingMore && hasMorePosts) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  if (postsLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading latest articles...</p>
        </div>
      </div>
    );
  }

  if (postsError && currentPage === 1) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to load articles</h1>
          <p className="text-white/70 mb-6">Please try again later</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Latest Space & STEM News | Proxima Report"
        description="Stay updated with the latest space exploration news, NASA missions, SpaceX launches, astronomy discoveries, and STEM education. Real-time coverage of space technology and scientific breakthroughs."
        keywords="space news, latest space missions, NASA news, SpaceX launches, astronomy discoveries, STEM education, space technology, rocket launches, space exploration, science news, space science, exoplanets, Mars missions, lunar exploration"
        url="https://proximareport.com"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Latest Space & STEM News",
          "description": "Stay updated with the latest space exploration news, NASA missions, SpaceX launches, astronomy discoveries, and STEM education.",
          "url": "https://proximareport.com",
          "mainEntity": {
            "@type": "ItemList",
            "name": "Latest Space News Articles",
            "description": "Collection of the latest space exploration and STEM news articles",
            "numberOfItems": allPosts.length,
            "itemListElement": allPosts.slice(0, 10).map((post, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Article",
                "headline": post.title,
                "description": post.excerpt,
                "url": `https://proximareport.com/articles/${post.slug}`,
                "author": {
                  "@type": "Person",
                  "name": post.authors?.[0]?.name || post.primary_author?.name || "Proxima Report"
                },
                "datePublished": post.published_at,
                "publisher": {
                  "@type": "Organization",
                  "name": "Proxima Report",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://proximareport.com/logo.png"
                  }
                }
              }
            }))
          }
        }}
      />
      <div className="bg-[#0D0D17] min-h-screen">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Featured Article */}
        {featuredPostData && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 md:mb-6 px-1">Featured Story</h2>
            <FeaturedArticle article={featuredPostData} />
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6 md:mb-8 px-1">
          <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Browse by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer transition-colors text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 ${
                  selectedCategory === category 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "border-purple-600 text-purple-400 hover:bg-purple-600/20"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Articles' : category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="mb-8 md:mb-12 px-1">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6">Latest Articles</h3>
          {filteredPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredPosts.map((post: GhostPost) => (
                  <ArticleCard
                    key={post.id}
                    article={{
                      id: parseInt(post.id) || 0,
                      title: post.title,
                      slug: post.slug,
                      summary: post.excerpt || '',
                      featuredImage: post.feature_image || '',
                      category: post.primary_tag?.name || 'Uncategorized',
                      author: {
                        id: parseInt((post.authors?.[0]?.id || post.primary_author?.id) || '0'),
                        username: (post.authors?.[0]?.name || post.primary_author?.name) || 'Anonymous',
                        profilePicture: (post.authors?.[0]?.profile_image || post.primary_author?.profile_image) || ''
                      },
                      publishedAt: post.published_at,
                      readTime: post.reading_time || 5,
                      tags: [],
                      isBreaking: false,
                      isCollaborative: post.authors && post.authors.length > 1,
                      authors: post.authors ? post.authors.map((author: any) => ({
                        id: parseInt(author.id || '0'),
                        username: author.name || 'Unknown',
                        profilePicture: author.profile_image || ''
                      })) : []
                    }}
                  />
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMorePosts && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg transition-colors duration-300"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      'Load More Articles'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">No articles found in this category.</p>
            </div>
          )}
        </div>

        {/* Enhanced Featured Gallery Section */}
        <div className="mb-12 px-1">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            Featured Gallery
          </h3>
          
          {/* Use the proper gallery service instead of the broken featured endpoint */}
          <GallerySection />
        </div>

        {/* Newsletter Subscription Section */}
        <div className="mt-12">
          <NewsletterSubscription />
        </div>
      </div>
    </div>
    </>
  );
}