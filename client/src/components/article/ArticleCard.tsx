import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  };
}

function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-[#14141E] hover:bg-[#1A1A2A] border border-gray-700 hover:border-purple-600 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20">
      {/* Image */}
      <div className="relative">
        <img 
          src={article.featuredImage} 
          alt={article.title}
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-purple-600 text-white border-none text-xs">
            {article.category}
          </Badge>
          {article.isBreaking && (
            <Badge variant="secondary" className="ml-1 bg-red-600 text-white border-none text-xs">
              Breaking
            </Badge>
          )}
        </div>
      </div>
      <div className="p-6">
        <Link href={`/article/${article.slug}`}>
          <h3 className="font-bold text-xl mb-3 line-clamp-2 text-white hover:text-purple-400 transition-colors duration-300">
            {article.title}
          </h3>
        </Link>
        <p className="text-gray-300 mb-4 line-clamp-2">{article.summary}</p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <Link key={tag} href={`/tag/${tag}`}>
                <Badge className="bg-purple-800/50 hover:bg-purple-700/50 text-xs py-1 px-2 transition-colors duration-300">
                  {tag}
                </Badge>
              </Link>
            ))}
            {article.tags.length > 3 && (
              <Badge className="bg-transparent border border-purple-500/50 text-white/70 text-xs py-1 px-2">
                +{article.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* If there are multiple authors, show them */}
            {article.authors && article.authors.length > 0 ? (
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {article.authors.slice(0, 3).map((author, index) => (
                    <Avatar key={author.id} className="h-8 w-8 border-2 border-[#14141E]">
                      <AvatarImage 
                        src={author.profilePicture || ''} 
                        alt={author.username} 
                      />
                      <AvatarFallback className="bg-purple-600 text-white text-xs font-semibold">
                        {author.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {article.authors[0].username}
                    {article.authors.length > 1 && ` + ${article.authors.length - 1} more`}
                  </p>
                  {article.isCollaborative && (
                    <span className="text-xs text-purple-400 font-semibold">Collaborative</span>
                  )}
                </div>
              </div>
            ) : (
              // Fallback to use the original author field
              <div className="flex items-center">
                <Avatar className="h-8 w-8 border-2 border-purple-500/40">
                  <AvatarImage 
                    src={article.author?.profilePicture || ''} 
                    alt={article.author?.username || 'Author'} 
                  />
                  <AvatarFallback className="bg-purple-600 text-white text-xs font-semibold">
                    {article.author?.username 
                      ? article.author.username.substring(0, 2).toUpperCase() 
                      : 'AU'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-white text-sm font-medium">{article.author?.username || 'Anonymous'}</p>
                </div>
              </div>
            )}
          </div>
          <span className="text-white/60 text-sm font-medium">{article.readTime} min read</span>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
