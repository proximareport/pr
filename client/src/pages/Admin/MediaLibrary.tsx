import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, MoreVertical, Upload, Image, FileText, Video, Music, Filter, Search } from "lucide-react";

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

// Media Item Card Component
const MediaItemCard = ({ item, onEdit, onDelete }: { 
  item: MediaItem; 
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}) => {
  return (
    <Card className="overflow-hidden">
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
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item)}>
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
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Upload Modal Component
const UploadModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return null;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", altText);
      formData.append("caption", caption);
      formData.append("isPublic", isPublic.toString());
      
      if (tags.trim()) {
        const tagArray = tags.split(",").map(tag => tag.trim());
        formData.append("tags", JSON.stringify(tagArray));
      }

      const response = await fetch("/api/media/upload", {
        method: "POST",
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
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
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
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    await uploadMutation.mutateAsync();
    setIsUploading(false);
  };

  const resetForm = () => {
    setFile(null);
    setAltText("");
    setCaption("");
    setIsPublic(true);
    setTags("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Add a new file to your media library
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                required
              />
              {file && (
                <p className="text-sm text-gray-500">
                  Selected file: {file.name} ({formatFileSize(file.size)})
                </p>
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
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set initial values when mediaItem changes
  React.useEffect(() => {
    if (mediaItem) {
      setAltText(mediaItem.altText || "");
      setCaption(mediaItem.caption || "");
      setIsPublic(mediaItem.isPublic);
      setTags(mediaItem.tags ? mediaItem.tags.join(", ") : "");
    }
  }, [mediaItem]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!mediaItem) return null;

      const tagArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      
      const response = await apiRequest("PATCH", `/api/media/${mediaItem.id}`, {
        altText: altText || null,
        caption: caption || null,
        isPublic,
        tags: tagArray.length > 0 ? tagArray : null
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update media");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Media updated",
        description: "Your media item has been updated successfully.",
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaItem) return;

    setIsUpdating(true);
    await updateMutation.mutateAsync();
    setIsUpdating(false);
  };

  if (!mediaItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
          <DialogDescription>
            Update details for {mediaItem.fileName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="mb-4">
              {mediaItem.fileType === "image" ? (
                <img
                  src={mediaItem.fileUrl}
                  alt={mediaItem.altText || mediaItem.fileName}
                  className="h-40 w-auto mx-auto object-contain"
                />
              ) : (
                <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded-md">
                  <MediaTypeIcon type={mediaItem.fileType} />
                  <p className="ml-2 text-sm text-gray-600">{mediaItem.fileName}</p>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-altText">Alt Text</Label>
              <Input
                id="edit-altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for accessibility"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-caption">Caption</Label>
              <Input
                id="edit-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption or description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="news, technology, science"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-isPublic">Make file publicly accessible</Label>
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

// Delete Confirmation Modal Component
const DeleteMediaModal = ({
  isOpen,
  onClose,
  mediaItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaItem: MediaItem | null;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!mediaItem) return null;

      const response = await apiRequest("DELETE", `/api/media/${mediaItem.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete media");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      toast({
        title: "Media deleted",
        description: "Your media item has been deleted successfully.",
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
    if (!mediaItem) return;

    setIsDeleting(true);
    await deleteMutation.mutateAsync();
    setIsDeleting(false);
  };

  if (!mediaItem) return null;

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

// Main Media Library Component
const MediaLibrary = () => {
  const [activeTab, setActiveTab] = useState<MediaType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
    }
  });

  // Filter media items based on active tab and search query
  const filteredMedia = React.useMemo(() => {
    if (!mediaItems) return [];
    return mediaItems;
  }, [mediaItems]);

  const handleEditItem = (item: MediaItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (item: MediaItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will be fetched automatically due to the searchQuery dependency
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
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
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as MediaType)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="image" className="flex-1">Images</TabsTrigger>
                <TabsTrigger value="video" className="flex-1">Videos</TabsTrigger>
                <TabsTrigger value="document" className="flex-1">Documents</TabsTrigger>
                <TabsTrigger value="audio" className="flex-1">Audio</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
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
    </AdminLayout>
  );
};

export default MediaLibrary;