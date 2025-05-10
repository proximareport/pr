import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface FeaturedArticleProps {
  article: {
    id: number;
    title: string;
    slug: string;
    summary: string;
    featuredImage: string;
    isBreaking: boolean;
    readTime: number;
    publishedAt: string;
    author: {
      id: number;
      username: string;
      profilePicture?: string;
      bio?: string;
    };
  };
}

function FeaturedArticle({ article }: FeaturedArticleProps) {
  const publishedDate = new Date(article.publishedAt);
  const timeAgo = formatDistanceToNow(publishedDate, { addSuffix: true });
  
  return (
    <div 
      className="parallax-header relative h-[70vh] md:h-[80vh]" 
      style={{ backgroundImage: `url(${article.featuredImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/80 to-transparent"></div>
      <div className="container mx-auto px-4 h-full flex items-end pb-12 relative z-10">
        <div className="max-w-3xl">
          <div className="mb-4">
            {article.isBreaking && (
              <Badge className="mr-2 bg-purple-800 text-white border-none">
                BREAKING
              </Badge>
            )}
            <span className="text-white/80 text-sm">Posted {timeAgo}</span>
          </div>
          
          <Link href={`/article/${article.slug}`}>
            <h1 className="font-space text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              {article.title}
            </h1>
          </Link>
          
          <p className="text-white/90 text-lg md:text-xl mb-6">
            {article.summary}
          </p>
          
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500">
              <Avatar className="h-12 w-12">
                <AvatarImage src={article.author.profilePicture} alt={article.author.username} />
                <AvatarFallback className="bg-purple-900 text-white">
                  {article.author.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="ml-3">
              <p className="text-white font-medium">{article.author.username}</p>
              <p className="text-white/70 text-sm">
                {article.author.bio ? article.author.bio.substring(0, 30) + '...' : ''} • {article.readTime} min read
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedArticle;
