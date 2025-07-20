import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ArticleCard from '@/components/article/ArticleCard';

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

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search articles
  const { data: articleData, isLoading } = useQuery<ArticleResponse>({
    queryKey: ['search-articles', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) return { posts: [] };

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          include: 'tags,authors',
          fields: 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag,primary_author,authors'
        });

        // Clean and escape the search query to prevent API errors
        const cleanQuery = debouncedQuery.trim().replace(/['"]/g, ''); // Remove quotes that might cause issues
        
        if (cleanQuery.length >= 2) {
          // Use a simpler search filter that's less likely to cause issues
          const searchFilter = `title:~'${cleanQuery}'`;
          params.append('filter', searchFilter);
        }

        console.log('Search API request:', {
          query: cleanQuery,
          params: params.toString()
        });

        const response = await fetch(`/api/ghost/posts?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Search API Error:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          
          // Return empty results instead of throwing error
          return { posts: [] };
        }

        const data = await response.json();
        console.log('Search API response:', {
          postCount: data.posts?.length || 0,
          firstPost: data.posts?.[0]?.title
        });

        return data;
      } catch (error) {
        console.error('Search error:', error);
        // Return empty results instead of throwing error
        return { posts: [] };
      }
    },
    enabled: debouncedQuery.trim().length >= 2,
    retry: false, // Don't retry failed searches
  });

  const posts = Array.isArray(articleData?.posts) ? articleData.posts : [];

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setLocation(`/?search=${encodeURIComponent(query)}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-[#0D0D17] border-purple-700/30">
        <DialogHeader>
          <DialogTitle className="text-white">Search Articles</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results */}
          <div className="overflow-y-auto max-h-[60vh]">
            {debouncedQuery.trim() && (
              <>
                {debouncedQuery.trim().length < 2 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-white/70 mb-2">Please enter at least 2 characters to search</p>
                    <p className="text-gray-500 text-sm">Try a longer search term</p>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    <span className="ml-2 text-white">Searching...</span>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Found {posts.length} result{posts.length !== 1 ? 's' : ''} for "{debouncedQuery}"
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posts.map((post) => (
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
                            readTime: post.reading_time || 5,
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
                    {posts.length > 0 && (
                      <div className="text-center pt-4">
                        <Button 
                          onClick={() => handleSearch(debouncedQuery)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          View All Results
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-white/70 mb-2">No articles found for "{debouncedQuery}"</p>
                    <p className="text-gray-500 text-sm">Try adjusting your search terms</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 