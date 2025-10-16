import { useState, useEffect } from "react";
import { Clock, Eye, TrendingUp, BookOpen, Zap, Target } from "lucide-react";

interface ReadingProgressProps {
  totalWords?: number;
  readingSpeed?: number; // words per minute
}

function ReadingProgress({ totalWords = 0, readingSpeed = 200 }: ReadingProgressProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [wordsRead, setWordsRead] = useState(0);
  const [readingStreak, setReadingStreak] = useState(0);

  useEffect(() => {
    // Animate in after a short delay
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
      
      // Calculate words read based on progress
      if (totalWords > 0) {
        const currentWordsRead = Math.floor((progress / 100) * totalWords);
        setWordsRead(currentWordsRead);
        
        // Calculate time remaining based on progress
        const totalTime = totalWords / readingSpeed; // in minutes
        const remainingTime = totalTime * (1 - progress / 100);
        setTimeRemaining(Math.max(0, remainingTime));
      }
      
      // Track reading streak (consecutive scroll events)
      setReadingStreak(prev => prev + 1);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalWords, readingSpeed]);

  const formatTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      {/* Main Progress Bar */}
      <div className="h-1 bg-gray-800/50 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${readingProgress}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* Enhanced Progress Info Bar - Shows on scroll */}
      {readingProgress > 5 && (
        <div className="bg-gray-900/90 backdrop-blur-md border-b border-white/10 px-2 sm:px-4 py-1 sm:py-2">
          <div className="container mx-auto flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Progress percentage */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-white/80 font-medium">
                  {Math.round(readingProgress)}% complete
                </span>
              </div>

              {/* Words read */}
              {totalWords > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 text-white/60">
                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{wordsRead.toLocaleString()} words read</span>
                </div>
              )}

              {/* Reading time remaining */}
              {totalWords > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 text-white/60">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{formatTime(timeRemaining)} remaining</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Reading speed indicator */}
              <div className="flex items-center gap-1 sm:gap-2 text-white/60">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{readingSpeed} wpm</span>
              </div>

              {/* Reading streak */}
              {readingStreak > 10 && (
                <div className="flex items-center gap-1 sm:gap-2 text-purple-400">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{readingStreak} scrolls</span>
                </div>
              )}

              {/* Total reading time */}
              {totalWords > 0 && (
                <div className="flex items-center gap-1 sm:gap-2 text-white/60">
                  <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{formatTime(totalWords / readingSpeed)} total</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadingProgress;
