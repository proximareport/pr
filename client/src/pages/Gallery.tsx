import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Grid3X3, 
  List, 
  Calendar, 
  User, 
  Tag, 
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useGallery } from "@/services/galleryService";
import { useAuth } from "@/lib/AuthContext";
import { analyticsTracker } from "@/lib/analytics";
import ParticleBackground from "@/components/ParticleBackground";
import GradientBackground from "@/components/GradientBackground";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InContentAd } from "@/components/AdPlacement";

interface GalleryItem {
  id: string;
  title: string;
  excerpt?: string;
  feature_image?: string;
  content_images?: Array<{ url: string; alt?: string }>;
  published_at: string;
  primary_author?: { name: string };
  primary_tag?: { name: string };
  total_images: number;
}

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
    caption: string;
    item: GalleryItem;
  } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: galleryData, isLoading, error } = useGallery();
  const { user } = useAuth();

  // Check if user has access to current page
  const isPaidSubscriber = user?.membershipTier === 'tier1' || user?.membershipTier === 'tier2' || user?.membershipTier === 'tier3';
  const isPageLocked = false; // Gallery is free for all users

  // Filter items based on search query
  const filteredItems = galleryData?.items?.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.primary_tag?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageUrl = (item: GalleryItem, index: number = 0) => {
    if (!item.feature_image) return null;
    
    // If it's a gallery post, we might want to show multiple images
    // For now, just return the feature image
    return item.feature_image;
  };

  const getAllImages = (item: GalleryItem) => {
    const images = [];
    if (item.feature_image) images.push(item.feature_image);
    
    // Add images from content_images array
    if (item.content_images && item.content_images.length > 0) {
      images.push(...item.content_images.map(img => img.url));
    }
    
    return images;
  };

  useEffect(() => {
    analyticsTracker.trackPageView('/gallery');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <GradientBackground variant="nebula" intensity="medium" />
        <ParticleBackground
          particleCount={90}
          speed={0.5}
          colors={['#EC4899', '#3B82F6', '#8B5CF6', '#06B6D4']}
        />
        <div className="relative z-10 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-xl">Loading gallery...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <GradientBackground variant="nebula" intensity="medium" />
        <ParticleBackground
          particleCount={90}
          speed={0.5}
          colors={['#EC4899', '#3B82F6', '#8B5CF6', '#06B6D4']}
        />
        <div className="relative z-10 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Error Loading Gallery</h1>
              <p className="text-gray-400">Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        <GradientBackground variant="nebula" intensity="medium" />
        <ParticleBackground
          particleCount={90}
          speed={0.5}
          colors={['#EC4899', '#3B82F6', '#8B5CF6', '#06B6D4']}
        />
        <div className="relative z-10 text-white">
          <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Space Gallery
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Explore stunning images from space missions, astronomical phenomena, and cosmic wonders.
              </p>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800/50"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800/50"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>

            {/* Results Info */}
            <div className="mb-8">
              {searchQuery ? (
                <p className="text-gray-400">
                  Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              ) : (
                <p className="text-gray-400">
                  Showing {filteredItems.length} image{filteredItems.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredItems.map((item) => {
                const allImages = getAllImages(item);
                const primaryImage = getImageUrl(item);

                if (viewMode === 'list') {
                  return (
                    <Card key={item.id} className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all duration-300">
                      <div className="p-4">
                        {item.primary_tag && (
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                              {item.primary_tag.name}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex gap-4">
                          {primaryImage && (
                            <div className="w-24 h-24 bg-gray-800 rounded-lg flex-shrink-0">
                              <img
                                src={primaryImage}
                                alt={item.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-2 line-clamp-2">{item.title}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                              {item.published_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.published_at)}
                                </div>
                              )}
                              {item.primary_author && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.primary_author.name}
                                </div>
                              )}
                              {item.primary_tag && (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {item.primary_tag.name}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {item.total_images} image{item.total_images !== 1 ? 's' : ''}
                              </div>
                            </div>

                            {allImages.length > 1 && (
                              <div className="flex gap-1">
                                <div className="text-xs text-gray-500">
                                  +{allImages.length - 1} more
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                }

                return (
                  <Card key={item.id} className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all duration-300 group">
                    <div className="relative">
                      {primaryImage && (
                        <div className="aspect-video bg-gray-800 rounded-t-lg overflow-hidden relative">
                          <img
                            src={primaryImage}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onClick={() => setSelectedImage({
                              url: primaryImage,
                              alt: item.title,
                              caption: item.excerpt || '',
                              item: item
                            })}
                          />
                          
                          {/* Show additional images as small thumbnails */}
                          {allImages.length > 1 && (
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              {allImages.slice(1, 4).map((imageUrl, index) => (
                                <div
                                  key={index}
                                  className="w-8 h-8 bg-gray-900/80 rounded border border-white/20 overflow-hidden cursor-pointer hover:scale-110 transition-transform z-10 relative"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Thumbnail clicked:', imageUrl);
                                    setSelectedImage({
                                      url: imageUrl,
                                      alt: item.title,
                                      caption: item.excerpt || '',
                                      item: item
                                    });
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onMouseUp={(e) => e.stopPropagation()}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`${item.title} - Image ${index + 2}`}
                                    className="w-full h-full object-cover pointer-events-none"
                                  />
                                </div>
                              ))}
                              {allImages.length > 4 && (
                                <div className="w-8 h-8 bg-gray-900/80 rounded border border-white/20 flex items-center justify-center text-xs text-white">
                                  +{allImages.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-4">
                        {item.primary_tag && (
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                              {item.primary_tag.name}
                            </Badge>
                          </div>
                        )}
                        
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                          {item.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.published_at)}
                            </div>
                          )}
                          {item.primary_author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.primary_author.name}
                            </div>
                          )}
                          {item.primary_tag && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {item.primary_tag.name}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {item.total_images} image{item.total_images !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {item.excerpt && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {item.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Bottom Ad - Tiny */}
            <div className="py-4">
              <div className="max-w-xs mx-auto">
                <InContentAd />
              </div>
            </div>

            {/* No Results */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Images Found</h3>
                <p className="text-gray-400">
                  {searchQuery 
                    ? `No images match "${searchQuery}". Try a different search term.`
                    : "No images are available at this time."
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700">
            {selectedImage && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">{selectedImage.item.title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.alt}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                  />
                  
                  <div className="mt-4 text-sm text-gray-400">
                    <div className="flex flex-wrap gap-4 mb-2">
                      {selectedImage.item.published_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(selectedImage.item.published_at)}
                        </div>
                      )}
                      {selectedImage.item.primary_author && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {selectedImage.item.primary_author.name}
                        </div>
                      )}
                      {selectedImage.item.primary_tag && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {selectedImage.item.primary_tag.name}
                        </div>
                      )}
                    </div>
                    
                    {selectedImage.item.excerpt && (
                      <p className="text-gray-300 mt-3">{selectedImage.item.excerpt}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Gallery;