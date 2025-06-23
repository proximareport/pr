import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SimpleSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SimpleSearchBar({ 
  placeholder = "Search articles...", 
  onSearch,
  className = "" 
}: SimpleSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    // If a custom onSearch callback is provided, use it
    if (onSearch) {
      onSearch(query);
      return;
    }
    
    // Default behavior: navigate to home page with search query
    // You can customize this to navigate to a search results page if needed
    setLocation(`/?search=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}

// Mobile version with different styling
export function MobileSimpleSearchBar({ 
  placeholder = "Search...", 
  onSearch,
  className = "" 
}: SimpleSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    setIsOpen(false);
    
    if (onSearch) {
      onSearch(query);
      return;
    }
    
    setLocation(`/?search=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-white/90 hover:text-purple-500"
      >
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 ${className}`}>
      <div className="bg-gray-900 rounded-lg p-4 mx-4 w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              Search
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 