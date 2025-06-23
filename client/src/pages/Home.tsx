import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ArticleCard from "@/components/article/ArticleCard";
import Advertisement from "@/components/Advertisement";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string;
  feature_image: string;
  featured: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  custom_excerpt: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  authors: Array<{
    id: string;
    name: string;
    slug: string;
    profile_image: string;
  }>;
  primary_author: {
    id: string;
    name: string;
    slug: string;
    profile_image: string;
  };
  primary_tag: {
    id: string;
    name: string;
    slug: string;
  };
  url: string;
  excerpt: string;
  reading_time: number;
}

interface ArticleResponse {
  posts: GhostPost[];
  meta?: {
    pagination: {
      page: number;
      limit: number;
      pages: number;
      total: number;
      next: number | null;
      prev: number | null;
    };
  };
}

function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [location, setLocation] = useLocation();
  
  // Get search query from URL parameters
  const searchQuery = useMemo(() => {
    const urlParams = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
    const query = urlParams.get('search') || '';
    console.log('Parsing search query:', { location, query });
    return query;
  }, [location]);
  
  console.log('Current location:', location);
  console.log('Search query from URL:', searchQuery);
  
  // Get articles with pagination and search
  const { data: articleData, isLoading: isLoadingArticles } = useQuery<ArticleResponse>({
    queryKey: ['ghost-articles', currentPage, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          include: 'tags,authors',
          fields: 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag,primary_author' + (searchQuery ? ',plaintext' : '')
        });
        
        // Add search filter if query exists
        if (searchQuery) {
          const searchFilter = `title:~'${searchQuery}',excerpt:~'${searchQuery}'`;
          params.append('filter', searchFilter);
        }
        
        console.log('Fetching articles with params:', params.toString());
        console.log('Search query:', searchQuery);
        const response = await fetch(`/api/ghost/posts?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(`Failed to fetch articles: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received articles:', {
          postCount: data.posts?.length || 0,
          firstPost: data.posts?.[0] ? {
            id: data.posts[0].id,
            title: data.posts[0].title,
            slug: data.posts[0].slug
          } : null,
          meta: data.meta
        });
        
        return data;
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    }
  });

  // Ensure posts is always an array
  const posts = Array.isArray(articleData?.posts) ? articleData.posts : [];
  const hasMore = articleData?.meta?.pagination?.next !== null;

  // For debugging
  console.log('Current state:', {
    page: currentPage,
    postCount: posts.length,
    hasMore,
    isLoading: isLoadingArticles,
    firstPost: posts[0] ? {
      id: posts[0].id,
      title: posts[0].title,
      slug: posts[0].slug
    } : null
  });

  // Refetch when search changes
  useEffect(() => {
    console.log('Effect triggered - resetting page to 1', { searchQuery });
    setCurrentPage(1);
  }, [searchQuery]);

  // Clear search
  const clearSearch = () => {
    setLocation('/');
  };

  // Load more articles
  const loadMore = () => {
    if (articleData?.meta?.pagination?.next) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="bg-[#0D0D17] min-h-screen">
      {/* Article Feed */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              {searchQuery && (
                <div className="flex items-center gap-2 mt-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    Search results for "{searchQuery}"
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {isLoadingArticles ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Loading articles...</p>
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="space-y-8">
                {/* Group articles into chunks of 9 and render with ads between */}
                {Array.from({ length: Math.ceil(posts.length / 9) }, (_, groupIndex) => {
                  const startIndex = groupIndex * 9;
                  const endIndex = Math.min(startIndex + 9, posts.length);
                  const groupPosts = posts.slice(startIndex, endIndex);
                  
                  return (
                    <div key={groupIndex}>
                      {/* Articles Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
                        {groupPosts.map((post) => (
                          <ArticleCard 
                            key={post.id} 
                            article={{
                              id: parseInt(post.id),
                              title: post.title,
                              slug: post.slug,
                              summary: post.custom_excerpt || post.excerpt || '',
                              category: post.primary_tag?.name || 'Uncategorized',
                              featuredImage: post.feature_image,
                              isBreaking: false,
                              readTime: post.reading_time || 0,
                              publishedAt: post.published_at,
                              author: {
                                id: parseInt(post.primary_author?.id || '0'),
                                username: post.primary_author?.name || 'Unknown',
                                profilePicture: post.primary_author?.profile_image || ''
                              },
                              tags: (post.tags || []).map(tag => tag.name)
                            }} 
                          />
                        ))}
                      </div>
                      
                      {/* Sponsored Advertisement - show after every group except the last one */}
                      {groupIndex < Math.ceil(posts.length / 9) - 1 && (
                        <div className="text-center py-8">
                          <h3 className="text-lg font-bold mb-4 text-white">Sponsored</h3>
                          <Advertisement placement="sidebar" className="mx-auto" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {hasMore && (
                <div className="text-center">
                  <Button 
                    onClick={loadMore}
                    variant="outline"
                    className="mt-8"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-[#14141E] rounded-xl border border-white/10">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-white/70 mb-2">No articles found for "{searchQuery}"</p>
                  <p className="text-gray-500 text-sm mb-4">Try adjusting your search terms or browse all articles</p>
                  <Button onClick={clearSearch} variant="outline">
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-white/70 mb-4">No articles found</p>
                  <Button asChild variant="outline">
                    <a href="/">Back to all articles</a>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;