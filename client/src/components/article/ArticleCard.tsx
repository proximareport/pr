import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    slug: string;
    summary: string;
    category: string;
    featuredImage: string;
    isBreaking: boolean;
    readTime: number;
    publishedAt: string;
    tags?: string[];
    author: {
      id: number;
      username: string;
      profilePicture?: string;
    };
  };
}

function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-[#14141E] rounded-xl overflow-hidden border border-white/10 hover:border-purple-700/30 transition duration-300 hover:translate-y-[-4px] hover:shadow-[0_0_20px_rgba(157,78,221,0.2)]">
      <div className="relative">
        <img 
          src={article.featuredImage} 
          alt={article.title} 
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-purple-800 text-white border-none text-xs">
            {article.category}
          </Badge>
          {article.isBreaking && (
            <Badge variant="secondary" className="ml-1 bg-red-600 text-white border-none text-xs">
              Breaking
            </Badge>
          )}
        </div>
      </div>
      <div className="p-5">
        <Link href={`/article/${article.slug}`}>
          <h3 className="font-space font-bold text-xl mb-2 line-clamp-2 hover:text-purple-400 transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="text-white/70 mb-3 line-clamp-2">{article.summary}</p>
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/tag/${tag}`}>
                <Badge 
                  className="bg-purple-800/50 hover:bg-purple-700 text-xs py-0 h-5"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
            {article.tags.length > 3 && (
              <Badge className="bg-transparent border border-purple-800/50 text-white/70 text-xs py-0 h-5">
                +{article.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 border border-purple-700/30">
              <AvatarImage 
                src={article.author?.profilePicture || ''} 
                alt={article.author?.username || 'Author'} 
              />
              <AvatarFallback className="bg-purple-900 text-white text-xs">
                {article.author?.username 
                  ? article.author.username.substring(0, 2).toUpperCase() 
                  : 'AU'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <p className="text-white/90 text-sm">{article.author?.username || 'Anonymous'}</p>
            </div>
          </div>
          <span className="text-white/60 text-sm">{article.readTime} min read</span>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
