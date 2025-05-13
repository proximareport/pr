import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ArticleCard from "@/components/article/ArticleCard";
import Advertisement from "@/components/Advertisement";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  featuredImage: string;
  isBreaking: boolean;
  readTime: number;
  publishedAt: string;
  author: {
    id: number;
    username: string;
    profilePicture?: string;
    bio?: string;
  };
}

interface SiteSettings {
  id: number;
  siteName: string;
  description?: string;
  logo?: string;
  favicon?: string;
  homeCategories?: string[];
  maintenanceMode?: boolean;
  updatedBy?: number;
  updatedAt?: string;
}

function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  
  // Get site settings to fetch homepage categories
  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });
  
  // Get available categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });
  
  // Get only tags that are used in published articles for filtering
  const { data: tags } = useQuery<any[]>({
    queryKey: ["/api/tags/published"],
  });
  
  // Get articles with pagination and filtering
  const { data: articles, isLoading, refetch } = useQuery<Article[]>({
    queryKey: ["/api/articles", { 
      limit: 12, 
      offset: (currentPage - 1) * 12, 
      category: selectedCategory,
      tagId: selectedTag 
    }],
  });

  // Refetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    refetch();
  }, [selectedCategory, selectedTag, refetch]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedTag(null); // Reset tag filter when changing category
  };
  
  // Handle tag selection
  const handleTagSelect = (tagId: number) => {
    setSelectedTag(tagId === selectedTag ? null : tagId);
  };

  // Load more articles
  const loadMore = () => {
    setCurrentPage(currentPage + 1);
  };

  return (
    <div className="bg-[#0D0D17] min-h-screen">

      {/* Article Feed */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-space text-2xl md:text-3xl font-bold">Proxima Report</h1>
            
            <Tabs 
              value={selectedCategory} 
              onValueChange={(value) => {
                handleCategoryChange(value);
                setSelectedTag(null); // Reset tag when changing category
              }}
              className="hidden md:block"
            >
              <TabsList className="bg-[#1E1E2D]">
                <TabsTrigger value="all">All</TabsTrigger>
                {siteSettings && siteSettings.homeCategories ? 
                  siteSettings.homeCategories.map((catSlug: string) => {
                    const category = categories?.find(c => c.slug === catSlug);
                    return category ? (
                      <TabsTrigger key={category.id} value={category.slug}>
                        {category.name}
                      </TabsTrigger>
                    ) : null;
                  }) 
                : null}
                
                {/* Add a divider between categories and tags */}
                {tags && tags.length > 0 && (
                  <div className="h-4 w-px bg-white/20 mx-2"></div>
                )}
                
                {/* Display tags in the TabsList */}
                {tags && tags.length > 0 && tags.map((tag) => (
                  <TabsTrigger
                    key={`tag-${tag.id}`}
                    value={`tag-${tag.id}`}
                    onClick={(e) => {
                      e.preventDefault(); // Prevent default behavior
                      handleTagSelect(tag.id);
                    }}
                    className={selectedTag === tag.id ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    #{tag.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <div className="block md:hidden">
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedCategory} 
                  onChange={(e) => {
                    handleCategoryChange(e.target.value);
                    setSelectedTag(null); // Reset tag when changing category
                  }}
                  className="bg-[#1E1E2D] text-white border border-white/10 rounded-md p-1"
                >
                  <option value="all">All</option>
                  {siteSettings && siteSettings.homeCategories ? 
                    siteSettings.homeCategories.map((catSlug: string) => {
                      const category = categories?.find(c => c.slug === catSlug);
                      return category ? (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ) : null;
                    })
                  : null}
                </select>
                
                {/* Mobile tag filter buttons */}
                {tags && tags.length > 0 && tags.slice(0, 2).map((tag) => (
                  <Button
                    key={`mobile-tag-${tag.id}`}
                    variant={selectedTag === tag.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTagSelect(tag.id)}
                    className={`text-xs ${selectedTag === tag.id ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  >
                    #{tag.name}
                  </Button>
                ))}
                
                {/* More tags dropdown if there are more than 2 tags */}
                {tags && tags.length > 2 && (
                  <select
                    value=""
                    onChange={(e) => {
                      const tagId = parseInt(e.target.value);
                      if (!isNaN(tagId)) {
                        handleTagSelect(tagId);
                      }
                    }}
                    className="bg-[#1E1E2D] text-white border border-white/10 rounded-md p-1 text-xs"
                  >
                    <option value="">More tags...</option>
                    {tags.slice(2).map((tag) => (
                      <option key={`more-tag-${tag.id}`} value={tag.id}>
                        #{tag.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          
          {/* We'll use the category TabList only for filtering since that's the original design */}
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Loading articles...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-3/4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                    {articles && articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                    
                    {(!articles || articles.length === 0) && (
                      <div className="col-span-full text-center py-12 bg-[#14141E] rounded-xl border border-white/10">
                        <p className="text-white/70 mb-4">No articles found</p>
                        <Button asChild variant="outline">
                          <a href="/">Back to all articles</a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lg:w-1/4 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Sponsored</h3>
                    <Advertisement placement="sidebar" className="mb-6" />
                  </div>
                </div>
              </div>
              
              {articles && articles.length >= 12 && (
                <div className="text-center">
                  <Button 
                    onClick={loadMore} 
                    variant="outline"
                    className="px-6 py-2.5 border border-white/10 hover:border-purple-500/30"
                  >
                    Load More Articles
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
