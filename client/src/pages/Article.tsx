import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import ArticleContent from "@/components/article/ArticleContent";
import GoogleDocsArticleContent from "@/components/article/GoogleDocsArticleContent";
import TableOfContents from "@/components/article/TableOfContents";
import CommentSection from "@/components/article/CommentSection";
import { ChevronLeft } from "lucide-react";

interface ArticleProps {
  params: {
    slug: string;
  };
}

function Article({ params }: ArticleProps) {
  const { slug } = params;
  const [, setLocation] = useLocation();
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; content: string; level: number }>>([]);
  const { user } = useAuth();
  
  // Check if we're in preview mode
  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get('preview') === 'true';
  
  // Fetch article data (with preview parameter if applicable)
  const { data: article, isLoading, error } = useQuery({
    queryKey: [`/api/articles/${slug}`, isPreview],
    queryFn: async () => {
      const url = `/api/articles/${slug}${isPreview ? '?preview=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Article not found');
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to view this draft article');
        } else if (response.status === 401) {
          throw new Error('Authentication required to preview drafts');
        }
        throw new Error('Failed to fetch article');
      }
      return response.json();
    }
  });
  
  // Fetch comments for this article
  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useQuery({
    queryKey: [`/api/articles/${article?.id}/comments`],
    enabled: !!article?.id,
  });
  
  // Extract headings from article content for TOC
  useEffect(() => {
    if (article?.content?.blocks) {
      const extractedHeadings = article.content.blocks
        .filter((block: any) => block.type === 'heading')
        .map((block: any) => ({
          id: block.id,
          content: block.content,
          level: block.level,
        }));
      setHeadings(extractedHeadings);
    }
  }, [article]);
  
  // Set up intersection observer for headings
  useEffect(() => {
    if (!headings.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );
    
    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [headings]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/70">Loading article...</p>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-space font-bold mb-4">Article Not Found</h2>
        <p className="text-white/70 mb-6">The article you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Parallax Header */}
      <div 
        className="parallax-header relative h-[50vh] md:h-[60vh]" 
        style={{ backgroundImage: `url(${article.featuredImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/80 to-transparent"></div>
      </div>
      
      <div className="bg-[#0D0D17] py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="text-purple-500 hover:text-purple-400">
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to articles
              </Link>
            </Button>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <header className="mb-8">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-purple-500 bg-purple-800/20 px-2.5 py-0.5 rounded text-sm font-medium">
                  {article.category}
                </span>
                <span className="text-white/60">
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <h1 className="font-space text-3xl md:text-5xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>
              
              <p className="text-xl text-white/80 mb-6">
                {article.summary}
              </p>
              
              {/* Author information */}
              <div className="flex flex-wrap items-center gap-4 mb-8 border-t border-b border-white/10 py-4">
                {/* If there are multiple authors */}
                {article.authors && article.authors.length > 0 ? (
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-2">
                      {article.authors.slice(0, 4).map((author) => (
                        <div 
                          key={author.id}
                          className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#0D0D17]"
                        >
                          {author.profilePicture ? (
                            <img 
                              src={author.profilePicture} 
                              alt={author.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-purple-800 text-white">
                              {author.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        By {article.authors.map(a => a.username).join(', ')}
                      </div>
                      {article.isCollaborative && (
                        <span className="text-xs inline-block bg-purple-800/30 text-purple-300 px-2 py-0.5 rounded-full">
                          Collaborative Article
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  // Fallback to single author
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      {article.author?.profilePicture ? (
                        <img 
                          src={article.author.profilePicture} 
                          alt={article.author.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-800 text-white">
                          {article.author?.username
                            ? article.author.username.substring(0, 2).toUpperCase()
                            : 'AU'}
                        </div>
                      )}
                    </div>
                    <div className="text-white font-medium">
                      By {article.author?.username || 'Anonymous'}
                    </div>
                  </div>
                )}
                
                {/* Article stats */}
                <div className="flex items-center space-x-4 ml-auto text-white/60">
                  <span>{article.readTime || '5'} min read</span>
                  {article.status === 'draft' && (
                    <span className="bg-amber-800/30 text-amber-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Table of Contents */}
              <div className="md:col-span-1 order-2 md:order-1">
                {headings.length > 0 && (
                  <TableOfContents 
                    headings={headings}
                    activeHeadingId={activeHeadingId}
                  />
                )}
              </div>
              
              {/* Article Content */}
              <div className="md:col-span-3 order-1 md:order-2">
                {/* Check content format and use appropriate component */}
                {Array.isArray(article.content) || (article.content && typeof article.content === 'object' && !article.content.html) ? (
                  <GoogleDocsArticleContent content={article.content} />
                ) : (
                  <ArticleContent article={article} />
                )}
                
                {/* Comments */}
                <CommentSection 
                  articleId={article.id} 
                  comments={commentsData || []} 
                  refetchComments={refetchComments}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Article;
