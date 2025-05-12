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

interface SearchArticleSuggestion {
  id: number;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
}

interface SearchSuggestionsResponse {
  data: SearchArticleSuggestion[];
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
  const isMobileView = inHeader;

  // Fetch search suggestions based on the debounced query
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["/api/search", { q: debouncedQuery, limit: 5 }],
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle navigation to search results page
  const handleSearch = () => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      setOpen(false);
    }
  };

  // Handle keyboard shortcut
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

  // Focus on input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Mobile search as a dialog
  if (isMobileView) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
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
        <CommandDialog open={open} onOpenChange={setOpen}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search articles, topics, authors..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <p>No results found.</p>
              )}
            </CommandEmpty>
            {debouncedQuery.length > 2 && suggestions && suggestions.data && suggestions.data.length > 0 && (
              <CommandGroup heading="Articles">
                {suggestions.data.map((item: any) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      setLocation(`/articles/${item.slug}`);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.category} • {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CommandItem>
                ))}
                <CommandItem
                  onSelect={() => {
                    handleSearch();
                  }}
                  className="justify-center text-primary"
                >
                  See all results for &quot;{debouncedQuery}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  // Desktop search as a popover
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
                  handleSearch();
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
        <PopoverContent
          align="start"
          className="w-[calc(100vw-2rem)] p-0 sm:w-[500px]"
          sideOffset={10}
        >
          <Command className="w-full">
            <CommandList>
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
              {debouncedQuery.length > 2 && suggestions && suggestions.data && suggestions.data.length > 0 && (
                <CommandGroup heading="Articles">
                  {suggestions.data.map((item: any) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => {
                        setLocation(`/articles/${item.slug}`);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.category} • {new Date(item.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                  <CommandItem
                    onSelect={() => {
                      handleSearch();
                    }}
                    className="justify-center text-primary"
                  >
                    See all results for &quot;{debouncedQuery}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}