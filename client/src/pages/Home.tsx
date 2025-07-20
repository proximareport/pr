import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ArticleCard from "@/components/article/ArticleCard";
import FeaturedArticle from "@/components/article/FeaturedArticle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { GhostPost } from '../../../server/ghostService';

function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch articles data
  const { data: articlesData, isLoading: articlesLoading, error: articlesError } = useQuery({
    queryKey: ['ghost-posts'],
    queryFn: async () => {
      const response = await axios.get('/api/ghost/posts');
      console.log('Home page ghost posts data:', {
        postsCount: response.data.posts?.length || 0,
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

  // Fetch featured images for gallery
  const { data: galleryData, isLoading: galleryLoading } = useQuery({
    queryKey: ['gallery-featured'],
    queryFn: async () => {
      const response = await axios.get('/api/gallery/featured');
      return response.data;
    }
  });

  const posts = articlesData?.posts || [];
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  // Debug: Log the posts data to see what we're getting
  console.log('Home page posts data:', {
    totalPosts: posts.length,
    firstPost: posts[0] ? {
      title: posts[0].title,
      hasReadingTime: !!posts[0].reading_time,
      readingTimeValue: posts[0].reading_time,
      hasAuthors: !!posts[0].authors,
      authorsLength: posts[0].authors?.length || 0
    } : null
  });

  // Extract unique categories from posts
  const categoryNames = posts.map((post: GhostPost) => post.primary_tag?.name).filter(Boolean) as string[];
  const categories: string[] = ['all', ...Array.from(new Set(categoryNames))];

  // Filter posts by category
  const filteredPosts = selectedCategory === 'all' 
    ? otherPosts 
    : otherPosts.filter((post: GhostPost) => post.primary_tag?.name === selectedCategory);

  if (articlesLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">Loading latest articles...</p>
        </div>
      </div>
    );
  }

  if (articlesError) {
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
    <div className="bg-[#0D0D17] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Featured Article */}
        {featuredPost && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Featured Story</h2>
            <FeaturedArticle article={featuredPost} />
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Browse by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
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
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Latest Articles</h3>
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">No articles found in this category.</p>
            </div>
          )}
        </div>

        {/* Gallery Section */}
        {galleryData && galleryData.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Featured Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {galleryData.slice(0, 4).map((item: any, index: number) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg group">
                  <img 
                    src={item.feature_image} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;