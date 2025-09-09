import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ArticleCard from "@/components/article/ArticleCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { generateTagSEO } from "@/lib/seoUtils";

interface TagViewProps {
  params: {
    tagName: string;
  };
}

function TagView({ params }: TagViewProps) {
  const { tagName } = params;
  const decodedTagName = decodeURIComponent(tagName);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["/api/articles/tag", decodedTagName],
    queryFn: async () => {
      console.log('TagView: Fetching articles for tag:', decodedTagName);
      const response = await fetch(`/api/articles/tag/${decodedTagName}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      console.log('TagView: Raw API response for tag', decodedTagName, ':', data);
      
      // Ensure we have an array and validate each article
      if (!Array.isArray(data)) {
        console.error('Articles data is not an array:', data);
        return [];
      }
      
      
      // Data is already cleaned by the API endpoint, just return it
      console.log('TagView: Articles count:', data.length);
      console.log('TagView: Articles:', data);
      
      return data;
    },
    enabled: !!decodedTagName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <>
      <SEO {...generateTagSEO(decodedTagName)} />
      <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Tag className="h-6 w-6 text-purple-500" />
        <h1 className="text-3xl font-space font-bold">
          Articles tagged with <span className="text-purple-500">{decodedTagName}</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#14141E] rounded-xl p-4 border border-white/10">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: any) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-space font-bold mb-4">No articles found</h2>
              <p className="text-white/70 mb-8">
                We couldn't find any articles with the tag "{decodedTagName}".
              </p>
              <Link href="/">
                <Button variant="default" className="bg-purple-700 hover:bg-purple-600">
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}

export default TagView;