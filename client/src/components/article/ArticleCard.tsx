import React, { useState } from 'react';
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Eye, TrendingUp, Calendar, User, ArrowRight, Bookmark, Share2, Heart } from "lucide-react";

interface Author {
  id: number;
  username: string;
  profilePicture?: string;
}

interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    slug: string;
    summary: string;
    featuredImage: string;
    category: string;
    author: Author;
    publishedAt: string;
    readTime: number;
    tags: string[];
    isBreaking?: boolean;
    isCollaborative?: boolean;
    authors?: Author[];
    views?: number;
    trending?: boolean;
    likes?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  variant?: 'default' | 'featured' | 'compact';
  onLike?: (articleId: number) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (article: any) => void;
}

function ArticleCard({ 
  article, 
  variant = 'default', 
  onLike, 
  onBookmark, 
  onShare 
}: ArticleCardProps) {
  const [isLiked, setIsLiked] = useState(article.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(article.likes || 0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(article.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(article.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(article);
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <article className={`group relative overflow-hidden transition-all duration-700 hover:scale-[1.02] ${
      isFeatured 
        ? 'bg-gradient-to-br from-gray-900/60 via-purple-900/30 to-gray-900/60 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/30' 
        : isCompact
        ? 'bg-gray-900/40 border border-white/15 rounded-2xl shadow-xl hover:shadow-purple-500/25'
        : 'bg-gray-900/50 border border-white/20 rounded-3xl shadow-2xl hover:shadow-purple-500/40'
    } hover:border-purple-400/50 backdrop-blur-md hover:backdrop-blur-lg`}>
      
      {/* Enhanced Image Container */}
      <div className="relative overflow-hidden">
        <img 
          src={article.featuredImage} 
          alt={article.title}
          className={`w-full object-cover transition-all duration-1000 ${
            isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          } group-hover:scale-110 ${
            isFeatured ? 'h-64 md:h-80' : isCompact ? 'h-32' : 'h-48 md:h-56'
          }`}
          onLoad={() => setIsImageLoaded(true)}
        />
        
        {/* Loading Skeleton */}
        {!isImageLoaded && (
          <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-700 animate-pulse ${
            isFeatured ? 'h-64 md:h-80' : isCompact ? 'h-32' : 'h-48 md:h-56'
          }`} />
        )}
        
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-purple-900/30 group-hover:from-black/90 group-hover:via-black/40 group-hover:to-purple-900/40 transition-all duration-700"></div>
        
        {/* Enhanced Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-purple-600/95 backdrop-blur-md text-white border-none text-xs font-semibold px-3 py-1.5 shadow-xl shadow-purple-500/30 hover:bg-purple-500/95 transition-all duration-300">
            {article.category}
          </Badge>
          {article.isBreaking && (
            <Badge variant="secondary" className="bg-gradient-to-r from-red-600/95 to-red-500/95 backdrop-blur-md text-white border-none text-xs font-semibold px-3 py-1.5 shadow-xl shadow-red-500/30 animate-pulse">
              🔥 Breaking
            </Badge>
          )}
          {article.trending && (
            <Badge variant="secondary" className="bg-gradient-to-r from-orange-500/95 to-yellow-500/95 backdrop-blur-md text-white border-none text-xs font-semibold px-3 py-1.5 shadow-xl shadow-orange-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>

        {/* Enhanced Read Time Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/70 backdrop-blur-md text-white border-none text-xs font-semibold px-3 py-1.5 shadow-lg">
            <Clock className="w-3 h-3 mr-1.5" />
            {article.readTime} min
          </Badge>
        </div>

        {/* Interactive Action Buttons */}
        <div className="absolute top-3 right-16 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <button
            onClick={handleLike}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
              isLiked 
                ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30' 
                : 'bg-black/60 text-white/80 hover:bg-red-500/90 hover:text-white'
            }`}
            aria-label={isLiked ? 'Unlike article' : 'Like article'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
              isBookmarked 
                ? 'bg-purple-500/90 text-white shadow-lg shadow-purple-500/30' 
                : 'bg-black/60 text-white/80 hover:bg-purple-500/90 hover:text-white'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-black/60 text-white/80 hover:bg-purple-500/90 hover:text-white backdrop-blur-md transition-all duration-300"
            aria-label="Share article"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Enhanced Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/15 group-hover:via-purple-500/8 group-hover:to-purple-500/25 transition-all duration-700"></div>
        
        {/* Animated Border Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400/30 transition-all duration-700 rounded-t-3xl"></div>
      </div>

      {/* Content Container */}
      <div className={`p-4 ${isFeatured ? 'md:p-6' : isCompact ? 'p-3' : 'md:p-5'}`}>
        {/* Title */}
        <Link href={`/articles/${article.slug}`}>
          <h3 className={`font-bold line-clamp-2 text-white hover:text-purple-300 transition-all duration-500 group-hover:translate-x-1 ${
            isFeatured ? 'text-xl md:text-2xl mb-3' : isCompact ? 'text-sm mb-2' : 'text-lg md:text-xl mb-3'
          }`}>
            {article.title}
          </h3>
        </Link>

        {/* Summary */}
        {!isCompact && (
          <p className={`text-gray-300 mb-4 line-clamp-2 transition-all duration-500 group-hover:text-gray-200 ${
            isFeatured ? 'text-base md:text-lg leading-relaxed' : 'text-sm md:text-base leading-relaxed'
          }`}>
            {article.summary}
          </p>
        )}

        {/* Enhanced Tags */}
        {article.tags && article.tags.length > 0 && !isCompact && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <Link key={`${article.id}-tag-${index}-${tag}`} href={`/tag/${tag}`}>
                <Badge className="bg-purple-800/60 hover:bg-purple-600/70 text-white text-xs py-1.5 px-3 transition-all duration-300 hover:scale-105 border border-purple-500/40 hover:border-purple-400/60 shadow-lg hover:shadow-purple-500/25">
                  {tag}
                </Badge>
              </Link>
            ))}
            {article.tags.length > 3 && (
              <Badge key={`${article.id}-more-tags`} className="bg-transparent border border-purple-500/60 text-white/80 text-xs py-1.5 px-3 hover:bg-purple-500/30 hover:text-white transition-all duration-300">
                +{article.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        {/* Enhanced Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            {/* Authors */}
            {article.authors && article.authors.length > 0 ? (
              <div className="flex items-center min-w-0">
                <div className="flex -space-x-2 mr-3 flex-shrink-0">
                  {article.authors.slice(0, 3).map((author, index) => (
                    <Avatar key={`${article.id}-author-${index}-${author.id}`} className={`border-2 border-gray-800 transition-all duration-500 group-hover:border-purple-400/60 hover:scale-110 ${
                      isCompact ? 'h-6 w-6' : 'h-8 w-8'
                    }`}>
                      <AvatarImage 
                        src={author.profilePicture || ''} 
                        alt={author.username} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-violet-600 text-white text-xs font-semibold">
                        {String(author.username || author.name || 'A').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-white font-medium truncate transition-all duration-300 group-hover:text-purple-200 ${
                    isCompact ? 'text-xs' : 'text-sm'
                  }`}>
                    {String(article.authors[0].username || article.authors[0].name || 'Author')}
                    {article.authors.length > 1 && ` + ${article.authors.length - 1} more`}
                  </p>
                  {article.isCollaborative && (
                    <span className="text-xs text-purple-400 font-semibold bg-purple-500/20 px-2 py-0.5 rounded-full">
                      Collaborative
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center min-w-0">
                <Avatar className={`border-2 border-gray-800 transition-all duration-500 group-hover:border-purple-400/60 hover:scale-110 ${
                  isCompact ? 'h-6 w-6' : 'h-8 w-8'
                }`}>
                  <AvatarImage 
                    src={article.author.profilePicture || ''} 
                    alt={article.author.username} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-violet-600 text-white text-xs font-semibold">
                    {String(article.author.username).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 min-w-0 flex-1">
                  <p className={`text-white font-medium truncate transition-all duration-300 group-hover:text-purple-200 ${
                    isCompact ? 'text-xs' : 'text-sm'
                  }`}>
                    {String(article.author.username)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Metadata */}
          <div className="flex items-center gap-3 text-white/70">
            {article.views && (
              <div className="flex items-center gap-1.5 text-xs bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                <Eye className="w-3 h-3" />
                <span className="font-medium">{formatViews(article.views)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-xs bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
              <Calendar className="w-3 h-3" />
              <span className="font-medium">{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Read More Button */}
        {isFeatured && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link href={`/articles/${article.slug}`}>
              <div className="flex items-center justify-between text-purple-400 hover:text-purple-300 transition-all duration-500 group-hover:translate-x-2 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-xl border border-purple-500/20 hover:border-purple-400/40">
                <span className="font-semibold">Read Full Article</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Enhanced Hover Effects */}
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-purple-400/30 transition-all duration-700 pointer-events-none"></div>
      
      {/* Enhanced Glow Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/8 group-hover:via-purple-500/4 group-hover:to-purple-500/8 transition-all duration-700 pointer-events-none"></div>
      
      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"></div>
    </article>
  );
}

export default ArticleCard;
