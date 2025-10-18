import { useState, useEffect } from "react";
import { BookmarkIcon, Share2Icon, EyeIcon, ClockIcon, CalendarIcon, UserIcon } from "lucide-react";
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in the TOC after a short delay
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  if (headings.length === 0) {
    return (
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center py-8">
          <EyeIcon className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
          <p className="text-white/60 text-sm">No headings found in this article</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Enhanced TOC Header */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-400/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Navigation</span>
        </div>
        <h3 className="text-lg font-bold text-white">Table of Contents</h3>
        <p className="text-sm text-white/60 mt-1">{headings.length} sections</p>
      </div>

      {/* Enhanced TOC List */}
      <div className="space-y-1">
        {headings.map((heading, index) => (
          <div 
            key={heading.id} 
            className={`transition-all duration-300 transform hover:scale-[1.02] ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
            style={{ 
              transitionDelay: `${index * 50}ms`,
              marginLeft: `${Math.max(0, (heading.level - 2) * 16)}px` 
            }}
          >
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`group relative w-full text-left transition-all duration-300 rounded-xl px-4 py-3 touch-manipulation ${
                activeHeadingId === heading.id 
                  ? "text-purple-300 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 shadow-lg shadow-purple-500/20" 
                  : "text-white/80 hover:text-purple-300 hover:bg-white/5 border border-transparent hover:border-purple-400/20"
              }`}
            >
              {/* Active indicator */}
              {activeHeadingId === heading.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-400 to-violet-400 rounded-r-full"></div>
              )}
              
              {/* Heading level indicator */}
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeHeadingId === heading.id 
                    ? "bg-purple-400 scale-125" 
                    : "bg-white/30 group-hover:bg-purple-400/60"
                }`}></div>
                
                <span className={`font-medium text-sm leading-relaxed line-clamp-2 transition-all duration-300 ${
                  heading.level === 2 ? "text-base" : "text-sm"
                }`}>
                  {heading.content}
                </span>
              </div>
              
              {/* Hover effect */}
              <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                activeHeadingId === heading.id 
                  ? "bg-gradient-to-r from-purple-500/5 to-violet-500/5" 
                  : "bg-gradient-to-r from-purple-500/0 to-violet-500/0 group-hover:from-purple-500/5 group-hover:to-violet-500/5"
              }`}></div>
            </button>
          </div>
        ))}
      </div>

      {/* Enhanced Action Section */}
      <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
        {/* Article Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <ClockIcon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-white/60">Reading Time</p>
            <p className="text-sm font-medium text-white">5 min</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <EyeIcon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-white/60">Views</p>
            <p className="text-sm font-medium text-white">2.4k</p>
          </div>
        </div>

        {/* Enhanced Bookmark Button */}
        <Button 
          variant={isBookmarked ? "secondary" : "outline"}
          className={`w-full h-11 transition-all duration-300 group ${
            isBookmarked 
              ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-400/40 shadow-lg shadow-purple-500/20" 
              : "border-white/20 text-white/70 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/30"
          }`}
          onClick={toggleBookmark}
        >
          <BookmarkIcon className={`mr-2 h-4 w-4 transition-all duration-300 ${
            isBookmarked ? "text-purple-400" : "text-white/60 group-hover:text-purple-400"
          }`} /> 
          {isBookmarked ? "Article Saved" : "Save Article"}
        </Button>

        {/* Enhanced Share Buttons */}
        <div className="flex gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="flex-1 h-11 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 group"
            onClick={() => window.open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(window.location.href), "_blank")}
          >
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" />
            </svg>
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            className="flex-1 h-11 bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 group"
            onClick={shareArticleHandler}
          >
            <Share2Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          </Button>
        </div>

      </div>
    </div>
  );
}

export default TableOfContents;
