import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { GhostPost } from '../../server/ghostService';

interface ArticleParams {
  slug: string;
}

function ArticleAMP() {
  const params = useParams<ArticleParams>();
  const slug = params?.slug;

  // Fetch article data from Ghost
  const { data: article, isLoading, error } = useQuery<GhostPost>({
    queryKey: ['ghost-article-amp', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');
      
      const response = await axios.get<GhostPost>(`/api/ghost/posts/slug/${slug}`);
      return response.data;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="text-white/80 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Article Not Found</h1>
          <p className="text-white/60">The article you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const getReadingTime = (html: string) => {
    const wordsPerMinute = 200;
    const words = html.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <>
      {/* AMP-specific head tags */}
      <script
        async
        custom-element="amp-analytics"
        src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"
      />
      <script
        async
        custom-element="amp-social-share"
        src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"
      />
      <script
        async
        custom-element="amp-sidebar"
        src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Article Header */}
          <header className="mb-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-white/70 mb-6">
              <a href="/" className="hover:text-purple-300">Home</a>
              <span>/</span>
              <a href="/" className="hover:text-purple-300">Articles</a>
              {article.primary_tag && (
                <>
                  <span>/</span>
                  <a href={`/tag/${article.primary_tag.slug}`} className="hover:text-purple-300">
                    {article.primary_tag.name}
                  </a>
                </>
              )}
              <span>/</span>
              <span className="text-white">{article.title}</span>
            </nav>

            {/* Article Meta */}
            <div className="mb-6">
              {article.primary_tag && (
                <span className="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium border border-purple-400/30">
                  {article.primary_tag.name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-white/80 leading-relaxed mb-6">
                {article.excerpt}
              </p>
            )}

            {/* Author and Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
              {article.primary_author && (
                <div className="flex items-center gap-2">
                  <span>By {article.primary_author.name}</span>
                </div>
              )}
              {article.published_at && (
                <div className="flex items-center gap-2">
                  <span>{format(new Date(article.published_at), 'MMMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span>{getReadingTime(article.html || '')} min read</span>
              </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-4 mt-6">
              <amp-social-share
                type="twitter"
                width="40"
                height="40"
                data-param-text={article.title}
                data-param-url={`https://proximareport.com/articles/${article.slug}`}
              />
              <amp-social-share
                type="facebook"
                width="40"
                height="40"
                data-param-text={article.title}
                data-param-url={`https://proximareport.com/articles/${article.slug}`}
              />
              <amp-social-share
                type="linkedin"
                width="40"
                height="40"
                data-param-text={article.title}
                data-param-url={`https://proximareport.com/articles/${article.slug}`}
              />
            </div>
          </header>

          {/* Featured Image */}
          {article.feature_image && (
            <div className="mb-8">
              <amp-img
                src={article.feature_image}
                alt={article.title}
                width="800"
                height="450"
                layout="responsive"
                className="rounded-2xl"
              />
            </div>
          )}

          {/* Article Content */}
          <article className="prose prose-lg prose-invert max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: article.html || '' }}
              className="text-white/90 leading-relaxed space-y-6"
            />
          </article>

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-white/10">
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <a
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-1 rounded-full text-sm transition-colors"
                    >
                      #{tag.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-6 border border-purple-400/30">
              <h3 className="text-xl font-bold text-white mb-3">Enjoyed this article?</h3>
              <p className="text-white/80 mb-4">
                Stay updated with the latest space and STEM news by subscribing to our newsletter.
              </p>
              <a
                href="/subscribe"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Subscribe Now
              </a>
            </div>
          </footer>
        </div>
      </div>

      {/* Analytics */}
      <amp-analytics type="gtag" data-credentials="include">
        <script
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              vars: {
                gtag_id: 'GA_TRACKING_ID',
                config: {
                  'GA_TRACKING_ID': {
                    page_title: article.title,
                    page_location: `https://proximareport.com/articles/${article.slug}`,
                  },
                },
              },
            }),
          }}
        />
      </amp-analytics>
    </>
  );
}

export default ArticleAMP;
