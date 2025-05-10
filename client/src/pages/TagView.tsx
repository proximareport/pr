import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ArticleCard from "@/components/article/ArticleCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";

interface TagViewProps {
  params: {
    tagName: string;
  };
}

function TagView({ params }: TagViewProps) {
  const { tagName } = params;
  const decodedTagName = decodeURIComponent(tagName);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["/api/articles/tag", decodedTagName],
    enabled: !!decodedTagName,
  });

  return (
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
              <Button href="/" variant="default" className="bg-purple-700 hover:bg-purple-600">
                Back to Home
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TagView;