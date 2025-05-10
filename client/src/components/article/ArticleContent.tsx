import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LockIcon, Share2Icon, BookmarkIcon, EyeIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    tags?: string[];
  };
}

function ArticleContent({ article }: ArticleContentProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [pollVotes, setPollVotes] = useState<Record<number, number[]>>({});
  const [pollResults, setPollResults] = useState<Record<number, number[]>>({});

  // In a real implementation, this would fetch poll results from the server
  useEffect(() => {
    // This simulates polls having some initial votes
    // In a real implementation, we would fetch this data from the API
    const initialResults: Record<number, number[]> = {};
    
    // Find all poll blocks in the article content
    article.content.forEach((block: any, index: number) => {
      if (block.type === 'poll' && block.options && Array.isArray(block.options)) {
        // Generate some random votes for each option (between 0-10 votes per option)
        initialResults[index] = block.options.map((_: any) => Math.floor(Math.random() * 10));
      }
    });
    
    setPollResults(initialResults);
  }, [article.content]);

  // Handle voting on polls
  const handlePollVote = (blockIndex: number, optionIndex: number, allowMultiple: boolean) => {
    if (!user) {
      // If user is not logged in, show a message
      return;
    }
    
    // Update local vote state
    setPollVotes(prevVotes => {
      let newVotes;
      const blockVotes = prevVotes[blockIndex] || [];
      
      if (allowMultiple) {
        // For multiple choice polls
        if (blockVotes.includes(optionIndex)) {
          // Remove vote if already selected
          newVotes = {
            ...prevVotes,
            [blockIndex]: blockVotes.filter(v => v !== optionIndex)
          };
        } else {
          // Add vote
          newVotes = {
            ...prevVotes,
            [blockIndex]: [...blockVotes, optionIndex]
          };
        }
      } else {
        // For single choice polls
        if (blockVotes.length === 1 && blockVotes[0] === optionIndex) {
          // Remove vote if clicking the same option
          newVotes = {
            ...prevVotes,
            [blockIndex]: []
          };
        } else {
          // Replace with new vote
          newVotes = {
            ...prevVotes,
            [blockIndex]: [optionIndex]
          };
        }
      }
      
      // Update poll results based on the vote change
      setPollResults(prevResults => {
        const results = {...prevResults};
        const blockResults = [...(results[blockIndex] || [])];
        
        // Make sure we have an array of the correct length
        while (blockResults.length < article.content[blockIndex].options.length) {
          blockResults.push(0);
        }
        
        // Increment/decrement vote counts based on changes
        // This is a simplified implementation
        if (newVotes[blockIndex].includes(optionIndex)) {
          blockResults[optionIndex] += 1;
        } else {
          blockResults[optionIndex] = Math.max(0, blockResults[optionIndex] - 1);
        }
        
        results[blockIndex] = blockResults;
        return results;
      });
      
      // In a real implementation, we would send the vote to the server here
      // apiRequest("POST", `/api/articles/${article.id}/polls/${blockIndex}/vote`, { 
      //   options: newVotes[blockIndex]
      // });
      
      return newVotes;
    });
  };

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
      case "poll":
        // Get current votes for this poll
        const currentVotes = pollVotes[index] || [];
        
        return (
          <div key={index} className="mb-8 rounded-lg overflow-hidden">
            <div 
              className="p-6 rounded-lg" 
              style={{
                backgroundColor: block.backgroundColor || "#1e1e2d",
                color: block.textColor || "#ffffff"
              }}
            >
              <h3 className="text-lg font-semibold mb-4">{block.question}</h3>
              <div className="space-y-3">
                {block.options.map((option: string, optIndex: number) => {
                  const isSelected = currentVotes.includes(optIndex);
                  
                  return (
                    <div 
                      key={optIndex}
                      className={`flex items-center gap-3 p-3 rounded-md hover:bg-black/20 cursor-pointer transition-colors ${isSelected ? 'bg-black/20' : ''}`}
                      onClick={() => handlePollVote(index, optIndex, block.allowMultiple)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-white/40'}`}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  );
                })}
              </div>
              
              {!user && (
                <div className="mt-4 p-2 text-sm bg-white/10 rounded-md text-center">
                  Please <Link to="/login" className="text-blue-400 hover:underline">log in</Link> to vote
                </div>
              )}
              
              {user && (
                <div className="mt-4 text-sm opacity-70">
                  {block.allowMultiple 
                    ? "You can select multiple options" 
                    : "Select one option"}
                </div>
              )}
            </div>
          </div>
        );
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

        {/* Article tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 mt-4">
            {article.tags.map((tag) => (
              <Link key={tag} href={`/tag/${tag}`}>
                <Badge 
                  className="bg-purple-800 hover:bg-purple-700 px-3 py-1 cursor-pointer"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

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
