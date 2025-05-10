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
        <p className="text-white/70 mb-4 line-clamp-2">{article.summary}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 border border-purple-700/30">
              <AvatarImage src={article.author.profilePicture} alt={article.author.username} />
              <AvatarFallback className="bg-purple-900 text-white text-xs">
                {article.author.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <p className="text-white/90 text-sm">{article.author.username}</p>
            </div>
          </div>
          <span className="text-white/60 text-sm">{article.readTime} min read</span>
        </div>
      </div>
    </article>
  );
}

export default ArticleCard;
