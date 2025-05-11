import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Video, FileText, Music, Search, Filter } from 'lucide-react';

// Media Types
type MediaType = "image" | "video" | "document" | "audio" | "all";

// Media Item Type
interface MediaItem {
  id: number;
  userId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: MediaType;
  mimeType: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  isPublic: boolean;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// File Size Formatter
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Media Type Icon Component
const MediaTypeIcon = ({ type }: { type: MediaType }) => {
  switch (type) {
    case "image":
      return <Image className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    case "document":
      return <FileText className="w-5 h-5" />;
    case "audio":
      return <Music className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

interface MediaSelectorProps {
  onSelect: (media: MediaItem) => void;
  allowedTypes?: MediaType[];
  buttonLabel?: string;
  triggerComponent?: React.ReactNode;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  onSelect,
  allowedTypes = ["all", "image", "video", "document", "audio"],
  buttonLabel = "Select Media",
  triggerComponent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Query to fetch media items
  const { data: mediaItems, isLoading, isError } = useQuery({
    queryKey: ['/api/media', searchQuery, activeTab],
    queryFn: async () => {
      let url = '/api/media';
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (activeTab !== 'all') {
        params.append('type', activeTab);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch media items');
      }
      return response.json();
    },
    enabled: isOpen,
  });

  // Filter media items
  const filteredMedia = React.useMemo(() => {
    if (!mediaItems) return [];
    
    return mediaItems.filter((item: MediaItem) => {
      // Filter by active tab if it's not 'all'
      if (activeTab !== 'all' && item.fileType !== activeTab) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !item.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
        const hasMatchingTag = item.tags?.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }, [mediaItems, activeTab, searchQuery]);

  const handleMediaSelect = (media: MediaItem) => {
    onSelect(media);
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will be fetched automatically due to the searchQuery dependency
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button variant="outline" type="button">
            {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            Choose media from your library to insert
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-6 mt-4">
          <div className="w-full md:w-1/2">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search media files..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-500 hover:text-gray-900"
                  >
                    ×
                  </button>
                )}
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
          <div className="w-full md:w-1/2">
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as MediaType)}>
              <TabsList className="w-full">
                {allowedTypes.includes("all") && <TabsTrigger value="all" className="flex-1">All</TabsTrigger>}
                {allowedTypes.includes("image") && <TabsTrigger value="image" className="flex-1">Images</TabsTrigger>}
                {allowedTypes.includes("video") && <TabsTrigger value="video" className="flex-1">Videos</TabsTrigger>}
                {allowedTypes.includes("document") && <TabsTrigger value="document" className="flex-1">Documents</TabsTrigger>}
                {allowedTypes.includes("audio") && <TabsTrigger value="audio" className="flex-1">Audio</TabsTrigger>}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load media items. Please try again.</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Reload
            </Button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Image className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No media found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search.`
                : "Upload media in the Media Library first."}
            </p>
            <Button
              onClick={() => window.open('/admin/media-library', '_blank')}
              className="mt-6"
            >
              Go to Media Library
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {filteredMedia.map((item: MediaItem) => (
              <div
                key={item.id}
                className="border rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleMediaSelect(item)}
              >
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {item.fileType === "image" ? (
                    <img
                      src={item.fileUrl}
                      alt={item.altText || item.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <MediaTypeIcon type={item.fileType} />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate" title={item.fileName}>
                    {item.fileName}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <MediaTypeIcon type={item.fileType} />
                    <span className="ml-1">
                      {item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}
                    </span>
                    <span className="mx-1">•</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;