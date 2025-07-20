import { useState, useEffect } from "react";
import { BookmarkIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shareArticle } from "@/lib/utils";

interface TableOfContentsProps {
  headings: {
    id: string;
    content: string;
    level: number;
  }[];
  activeHeadingId: string | null;
}

function TableOfContents({ headings, activeHeadingId }: TableOfContentsProps) {
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      description: isBookmarked 
        ? "Article removed from your saved items" 
        : "Article saved to your profile",
      duration: 3000,
    });
  };

  const shareArticleHandler = async () => {
    try {
      const result = await shareArticle(
        document.title,
        "Check out this article on Proxima Report",
        window.location.href
      );
      
      if (result.success && result.method === 'clipboard') {
        toast({
          title: "Link copied",
          description: "Article link copied to clipboard",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not share the article. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div>
      <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
        {headings.map((heading) => (
          <li key={heading.id} style={{ marginLeft: `${(heading.level - 2) * 8}px` }}>
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`text-left hover:text-purple-500 transition w-full py-1 px-1 rounded touch-manipulation ${
                activeHeadingId === heading.id ? "text-purple-500" : "text-white/80"
              }`}
            >
              {heading.content}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/10">
        <Button 
          variant={isBookmarked ? "secondary" : "outline"}
          className={`w-full text-xs md:text-sm ${isBookmarked ? "bg-purple-900/30 text-purple-500" : ""}`}
          onClick={toggleBookmark}
        >
          <BookmarkIcon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
          {isBookmarked ? "Saved" : "Save Article"}
        </Button>

        <div className="flex gap-1.5 md:gap-2 mt-3 md:mt-4">
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-white/70 hover:text-purple-500 transition flex-1 h-8 md:h-10"
            onClick={() => window.open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(window.location.href), "_blank")}
          >
            <svg className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" />
            </svg>
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-white/70 hover:text-purple-500 transition flex-1 h-8 md:h-10"
            onClick={() => window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(window.location.href), "_blank")}
          >
            <svg className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-white/70 hover:text-purple-500 transition flex-1 h-8 md:h-10"
            onClick={() => window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(window.location.href), "_blank")}
          >
            <svg className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-white/70 hover:text-purple-500 transition flex-1 h-8 md:h-10" 
            onClick={shareArticleHandler}
          >
            <Share2Icon className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TableOfContents;
