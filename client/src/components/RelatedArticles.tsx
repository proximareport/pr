import React from 'react';
import { Link } from 'wouter';
import { Clock, User, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { GhostPost } from '../../server/ghostService';

interface RelatedArticlesProps {
  articles: GhostPost[];
  currentArticleSlug?: string;
  className?: string;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ 
  articles, 
  currentArticleSlug,
  className = '' 
}) => {
  // Filter out the current article and limit to 4 articles
  const relatedArticles = articles
    .filter(article => article.slug !== currentArticleSlug)
    .slice(0, 4);

  if (relatedArticles.length === 0) {
    return null;
  }

  const getReadingTime = (html: string) => {
    const wordsPerMinute = 200;
    const words = html.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowRight className="w-6 h-6 text-purple-400" />
          Related Articles
        </h3>
        <Link href="/">
          <span className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
            View All Articles
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatedArticles.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`}>
            <article className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-2xl p-6 transition-all duration-500 backdrop-blur-md hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
              {/* Article Image */}
              {article.feature_image && (
                <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
                  <img
                    src={article.feature_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}

              {/* Article Content */}
              <div className="space-y-3">
                {/* Tags */}
                {article.primary_tag && (
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 hover:bg-purple-500/30"
                  >
                    {article.primary_tag.name}
                  </Badge>
                )}

                {/* Title */}
                <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                  {article.title}
                </h4>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-white/70 text-sm line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-4">
                    {article.primary_author && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{article.primary_author.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{getReadingTime(article.html || '')} min read</span>
                    </div>
                  </div>
                  {article.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(article.published_at), 'MMM d')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-purple-600/0 group-hover:from-purple-600/5 group-hover:via-purple-600/10 group-hover:to-purple-600/5 transition-all duration-500 pointer-events-none" />
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
