import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/search/SearchBar";
import { Calendar, Tag, Filter, Clock, Calendar as CalendarIcon, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  publishedAt: string;
  featuredImage?: string;
  primaryAuthorId: number;
  viewCount: number;
}

interface SearchResultData {
  data: SearchArticle[];
  total: number;
  page: number;
  totalPages: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function SearchResults() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState("publishedAt");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);

  // Reset page when search parameters change
  useEffect(() => {
    setPage(1);
  }, [query, orderBy, orderDirection, dateFrom, dateTo, category, tags]);

  // Update query when URL parameters change
  useEffect(() => {
    const urlQuery = params.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [location, params, query]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery<SearchResultData>({
    queryKey: [
      "/api/search",
      {
        q: query,
        page,
        limit: 10,
        orderBy,
        orderDirection,
        from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
        to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
        category,
        tags: tags.length > 0 ? tags.join(",") : undefined,
      },
    ],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch categories
  const { data: categoriesData } = useQuery<{ data: Category[] }>({
    queryKey: ["/api/categories"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const categories = categoriesData?.data || [];

  // Clear all filters
  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCategory(undefined);
    setTags([]);
    setOrderBy("publishedAt");
    setOrderDirection("desc");
  };

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  // Format date range for display
  const getDateRangeText = () => {
    if (dateFrom && dateTo) {
      return `${format(dateFrom, "MMM d, yyyy")} - ${format(dateTo, "MMM d, yyyy")}`;
    } else if (dateFrom) {
      return `From ${format(dateFrom, "MMM d, yyyy")}`;
    } else if (dateTo) {
      return `Until ${format(dateTo, "MMM d, yyyy")}`;
    }
    return "All time";
  };

  // Load more results
  const loadMore = () => {
    if (searchResults && searchResults?.page < searchResults?.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <div className="mb-4">
          <SearchBar placeholder="Refine your search..." onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {/* Sort order */}
          <Select
            value={`${orderBy}-${orderDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-");
              setOrderBy(field);
              setOrderDirection(direction as "asc" | "desc");
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort by</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedAt-desc">Most recent</SelectItem>
              <SelectItem value="publishedAt-asc">Oldest first</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              <SelectItem value="viewCount-desc">Most viewed</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select
            value={category || ""}
            onValueChange={(value) => setCategory(value || undefined)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{category || "All categories"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((cat: any) => (
                <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal sm:w-[240px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col sm:flex-row gap-2 p-3">
                <div>
                  <div className="mb-2 font-medium">From</div>
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </div>
                <div>
                  <div className="mb-2 font-medium">To</div>
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t p-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Clear dates
                </Button>
                <Button onClick={() => document.body.click()}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear filters button */}
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="w-full sm:w-auto"
            disabled={!category && !dateFrom && !dateTo && tags.length === 0 && orderBy === "publishedAt" && orderDirection === "desc"}
          >
            Clear filters
          </Button>
        </div>

        {/* Active filters */}
        {(category || dateFrom || dateTo || tags.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {category}
                <button
                  onClick={() => setCategory(undefined)}
                  className="ml-1 h-4 w-4 rounded-full hover:bg-muted-foreground/10"
                >
                  ×
                </button>
              </Badge>
            )}
            {(dateFrom || dateTo) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {getDateRangeText()}
                <button
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  className="ml-1 h-4 w-4 rounded-full hover:bg-muted-foreground/10"
                >
                  ×
                </button>
              </Badge>
            )}
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                Tag: {tag}
                <button
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="ml-1 h-4 w-4 rounded-full hover:bg-muted-foreground/10"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Separator className="my-4" />
      </div>

      {/* Search results */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 aspect-video">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="flex-1 p-6">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : searchResults && searchResults.data && searchResults.data.length > 0 ? (
          <>
            <p className="text-muted-foreground">
              Found {searchResults.total || 0} results for "{query}"
            </p>
            {searchResults.data.map((article: SearchArticle) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {article.featuredImage && (
                    <div className="md:w-1/4">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover aspect-video"
                      />
                    </div>
                  )}
                  <div className={`flex-1 p-6 ${!article.featuredImage ? "md:w-full" : ""}`}>
                    <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">
                      <a href={`/articles/${article.slug}`}>{article.title}</a>
                    </CardTitle>
                    <CardDescription className="mb-4 line-clamp-2">
                      {article.summary}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {article.category && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 cursor-pointer hover:bg-primary/10"
                          onClick={() => setCategory(article.category)}
                        >
                          <Tag className="h-3 w-3" />
                          {article.category}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </Badge>
                      {article.tags &&
                        article.tags.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => !tags.includes(tag) && setTags([...tags, tag])}
                          >
                            #{tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {searchResults.page && searchResults.totalPages && searchResults.page < searchResults.totalPages && (
              <div className="flex justify-center mt-8">
                <Button onClick={loadMore} className="min-w-[200px]">
                  Load more results
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-2xl font-bold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any articles matching "{query}"
              {(category || dateFrom || dateTo || tags.length > 0) &&
                ". Try removing some filters."}
            </p>
            {(category || dateFrom || dateTo || tags.length > 0) && (
              <Button onClick={clearFilters}>Clear all filters</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}