import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { 
  Image, 
  Upload, 
  Search, 
  FileText, 
  Video, 
  Music, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Copy, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Eye,
  X as XIcon,
  XCircle
} from 'lucide-react';

// Media Types
type MediaType = "image" | "video" | "document" | "audio" | "all";

// Media Item Type 
import { MediaLibraryItem } from "@shared/schema";

// For backward compatibility (temporary)
type MediaItem = MediaLibraryItem;

// Type guard for MediaItem
function isMediaItem(item: any): item is MediaItem {
  return (
    item &&
    typeof item.id === 'number' &&
    typeof item.fileName === 'string' &&
    typeof item.fileUrl === 'string'
  );
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

// Media Item Card Component
const MediaItemCard = ({ 
  item, 
  onEdit, 
  onDelete,
  isSelected,
  onSelect,
  onPreview 
}: { 
  item: MediaItem; 
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  isSelected?: boolean;
  onSelect?: (item: MediaItem, selected: boolean) => void;
  onPreview?: (item: MediaItem) => void;
}) => {
  return (
    <Card className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}>
      <div className="relative aspect-square bg-gray-100 overflow-hidden group">
        {onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={(checked) => onSelect(item, !!checked)}
              className="h-5 w-5 bg-white/90 backdrop-blur-sm"
            />
          </div>
        )}
        
        {item.fileType === "image" ? (
          <>
            <img
              src={item.fileUrl}
              alt={item.altText || item.fileName}
              className="h-full w-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => onPreview && onPreview(item)}
            />
            {onPreview && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/70 hover:bg-white"
                  onClick={() => onPreview(item)}
                >
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
              </div>
            )}
          </>
        ) : (
          <div 
            className="h-full w-full flex items-center justify-center bg-gray-100 cursor-pointer"
            onClick={() => onPreview && onPreview(item)}
          >
            <MediaTypeIcon type={item.fileType} />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm font-medium truncate" title={item.fileName}>
            {item.fileName}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(item)}>
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.fileUrl)}>
                <Copy className="mr-2 h-4 w-4" /> Copy URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <MediaTypeIcon type={item.fileType} />
          <span className="ml-1">
            {item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)}
          </span>
          <span className="mx-1">•</span>
          <span>{formatFileSize(item.fileSize)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Upload Media Modal Component
const UploadModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return null;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', altText);
      formData.append('caption', caption);
      formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(Boolean)));
      formData.append('isPublic', isPublic.toString());

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded.",
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const resetForm = () => {
    setFile(null);
    setAltText('');
    setCaption('');
    setTags('');
    setIsPublic(true);
    setPreviewUrl(null);
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload images, videos, audio, or documents to your media library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
                className="cursor-pointer"
              />
              {previewUrl && (
                <div className="relative mt-2 w-full max-h-[200px] overflow-hidden rounded border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 rounded-full"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for accessibility"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption or description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="news, technology, science"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Make file publicly accessible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Media Item Modal Component
const EditMediaModal = ({ 
  isOpen, 
  onClose, 
  mediaItem 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mediaItem: MediaItem | null;
}) => {
  if (!mediaItem) return null;

  const [altText, setAltText] = useState(mediaItem.altText || '');
  const [caption, setCaption] = useState(mediaItem.caption || '');
  const [tags, setTags] = useState(mediaItem.tags?.join(', ') || '');
  const [isPublic, setIsPublic] = useState(mediaItem.isPublic);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset form when mediaItem changes
  React.useEffect(() => {
    if (mediaItem) {
      setAltText(mediaItem.altText || '');
      setCaption(mediaItem.caption || '');
      setTags(mediaItem.tags?.join(', ') || '');
      setIsPublic(mediaItem.isPublic);
    }
  }, [mediaItem]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      
      const response = await apiRequest('PATCH', `/api/media/${mediaItem.id}`, {
        altText,
        caption,
        isPublic,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update media item");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Update successful",
        description: "Media item has been updated.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
          <DialogDescription>
            Update information for {mediaItem.fileName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {mediaItem.fileType === 'image' && (
              <div className="w-full max-h-[200px] overflow-hidden rounded border border-gray-200">
                <img
                  src={mediaItem.fileUrl}
                  alt={mediaItem.altText || mediaItem.fileName}
                  className="w-full h-auto object-contain max-h-[200px]"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for accessibility"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption or description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="news, technology, science"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Make file publicly accessible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Media Item Confirmation Modal
const DeleteMediaModal = ({ 
  isOpen, 
  onClose, 
  mediaItem 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mediaItem: MediaItem | null;
}) => {
  if (!mediaItem) return null;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/media/${mediaItem.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete media item");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Delete successful",
        description: "Media item has been deleted.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });
  
  const handleDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Media</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this media item? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium">{mediaItem.fileName}</p>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <MediaTypeIcon type={mediaItem.fileType} />
            <span className="ml-1">
              {mediaItem.fileType.charAt(0).toUpperCase() +
                mediaItem.fileType.slice(1)}
            </span>
            <span className="mx-1">•</span>
            <span>{formatFileSize(mediaItem.fileSize)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Preview Media Item Modal
const PreviewMediaModal = ({
  isOpen,
  onClose,
  mediaItem
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem | null;
}) => {
  if (!mediaItem) return null;
  
  const isImage = mediaItem.fileType === 'image';
  const isVideo = mediaItem.fileType === 'video';
  const isAudio = mediaItem.fileType === 'audio';
  const isDocument = mediaItem.fileType === 'document';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview: {mediaItem.fileName}</DialogTitle>
          <DialogDescription>
            {mediaItem.caption || "No caption provided"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 flex flex-col items-center">
          {isImage && (
            <img 
              src={mediaItem.fileUrl} 
              alt={mediaItem.altText || mediaItem.fileName}
              className="max-w-full max-h-[50vh] object-contain"
            />
          )}
          
          {isVideo && (
            <video 
              controls
              className="max-w-full max-h-[50vh]"
              src={mediaItem.fileUrl}
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          {isAudio && (
            <div className="w-full">
              <audio controls className="w-full" src={mediaItem.fileUrl}>
                Your browser does not support the audio tag.
              </audio>
              <div className="mt-4 flex justify-center">
                <Music className="h-24 w-24 text-gray-300" />
              </div>
            </div>
          )}
          
          {isDocument && (
            <div className="text-center">
              <FileText className="h-24 w-24 mx-auto text-gray-300" />
              <p className="mt-4">Document preview not available</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => window.open(mediaItem.fileUrl, '_blank')}
              >
                Open Document
              </Button>
            </div>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">File name:</span> 
            <span>{mediaItem.fileName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">File type:</span> 
            <span>{mediaItem.mimeType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">File size:</span> 
            <span>{formatFileSize(mediaItem.fileSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Uploaded:</span> 
            <span>{new Date(mediaItem.createdAt).toLocaleString()}</span>
          </div>
          {mediaItem.tags && mediaItem.tags.length > 0 && (
            <div className="flex justify-between">
              <span className="font-medium">Tags:</span> 
              <span>{mediaItem.tags.join(', ')}</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => navigator.clipboard.writeText(mediaItem.fileUrl)}
            variant="outline"
            className="mr-2"
          >
            <Copy className="h-4 w-4 mr-2" /> Copy URL
          </Button>
          <Button 
            onClick={() => window.open(mediaItem.fileUrl, '_blank')}
            variant="outline"
          >
            Open in New Tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Bulk Delete Confirmation Modal
const BulkDeleteMediaModal = ({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!items.length) return null;

      const response = await apiRequest("DELETE", `/api/media/bulk`, {
        ids: items.map(item => item.id)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete media items");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Media deleted",
        description: `${items.length} media items have been deleted successfully.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (!items.length) return;

    setIsDeleting(true);
    await deleteMutation.mutateAsync();
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete {items.length} Items</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {items.length} media items? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500">
            The items will be permanently removed from your media library.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Media Library Component
const MediaLibraryTab = () => {
  const [activeTab, setActiveTab] = useState<MediaType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Query to fetch media items with pagination
  const { data: mediaResponse, isLoading, isError } = useQuery({
    queryKey: ['/api/media', searchQuery, activeTab, currentPage, itemsPerPage],
    queryFn: async () => {
      let url = '/api/media';
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (activeTab !== 'all') {
        params.append('type', activeTab);
      }
      
      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch media items');
      }
      return response.json();
    }
  });

  // Extract the actual media items from the response
  const mediaItems = mediaResponse?.media || [];
  const serverTotalPages = mediaResponse?.totalPages || 1;
  const serverTotalItems = mediaResponse?.total || 0;
  
  // Filter and sort media items based on active tab, search query, and sort options
  const filteredMedia = React.useMemo(() => {
    if (!mediaItems || mediaItems.length === 0) return [];
    
    // Apply sorting
    return [...mediaItems].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } 
      else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.fileName.localeCompare(b.fileName) 
          : b.fileName.localeCompare(a.fileName);
      } 
      else if (sortBy === 'size') {
        return sortOrder === 'asc' 
          ? a.fileSize - b.fileSize 
          : b.fileSize - a.fileSize;
      }
      return 0;
    });
  }, [mediaItems, sortBy, sortOrder]);
  
  // Use client-side pagination when filters are applied, otherwise use server pagination
  const paginatedMedia = React.useMemo(() => {
    // If we're using search or sorting (client-side filters), handle pagination locally
    if (searchQuery || sortBy !== 'date' || sortOrder !== 'desc') {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredMedia.slice(startIndex, endIndex);
    }
    // Otherwise, just use what the server gave us since it's already paginated
    return filteredMedia;
  }, [filteredMedia, currentPage, itemsPerPage, searchQuery, sortBy, sortOrder]);
  
  // Calculate total pages - use server value when no client filtering is done
  const totalPages = React.useMemo(() => {
    if (searchQuery || sortBy !== 'date' || sortOrder !== 'desc') {
      return Math.ceil(filteredMedia.length / itemsPerPage);
    }
    return serverTotalPages;
  }, [filteredMedia.length, itemsPerPage, serverTotalPages, searchQuery, sortBy, sortOrder]);

  const handleEditItem = (item: MediaItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (item: MediaItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };
  
  const handlePreviewItem = (item: MediaItem) => {
    setSelectedItem(item);
    setIsPreviewModalOpen(true);
  };
  
  const handleSelectItem = (item: MediaItem, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will be fetched automatically due to the searchQuery dependency
  };

  const clearSearch = () => {
    setSearchQuery("");
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-gray-500">
            Manage your uploaded media files
          </p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="mt-4 md:mt-0"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload Media
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-6">
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
          <div className="flex space-x-2">
            <div className="w-1/3">
              <Select 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as MediaType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/3">
              <Select 
                value={sortBy} 
                onValueChange={(value) => setSortBy(value as "date" | "name" | "size")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' 
                  ? <><SortAsc className="mr-2 h-4 w-4" /> Ascending</> 
                  : <><SortDesc className="mr-2 h-4 w-4" /> Descending</>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
          <p className="text-sm">
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </p>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedItems([])}
            >
              Clear selection
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
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
        <div className="text-center py-12 border rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Image className="h-12 w-12" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No media found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search.`
              : "Upload your first media file to get started."}
          </p>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-6"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Media
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedMedia.map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onPreview={handlePreviewItem}
                isSelected={selectedItems.some(i => i.id === item.id)}
                onSelect={handleSelectItem}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      {selectedItem && (
        <>
          <EditMediaModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            mediaItem={selectedItem}
          />
          <DeleteMediaModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            mediaItem={selectedItem}
          />
          <PreviewMediaModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            mediaItem={selectedItem}
          />
        </>
      )}
      <BulkDeleteMediaModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        items={selectedItems}
      />
    </div>
  );
};

export default MediaLibraryTab;