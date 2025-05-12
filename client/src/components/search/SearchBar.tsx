import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type SearchResult = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
};

type PopularSearch = {
  query: string;
  count: number;
};

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const commandRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  
  // Fetch popular searches for suggestions
  const { data: popularSearches } = useQuery({
    queryKey: ['/api/search/popular'],
    enabled: query.length === 0 && open,
  });
  
  // Fetch search results when query is typed
  const { 
    data: searchResults, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    enabled: debouncedQuery.length > 2 && open,
  });
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle navigation to search results page
  const handleSearch = () => {
    if (query.trim()) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      
      // Save search to history
      apiRequest('POST', '/api/search/history', { query });
    }
  };
  
  // Handle selecting a search result
  const handleSelectResult = (slug: string) => {
    setOpen(false);
    navigate(`/articles/${slug}`);
  };
  
  // Handle selecting a popular search
  const handleSelectPopular = (popularQuery: string) => {
    setQuery(popularQuery);
    setOpen(true);
    navigate(`/search?q=${encodeURIComponent(popularQuery)}`);
    
    // Save search to history
    apiRequest('POST', '/api/search/history', { query: popularQuery });
  };
  
  // Handle key press (Enter to search)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="relative">
      <div className="flex items-center bg-background/95 dark:bg-gray-900/95 border border-input rounded-md">
        <Input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-9 w-[180px] sm:w-[250px] lg:w-[300px] border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {query && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 px-2" 
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 px-2 text-muted-foreground" 
          onClick={handleSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Search results dropdown */}
      {open && (
        <Card 
          ref={commandRef} 
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto"
        >
          <Command>
            <CommandList>
              {isLoading && (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              )}
              
              {isError && (
                <CommandEmpty>An error occurred. Please try again.</CommandEmpty>
              )}
              
              {!debouncedQuery && popularSearches && popularSearches.length > 0 && (
                <CommandGroup heading="Popular Searches">
                  {popularSearches.map((item: PopularSearch) => (
                    <CommandItem
                      key={item.query}
                      onSelect={() => handleSelectPopular(item.query)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      <span>{item.query}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {searchResults && searchResults.data && searchResults.data.length > 0 ? (
                <CommandGroup heading="Articles">
                  {searchResults.data.map((result: SearchResult) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleSelectResult(result.slug)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {result.category} · {result.summary.substring(0, 60)}...
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                debouncedQuery.length > 2 && !isLoading && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )
              )}
            </CommandList>
          </Command>
        </Card>
      )}
    </div>
  );
}