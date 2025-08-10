import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

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
      className="relative h-[50vh] md:h-[60vh] overflow-hidden rounded-lg border border-white/10"
      style={{ 
        backgroundImage: `url(${article.feature_image})`,
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundColor: '#0D0D17'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/70 to-transparent"></div>
      <div className="container mx-auto px-4 md:px-6 h-full flex flex-col justify-end pb-8 md:pb-12 relative z-10">
        <div className="max-w-4xl">
          <Link href={`/articles/${article.slug}`}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 hover:text-purple-400 transition-colors duration-300">
              {article.title}
            </h2>
          </Link>
          
          <p className="text-white/90 text-sm md:text-base lg:text-lg mb-4 md:mb-6 line-clamp-3 md:line-clamp-none">
            {article.excerpt}
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center">
              {article.authors && article.authors.length > 1 ? (
                <>
                  <div className="flex -space-x-1 md:-space-x-2">
                    {article.authors.slice(0, 3).map((author, index) => (
                      <div key={author.id} className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-purple-500">
                        <Avatar className="h-8 w-8 md:h-12 md:w-12">
                          <AvatarImage src={author.profile_image} alt={author.name} />
                          <AvatarFallback className="bg-purple-900 text-white text-xs md:text-sm">
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
                      {article.authors.slice(0, 2).map(author => author.name).join(', ')}
                      {article.authors.length > 2 && ` and ${article.authors.length - 2} more`}
                    </p>
                    <p className="text-white/70 text-xs md:text-sm">
                      {article.reading_time || 5} min read
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-purple-500">
                    <Avatar className="h-8 w-8 md:h-12 md:w-12">
                      <AvatarImage 
                        src={article.authors?.[0]?.profile_image || article.primary_author?.profile_image} 
                        alt={article.authors?.[0]?.name || article.primary_author?.name} 
                      />
                      <AvatarFallback className="bg-purple-900 text-white text-xs md:text-sm">
                        {(() => {
                          const authorName = article.authors?.[0]?.name || article.primary_author?.name;
                          return authorName ? authorName.substring(0, 2).toUpperCase() : 'AU';
                        })()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-2 md:ml-3">
                    <p className="text-white font-medium text-sm md:text-base">
                      {article.authors?.[0]?.name || article.primary_author?.name || 'Anonymous'}
                    </p>
                    <p className="text-white/70 text-xs md:text-sm">
                      {article.reading_time || 5} min read
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Badge and Date moved here */}
            <div className="flex flex-wrap items-center gap-2">
              {article.primary_tag && (
                <Badge className="bg-purple-800 text-white border-none text-xs md:text-sm">
                  {article.primary_tag.name}
                </Badge>
              )}
              <span className="text-white/80 text-xs md:text-sm">Posted {timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedArticle;
