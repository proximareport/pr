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
  const [selectedFilter, setSelectedFilter] = useState("all");
  
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
      filter: selectedFilter
    }],
  });
  
  // For debugging - log when the filter changes
  console.log(`Current filter: ${selectedFilter}`);

  // Refetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    refetch();
  }, [selectedFilter, refetch]);

  // Handle filter change (both categories and tags)
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
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
            
            {/* Desktop filter tabs */}
            <Tabs 
              value={selectedFilter}
              onValueChange={handleFilterChange}
              className="hidden md:block"
            >
              <TabsList className="bg-[#1E1E2D]">
                <TabsTrigger value="all">All</TabsTrigger>
                {/* Display categories */}
                {siteSettings && siteSettings.homeCategories ? 
                  siteSettings.homeCategories.map((catSlug: string) => {
                    const category = categories?.find(c => c.slug === catSlug);
                    return category ? (
                      <TabsTrigger key={category.id} value={`category-${category.slug}`}>
                        {category.name}
                      </TabsTrigger>
                    ) : null;
                  }) 
                : null}
                
                {/* Display categories as topics for filtering */}
                {categories && categories.length > 0 && categories
                  .filter(cat => !siteSettings?.homeCategories?.includes(cat.slug))
                  .map((category) => (
                    <TabsTrigger
                      key={`category-${category.id}`}
                      value={`category-${category.slug}`}
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
            
            {/* Mobile filter dropdown */}
            <div className="block md:hidden">
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="bg-[#1E1E2D] text-white border border-white/10 rounded-md p-1"
                >
                  <option value="all">All</option>
                  {/* Primary categories */}
                  {siteSettings && siteSettings.homeCategories ? 
                    <optgroup label="Primary Categories">
                      {siteSettings.homeCategories.map((catSlug: string) => {
                        const category = categories?.find(c => c.slug === catSlug);
                        return category ? (
                          <option key={category.id} value={`category-${category.slug}`}>
                            {category.name}
                          </option>
                        ) : null;
                      })}
                    </optgroup>
                  : null}
                  
                  {/* Additional categories/topics */}
                  {categories && categories.length > 0 && (
                    <optgroup label="Topics">
                      {categories
                        .filter(cat => !siteSettings?.homeCategories?.includes(cat.slug))
                        .map((category) => (
                          <option key={`category-${category.id}`} value={`category-${category.slug}`}>
                            {category.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </div>
          
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