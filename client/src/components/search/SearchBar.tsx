import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Types for search suggestions (quick results)
interface ArticleSuggestion {
  id: number;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
}

interface SuggestionsResponse {
  data: ArticleSuggestion[];
}

// Types for full search results
interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  featuredImage?: string;
  authorId: number;
  viewCount: number;
}

// Types for user search results
interface User {
  id: number;
  username: string;
  bio?: string;
  profilePicture?: string;
  role: string;
}

interface SearchResponse {
  data: Article[];
  users?: User[];
  total: number;
  page: number;
  totalPages: number;
}

interface SearchBarProps {
  inHeader?: boolean;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ inHeader = false, placeholder = "Search articles...", onSearch }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  // Fetch quick suggestions
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery<SuggestionsResponse>({
    queryKey: ["/api/search/suggestions", { q: debouncedQuery, limit: 5 }],
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
  
  // Fetch full search results
  const { data: searchData, isLoading: loadingResults } = useQuery<SearchResponse>({
    queryKey: ["/api/search", { q: debouncedQuery, limit: 10 }],
    enabled: debouncedQuery.length > 2 && open,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
  
  // Check if we have results to display
  const hasSuggestions = !!suggestionsData?.data && suggestionsData.data.length > 0;
  const hasResults = !!searchData?.data && searchData.data.length > 0;
  const hasUserResults = !!searchData?.users && searchData.users.length > 0;
  const isLoading = loadingSuggestions || loadingResults;

  // Navigate to article page when clicking a result
  const navigateToArticle = (slug: string) => {
    setLocation(`/article/${slug}`);
    setOpen(false);
  };
  
  // Navigate to user profile when clicking a user result
  const navigateToUserProfile = (username: string) => {
    setLocation(`/profile/${username}`);
    setOpen(false);
  };
  
  // Handle view all results
  const handleFullSearch = () => {
    // Just close the dialog - we don't navigate to a separate search page anymore
    setOpen(false);
    
    // If an onSearch callback was provided, call it
    if (onSearch && query.trim()) {
      onSearch(query);
    }
  };

  // Setup keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // MOBILE VERSION (in header)
  if (inHeader) {
    return (
      <>
        {/* Mobile search icon button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        {/* Desktop search button */}
        <div className="hidden md:flex relative max-w-md">
          <Button
            variant="outline"
            size="sm"
            className="pl-3 w-full justify-start text-muted-foreground text-sm h-9"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        
        {/* Search dialog for mobile */}
        <CommandDialog open={open} onOpenChange={setOpen}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search articles, topics, authors..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none"
            />
            {query && (
              <Button
                variant="ghost"
                className="h-6 w-6 p-0 rounded-md"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Search results list */}
          <CommandList className="max-h-[70vh] overflow-auto">
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <p className="p-4 text-center">No results found.</p>
              )}
            </CommandEmpty>
            
            {/* Display search results */}
            {debouncedQuery.length > 2 && (
              <>
                {/* Quick suggestions */}
                {hasSuggestions && (
                  <CommandGroup heading="Quick Suggestions">
                    {suggestionsData.data.map((item) => (
                      <CommandItem
                        key={`suggestion-${item.id}`}
                        onSelect={() => navigateToArticle(item.slug)}
                        className="py-2"
                      >
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.category} • {new Date(item.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {/* Article search results */}
                {hasResults && (
                  <CommandGroup heading="Articles">
                    {searchData.data.map((article) => (
                      <CommandItem
                        key={`result-${article.id}`}
                        onSelect={() => navigateToArticle(article.slug)}
                        className="py-3 px-2"
                      >
                        <div className="flex w-full gap-3">
                          {article.featuredImage && (
                            <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden">
                              <img 
                                src={article.featuredImage} 
                                alt={article.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium line-clamp-1">{article.title}</span>
                            <span className="text-xs text-muted-foreground mb-1">
                              {article.category} • {new Date(article.publishedAt).toLocaleDateString()}
                            </span>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {article.summary}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {/* User search results */}
                {hasUserResults && searchData?.users && (
                  <CommandGroup heading="Authors">
                    {searchData.users.map((user) => (
                      <CommandItem
                        key={`user-${user.id}`}
                        onSelect={() => navigateToUserProfile(user.username)}
                        className="py-2 px-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-muted">
                            {user.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt={user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{user.username}</div>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {/* View more results link */}
                {(hasResults || hasUserResults) && searchData.total > searchData.data.length && (
                  <CommandItem
                    onSelect={handleFullSearch}
                    className="justify-center text-primary border-t"
                  >
                    View all {searchData.total} results for "{debouncedQuery}"
                  </CommandItem>
                )}
              </>
            )}
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  // DESKTOP VERSION (standalone search)
  return (
    <div className="relative w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFullSearch();
                }
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : query ? (
                <X
                  className="h-4 w-4 cursor-pointer text-muted-foreground"
                  onClick={() => setQuery("")}
                />
              ) : (
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                  /
                </kbd>
              )}
            </div>
          </div>
        </PopoverTrigger>
        
        {/* Dropdown content */}
        <PopoverContent
          align="start"
          className="w-[calc(100vw-2rem)] p-0 sm:w-[650px]"
          sideOffset={10}
        >
          <Command className="w-full">
            <CommandList className="max-h-[80vh] overflow-auto">
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No results found.
                  </p>
                )}
              </CommandEmpty>
              
              {/* Display search results */}
              {debouncedQuery.length > 2 && (
                <>
                  {/* Quick suggestions */}
                  {hasSuggestions && (
                    <CommandGroup heading="Quick Suggestions">
                      {suggestionsData.data.map((item) => (
                        <CommandItem
                          key={`suggestion-${item.id}`}
                          onSelect={() => navigateToArticle(item.slug)}
                          className="py-2"
                        >
                          <div className="flex flex-col">
                            <span>{item.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.category} • {new Date(item.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {/* Article search results */}
                  {hasResults && (
                    <CommandGroup heading="Articles">
                      {searchData.data.map((article) => (
                        <CommandItem
                          key={`result-${article.id}`}
                          onSelect={() => navigateToArticle(article.slug)}
                          className="py-3 px-2"
                        >
                          <div className="flex w-full gap-3">
                            {article.featuredImage && (
                              <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden">
                                <img 
                                  src={article.featuredImage} 
                                  alt={article.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium line-clamp-1">{article.title}</span>
                              <span className="text-xs text-muted-foreground mb-1">
                                {article.category} • {new Date(article.publishedAt).toLocaleDateString()}
                              </span>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.summary}
                              </p>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {/* User search results */}
                  {hasUserResults && searchData?.users && (
                    <CommandGroup heading="Authors">
                      {searchData.users.map((user) => (
                        <CommandItem
                          key={`user-${user.id}`}
                          onSelect={() => navigateToUserProfile(user.username)}
                          className="py-2 px-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-muted">
                              {user.profilePicture ? (
                                <img 
                                  src={user.profilePicture} 
                                  alt={user.username}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{user.username}</div>
                              {user.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  
                  {/* View more results link */}
                  {(hasResults || hasUserResults) && searchData.total > searchData.data.length && (
                    <CommandItem
                      onSelect={handleFullSearch}
                      className="justify-center text-primary border-t"
                    >
                      View all {searchData.total} results for "{debouncedQuery}"
                    </CommandItem>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}