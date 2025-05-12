import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  User, 
  Loader2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

interface SearchFilters {
  category?: string;
  tags?: string[];
  author?: number;
  dateFrom?: string;
  dateTo?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface SearchPagination {
  page: number;
  limit: number;
}

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    orderBy: 'publishedAt',
    orderDirection: 'desc',
  });
  const [pagination, setPagination] = useState<SearchPagination>({
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch categories for filter options
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Fetch search results
  const { 
    data: searchResults, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['/api/search', query, filters, pagination],
    enabled: query.length > 2,
  });
  
  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.category) params.set('category', filters.category);
    if (filters.tags && filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    if (filters.dateTo) params.set('to', filters.dateTo);
    params.set('page', pagination.page.toString());
    
    // Update URL without causing navigation
    window.history.replaceState(
      {}, 
      '', 
      `${window.location.pathname}?${params.toString()}`
    );
  }, [query, filters, pagination]);
  
  // Handle search submission
  const handleSearch = () => {
    if (query.trim()) {
      // Reset to first page when new search is performed
      setPagination(prev => ({ ...prev, page: 1 }));
      refetch();
      
      // Save search to history
      apiRequest('POST', '/api/search/history', { query });
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  
  return (
    <div className="container mx-auto py-8 px-4 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          {searchResults?.total 
            ? `Found ${searchResults.total} results for "${query}"`
            : 'Enter a search term to find articles'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Filters sidebar */}
        <div className="hidden md:block md:col-span-3 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={filters.category || ''} 
                  onValueChange={(value) => handleFilterChange('category', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sort order */}
              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select 
                  value={`${filters.orderBy || 'publishedAt'}-${filters.orderDirection || 'desc'}`}
                  onValueChange={(value) => {
                    const [orderBy, orderDirection] = value.split('-');
                    handleFilterChange('orderBy', orderBy);
                    handleFilterChange('orderDirection', orderDirection as 'asc' | 'desc');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publishedAt-desc">Newest first</SelectItem>
                    <SelectItem value="publishedAt-asc">Oldest first</SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="viewCount-desc">Most viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date range filter - simplified */}
              <div className="space-y-2">
                <Label>Date range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="date" 
                    placeholder="From" 
                    value={filters.dateFrom || ''} 
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                  />
                  <Input 
                    type="date" 
                    placeholder="To" 
                    value={filters.dateTo || ''} 
                    onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search results and mobile filters */}
        <div className="col-span-1 md:col-span-9 lg:col-span-10 space-y-6">
          {/* Search form */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
              
              {/* Mobile filters toggle */}
              <div className="mt-4 md:hidden">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide filters' : 'Show filters'}
                </Button>
                
                {showFilters && (
                  <div className="mt-4 space-y-4 p-4 border rounded-md bg-background">
                    {/* Mobile filters (simplified) */}
                    <div className="space-y-2">
                      <Label>Sort by</Label>
                      <Select 
                        value={`${filters.orderBy || 'publishedAt'}-${filters.orderDirection || 'desc'}`}
                        onValueChange={(value) => {
                          const [orderBy, orderDirection] = value.split('-');
                          handleFilterChange('orderBy', orderBy);
                          handleFilterChange('orderDirection', orderDirection as 'asc' | 'desc');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="publishedAt-desc">Newest first</SelectItem>
                          <SelectItem value="publishedAt-asc">Oldest first</SelectItem>
                          <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                          <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                          <SelectItem value="viewCount-desc">Most viewed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={filters.category || ''} 
                        onValueChange={(value) => handleFilterChange('category', value || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All categories</SelectItem>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Searching...</span>
            </div>
          )}
          
          {/* Error state */}
          {isError && (
            <Card className="text-center py-8">
              <CardContent>
                <div className="text-destructive text-lg">
                  An error occurred while searching. Please try again.
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* No results */}
          {!isLoading && !isError && searchResults?.data?.length === 0 && query && (
            <Card className="text-center py-8">
              <CardContent>
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">No results found</h2>
                <p className="text-muted-foreground">
                  No articles match your search criteria. Try adjusting your search terms or filters.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Results listing */}
          {!isLoading && !isError && searchResults?.data?.length > 0 && (
            <>
              <div className="space-y-4">
                {searchResults.data.map((article: any) => (
                  <Card key={article.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {article.featuredImage && (
                        <div className="md:w-1/4 h-40 md:h-auto">
                          <img 
                            src={article.featuredImage} 
                            alt={article.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`flex-1 p-6 ${article.featuredImage ? 'md:w-3/4' : 'w-full'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="mb-2">
                            {article.category}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {article.publishedAt && formatDate(article.publishedAt)}
                          </div>
                        </div>
                        <h2 className="text-xl font-bold mb-2 hover:text-primary cursor-pointer" onClick={() => setLocation(`/articles/${article.slug}`)}>
                          {article.title}
                        </h2>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {article.summary}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {article.tags && article.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setLocation(`/articles/${article.slug}`)}
                          >
                            Read more
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {searchResults.totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="text-sm px-4">
                    Page {pagination.page} of {searchResults.totalPages}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= searchResults.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}