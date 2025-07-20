import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ArticleCard from "@/components/article/ArticleCard";
import FeaturedArticle from "@/components/article/FeaturedArticle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ImageIcon, ExternalLink } from "lucide-react";
import type { GhostPost } from '../../../server/ghostService';

function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [allPosts, setAllPosts] = useState<GhostPost[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Fetch articles data with pagination
  const { data: articlesData, isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useQuery({
    queryKey: ['ghost-posts', currentPage],
    queryFn: async () => {
      const response = await axios.get(`/api/ghost/posts?page=${currentPage}&limit=10`);
      console.log('Home page ghost posts data:', {
        page: currentPage,
        postsCount: response.data.posts?.length || 0,
        meta: response.data.meta,
        firstPostData: response.data.posts?.[0] ? {
          id: response.data.posts[0].id,
          title: response.data.posts[0].title,
          hasReadingTime: !!response.data.posts[0].reading_time,
          readingTimeValue: response.data.posts[0].reading_time,
          hasAuthors: !!response.data.posts[0].authors,
          authorsLength: response.data.posts[0].authors?.length || 0,
          authorsData: response.data.posts[0].authors?.map((a: any) => ({ id: a.id, name: a.name })) || []
        } : null
      });
      return response.data;
    }
  });

  // Fetch gallery data separately
  const { data: galleryData, isLoading: galleryLoading, error: galleryError } = useQuery({
    queryKey: ['gallery-data'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/gallery/featured');
        console.log('Gallery API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Gallery fetch error:', error);
        // Try alternative gallery endpoint
        const alternativeResponse = await axios.get('/api/gallery?limit=4');
        return alternativeResponse.data?.items || [];
      }
    }
  });

  // Update posts when new data arrives
  useEffect(() => {
    if (articlesData?.posts) {
      if (currentPage === 1) {
        setAllPosts(articlesData.posts);
      } else {
        setAllPosts(prev => [...prev, ...articlesData.posts]);
      }
      
      // Check if there are more posts available
      const hasMore = articlesData.meta?.pagination?.next !== null && 
                     articlesData.meta?.pagination?.page < articlesData.meta?.pagination?.pages;
      setHasMorePosts(hasMore);
    }
  }, [articlesData, currentPage]);

  const featuredPost = allPosts[0];
  const otherPosts = allPosts.slice(1);

  // Debug: Log the posts data to see what we're getting
  console.log('Home page posts data:', {
    totalPosts: allPosts.length,
    currentPage,
    hasMorePosts,
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

  const loadMorePosts = () => {
    if (!articlesLoading && hasMorePosts) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (articlesLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading latest articles...</p>
        </div>
      </div>
    );
  }

  if (articlesError && currentPage === 1) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to load articles</h1>
          <p className="text-white/70 mb-6">Please try again later</p>
          <Button onClick={() => refetchArticles()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D17] min-h-screen">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Featured Article */}
        {featuredPost && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 md:mb-6 px-1">Featured Story</h2>
            <FeaturedArticle article={featuredPost} />
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
              {selectedCategory === 'all' && hasMorePosts && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={loadMorePosts}
                    disabled={articlesLoading}
                    className="bg-purple-600 hover:bg-purple-700 px-8 py-2"
                  >
                    {articlesLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
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
          
          {galleryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : galleryError ? (
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
          ) : galleryData && galleryData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {galleryData.slice(0, 4).map((item: any, index: number) => {
                  // Handle both direct image URLs and post objects
                  const imageUrl = typeof item === 'string' ? item : (item.feature_image || item.url);
                  const title = typeof item === 'string' ? `Gallery Image ${index + 1}` : (item.title || `Image ${index + 1}`);
                  const slug = typeof item === 'string' ? null : item.slug;
                  
                  return (
                    <Card 
                      key={index} 
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
                              {slug && (
                                <div className="flex items-center text-purple-400 text-xs">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View Article
                                </div>
                              )}
                            </div>
                          </div>
                          {slug && (
                            <div 
                              className="absolute inset-0 cursor-pointer"
                              onClick={() => window.open(`/article/${slug}`, '_blank')}
                            />
                          )}
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
                  <a href="/gallery">
                    View Full Gallery
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-6 text-center">
                <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 mb-4">No featured images available at the moment</p>
                <p className="text-white/40 text-sm">Check back later for stunning space imagery</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;