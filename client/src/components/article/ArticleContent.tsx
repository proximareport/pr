import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LockIcon, Share2Icon, BookmarkIcon, EyeIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistance } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArticleContentProps {
  article: {
    id: number;
    title: string;
    content: any;
    featuredImage: string;
    publishedAt: string;
    author: {
      id: number;
      username: string;
      profilePicture?: string;
    };
    category: string;
    readTime: number;
  };
}

function ArticleContent({ article }: ArticleContentProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Function to render different types of content blocks
  const renderContentBlock = (block: any, index: number) => {
    switch (block.type) {
      case "paragraph":
        return (
          <p key={index} className="mb-6 text-white/90 leading-relaxed">
            {block.content}
          </p>
        );
      case "heading":
        const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            key={index}
            id={block.id}
            ref={(el) => (sectionRefs.current[block.id] = el)}
            className={`font-space font-bold text-white mb-4 mt-8 ${
              block.level === 2 ? "text-2xl" : block.level === 3 ? "text-xl" : "text-lg"
            }`}
          >
            {block.content}
          </HeadingTag>
        );
      case "image":
        return (
          <figure key={index} className="mb-6">
            <img
              src={block.url}
              alt={block.alt || "Article image"}
              className="w-full h-auto rounded-lg"
            />
            {block.caption && (
              <figcaption className="text-center text-white/60 text-sm mt-2">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      case "quote":
        return (
          <blockquote
            key={index}
            className="border-l-4 border-purple-500 pl-4 italic text-white/80 my-6"
          >
            <p>{block.content}</p>
            {block.author && (
              <footer className="text-white/60 mt-2 text-sm">— {block.author}</footer>
            )}
          </blockquote>
        );
      case "code":
        return (
          <div key={index} className="my-6">
            <pre className="bg-[#1a1a2e] p-4 rounded-lg overflow-x-auto font-mono text-sm text-white/90 border border-white/10">
              <code>{block.content}</code>
            </pre>
          </div>
        );
      case "list":
        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag
            key={index}
            className={`mb-6 ml-6 text-white/90 ${
              block.ordered ? "list-decimal" : "list-disc"
            }`}
          >
            {block.items.map((item: string, i: number) => (
              <li key={i} className="mb-2">
                {item}
              </li>
            ))}
          </ListTag>
        );
      case "premium":
        if (user && (user.membershipTier === "supporter" || user.membershipTier === "pro")) {
          return renderContentBlock(block.content, `premium-${index}`);
        }
        return (
          <div
            key={index}
            className="premium-content my-10 bg-[#14141E] border border-white/10 rounded-lg p-6"
          >
            <div className="relative z-10 text-center">
              <LockIcon className="mx-auto text-purple-500 h-6 w-6 mb-2" />
              <h3 className="font-space font-bold text-xl mb-2">Premium Content</h3>
              <p className="text-white/80 mb-4">
                This content is available to Supporter and Pro subscribers.
              </p>
              <Button
                className="bg-purple-800 hover:bg-purple-700"
                asChild
              >
                <Link href="/subscribe">Upgrade to Pro</Link>
              </Button>
            </div>
          </div>
        );
      case "embed":
        return (
          <div key={index} className="my-6">
            <div
              className="rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
            {block.caption && (
              <p className="text-center text-white/60 text-sm mt-2">{block.caption}</p>
            )}
          </div>
        );
      case "callout":
        return (
          <div
            key={index}
            className={`p-4 rounded-lg my-6 ${
              block.type === "info"
                ? "bg-blue-900/20 border border-blue-700/30"
                : block.type === "warning"
                ? "bg-amber-900/20 border border-amber-700/30"
                : "bg-purple-900/20 border border-purple-700/30"
            }`}
          >
            <p className="text-white/90">{block.content}</p>
          </div>
        );
      case "divider":
        return <hr key={index} className="my-8 border-white/10" />;
      default:
        return null;
    }
  };

  // Intersection Observer for headings
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => [...prev, entry.target.id]);
          } else {
            setVisibleSections((prev) => prev.filter((id) => id !== entry.target.id));
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    // Observe all section headings
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [article]);

  // Toggle bookmark
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Share article
  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: "Check out this article on Proxima Report",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing article:", error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Article URL copied to clipboard!");
    }
  };

  return (
    <article className="prose prose-invert max-w-none">
      {/* Article header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-12 w-12 border-2 border-purple-500">
            <AvatarImage src={article.author.profilePicture} alt={article.author.username} />
            <AvatarFallback className="bg-purple-900 text-white">
              {article.author.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{article.author.username}</p>
            <p className="text-white/70 text-sm">
              {formatDistance(new Date(article.publishedAt), new Date(), { addSuffix: true })} •{" "}
              {article.readTime} min read
            </p>
          </div>
        </div>

        {/* Article sharing tools */}
        <div className="flex space-x-2 mb-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleBookmark}
                  className={isBookmarked ? "text-purple-500" : "text-white/70"}
                >
                  <BookmarkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked ? "Saved" : "Save Article"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={shareArticle}>
                  <Share2Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Article</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Article content */}
      <div>
        {article.content.blocks.map((block: any, index: number) => renderContentBlock(block, index))}
      </div>

      {/* Article footer */}
      <div className="mt-12 pt-6 border-t border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-white/70 text-sm">
            <EyeIcon className="h-4 w-4 mr-1" /> Views: 1,234
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={shareArticle}
              className="text-white/70 hover:text-purple-500"
            >
              <Share2Icon className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button
              variant={isBookmarked ? "secondary" : "outline"}
              size="sm"
              onClick={toggleBookmark}
              className={isBookmarked ? "bg-purple-900/30 text-purple-500" : "text-white/70"}
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              {isBookmarked ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ArticleContent;
