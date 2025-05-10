import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FeaturedArticle from "@/components/article/FeaturedArticle";
import ArticleCard from "@/components/article/ArticleCard";
import LaunchCountdown from "@/components/article/LaunchCountdown";
import MembershipBanner from "@/components/layout/MembershipBanner";
import AstronomyPortal from "@/components/astronomy/AstronomyPortal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";

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

function Home() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get featured article (first breaking article or most recent)
  const { data: featuredArticles } = useQuery<Article[]>({
    queryKey: ["/api/articles/featured"],
  });

  const featuredArticle = featuredArticles?.[0];

  // Get articles with pagination
  const { data: articles, isLoading, refetch } = useQuery<Article[]>({
    queryKey: ["/api/articles", { limit: 12, offset: (currentPage - 1) * 12, category: selectedCategory }],
  });

  // Refetch when category changes
  useEffect(() => {
    setCurrentPage(1);
    refetch();
  }, [selectedCategory, refetch]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Load more articles
  const loadMore = () => {
    setCurrentPage(currentPage + 1);
  };

  return (
    <>
      {/* Featured Article */}
      {featuredArticle && <FeaturedArticle article={featuredArticle} />}

      {/* Membership Banner */}
      {!user?.membershipTier || user.membershipTier === "free" ? <MembershipBanner /> : null}

      {/* Launch Countdown */}
      <LaunchCountdown />

      {/* Article Feed */}
      <section className="py-12 bg-[#0D0D17]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-space text-2xl md:text-3xl font-bold">Latest Articles</h2>
            
            <Tabs 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
              className="hidden md:block"
            >
              <TabsList className="bg-[#1E1E2D]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="space">Space</TabsTrigger>
                <TabsTrigger value="science">Science</TabsTrigger>
                <TabsTrigger value="technology">Technology</TabsTrigger>
                <TabsTrigger value="astronomy">Astronomy</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="block md:hidden">
              <select 
                value={selectedCategory} 
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-[#1E1E2D] text-white border border-white/10 rounded-md p-1"
              >
                <option value="all">All</option>
                <option value="space">Space</option>
                <option value="science">Science</option>
                <option value="technology">Technology</option>
                <option value="astronomy">Astronomy</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Loading articles...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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
      
      {/* Astronomy Portal Section */}
      <AstronomyPortal />
    </>
  );
}

export default Home;
