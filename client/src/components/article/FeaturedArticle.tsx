import React from 'react';
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { getReadingTimeDisplay } from '@/lib/utils';

interface GhostPost {
  id: string;
  title: string;
  slug: string;
  feature_image: string;
  published_at: string;
  excerpt: string;
  reading_time?: number;
  primary_author?: {
    id: string;
    name: string;
    profile_image: string;
  };
  primary_tag?: {
    id: string;
    name: string;
    slug: string;
  };
  authors?: Array<{
    id: string;
    name: string;
    profile_image: string;
  }>;
}

interface FeaturedArticleProps {
  article: GhostPost;
}

function FeaturedArticle({ article }: FeaturedArticleProps) {
  // Debug: Log the featured article data
  console.log('Featured article data:', {
    title: article.title,
    hasReadingTime: !!article.reading_time,
    readingTimeValue: article.reading_time,
    hasAuthors: !!article.authors,
    authorsLength: article.authors?.length || 0,
    hasPrimaryAuthor: !!article.primary_author,
    primaryAuthorName: article.primary_author?.name
  });

  // Safely parse the date with validation
  const publishedDate = new Date(article.published_at);
  const isValidDate = !isNaN(publishedDate.getTime());
  const timeAgo = isValidDate ? formatDistanceToNow(publishedDate, { addSuffix: true }) : 'Recently';
  
  return (
    <div 
      className="relative h-[50vh] md:h-[60vh] overflow-hidden rounded-2xl border border-white/10 group hover:border-purple-500/30 transition-all duration-700 hover:shadow-2xl hover:shadow-purple-500/20"
      style={{ 
        backgroundImage: `url(${article.feature_image})`,
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundColor: '#0D0D17'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/70 to-transparent group-hover:from-[#0D0D17]/90 group-hover:via-[#0D0D17]/80 transition-all duration-700"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/15 transition-all duration-700"></div>
      <div className="container mx-auto px-4 md:px-6 h-full flex flex-col justify-end pb-8 md:pb-12 relative z-10">
        <div className="max-w-4xl">
          {/* Category Badge */}
          {article.primary_tag && (
            <div className="mb-4 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                {article.primary_tag.name}
              </Badge>
            </div>
          )}
          
          {/* Title - Only headline as text-on-image */}
          <Link href={`/articles/${article.slug}`}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 hover:text-purple-300 transition-all duration-500 group-hover:translate-x-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
              {article.title}
            </h2>
          </Link>
          
          {/* Author and metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
            <div className="flex items-center group/author">
              {article.authors && article.authors.length > 1 ? (
                <>
                  <div className="flex -space-x-1 md:-space-x-2">
                    {article.authors.slice(0, 3).map((author, index) => (
                      <div 
                        key={author.id} 
                        className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Avatar className="h-8 w-8 md:h-12 md:w-12">
                          <AvatarImage src={author.profile_image} alt={author.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white text-xs md:text-sm">
                            {author.name ? author.name.substring(0, 2).toUpperCase() : 'AU'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                    {article.authors.length > 3 && (
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-purple-500 bg-purple-900/70 flex items-center justify-center text-white text-xs font-medium">
                        +{article.authors.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 md:ml-3">
                    <p className="text-white font-medium text-sm md:text-base">
                      {article.authors.slice(0, 2).map(author => (
                        <Link key={author.id} href={`/profile/${author.id}`} className="hover:text-purple-300 transition-colors duration-300">
                          {author.name}
                        </Link>
                      )).reduce((prev, curr, index) => [
                        prev,
                        index === 0 ? ', ' : ' and ',
                        curr
                      ])}
                      {article.authors.length > 2 && ` and ${article.authors.length - 2} more`}
                    </p>
                    <p className="text-white/70 text-xs md:text-sm">{timeAgo}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30">
                    <Avatar className="h-8 w-8 md:h-12 md:w-12">
                      <AvatarImage 
                        src={(article.authors?.[0]?.profile_image || article.primary_author?.profile_image) || ''} 
                        alt={(article.authors?.[0]?.name || article.primary_author?.name) || 'Author'} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white text-xs md:text-sm">
                        {(article.authors?.[0]?.name || article.primary_author?.name) 
                          ? (article.authors[0]?.name || article.primary_author?.name)?.substring(0, 2).toUpperCase() 
                          : 'AU'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-2 md:ml-3">
                    <Link 
                      href={`/profile/${(article.authors?.[0]?.id || article.primary_author?.id) || 'unknown'}`}
                      className="hover:text-purple-300 transition-colors duration-300"
                    >
                      <p className="text-white font-medium text-sm md:text-base">
                        {(article.authors?.[0]?.name || article.primary_author?.name) || 'Unknown Author'}
                      </p>
                    </Link>
                    <p className="text-white/70 text-xs md:text-sm">{timeAgo}</p>
                  </div>
                </>
              )}
            </div>
            
            {/* Reading time */}
            {article.reading_time && (
              <div className="flex items-center gap-2 text-white/70">
                <span className="text-xs md:text-sm">{getReadingTimeDisplay(article)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedArticle;
