import React, { useState, useEffect } from 'react';
import { useGallery, useGalleryTags, type GalleryItem, type GalleryTag } from '@/services/galleryService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { analyticsTracker } from '@/lib/analytics';
import { BannerAd, InContentAd } from '@/components/AdPlacement';
import PremiumAccess from '@/components/PremiumAccess';
import { useAuth } from '@/lib/AuthContext';
import SEO from '@/components/SEO';
import { generateGallerySEO } from '@/lib/seoUtils';
import ParticleBackground from '@/components/ParticleBackground';
import GradientBackground from '@/components/GradientBackground';

import { 
  Search, 
  Filter, 
  Grid3X3, 
  Grid2X2, 
  List, 
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Gallery: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt?: string;
    caption?: string;
    item: GalleryItem;
  } | null>(null);

  const { user } = useAuth();
  const { data: galleryData, isLoading, error } = useGallery(currentPage, 20, selectedTag);
  const { data: tags } = useGalleryTags();

  // Check if user has access to current page
  const isPaidSubscriber = user?.membershipTier === 'tier1' || user?.membershipTier === 'tier2' || user?.membershipTier === 'tier3';
  const isPageLocked = currentPage >= 3 && !isPaidSubscriber;

  // Filter items based on search query
  const filteredItems = galleryData?.posts?.filter(item => 
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
    // Add more image logic here if needed
    return images;
  };

  useEffect(() => {
    analyticsTracker.trackPageView('/gallery');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-4"></div>
          <span className="text-slate-300">Loading gallery...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Gallery</h2>
          <p className="text-gray-400">Failed to load gallery images. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...generateGallerySEO()} />
      <div className="min-h-screen relative overflow-hidden">
        <GradientBackground variant="nebula" intensity="medium" />
        <ParticleBackground 
          particleCount={90} 
          speed={0.5}
          colors={['#EC4899', '#3B82F6', '#8B5CF6', '#06B6D4']}
        />
        <div className="relative z-10 text-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Proxima Gallery
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Explore stunning images from our space journalism and scientific articles
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search gallery..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'masonry' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('masonry')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tag Filters */}
              {tags && tags.tags && tags.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant={selectedTag === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTag('')}
                      className={selectedTag === '' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
                    >
                      All
                    </Button>
                    {tags.tags.map((tag) => (
                      <Button
                        key={tag.id}
                        variant={selectedTag === tag.name ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTag(tag.name)}
                        className={selectedTag === tag.name ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
                      >
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tiny Top Ad - Minimal Size */}
          <div className="py-4">
            <div className="max-w-xs mx-auto">
              <InContentAd />
            </div>
          </div>

          {/* Gallery Content */}
          <div className="container mx-auto px-4 py-8">
            {isPageLocked ? (
              <PremiumAccess
                title="Premium Gallery Access"
                description="Unlock access to our exclusive gallery content with premium membership"
              >
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-4">Premium Gallery Content</h2>
                  <p className="text-gray-400 mb-8">
                    This page contains additional gallery content
                  </p>
                </div>
              </PremiumAccess>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">No Images Found</h2>
                <p className="text-gray-400">
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : 'No articles with images are available at this time'}
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6">
                  {searchQuery && (
                    <p className="text-gray-400">
                      Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </p>
                  )}
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredItems.slice(0, 6).map((item) => {
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
                            <div className="aspect-video bg-gray-800 rounded-t-lg overflow-hidden">
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
                            </div>

                            {item.primary_tag && (
                              <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                                <Tag className="h-3 w-3" />
                                {item.primary_tag.name}
                              </div>
                            )}

                            {allImages.length > 1 && (
                              <div className="flex gap-1">
                                {allImages.slice(0, 5).map((image, index) => (
                                  <div
                                    key={index}
                                    className="w-8 h-8 bg-gray-800 rounded border border-gray-700"
                                    style={{
                                      backgroundImage: `url(${image})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center'
                                    }}
                                  />
                                ))}
                                {allImages.length > 5 && (
                                  <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-xs">
                                    +{allImages.length - 5}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* In-Feed Ad after first 6 items - Tiny */}
                {filteredItems.length > 6 && (
                  <div className="py-4">
                    <div className="max-w-xs mx-auto">
                      <InContentAd />
                    </div>
                  </div>
                )}

                {/* Remaining Gallery Items */}
                {filteredItems.length > 6 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredItems.slice(6).map((item) => {
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
                              <div className="aspect-video bg-gray-800 rounded-t-lg overflow-hidden">
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
                              </div>

                              {item.primary_tag && (
                                <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                                  <Tag className="h-3 w-3" />
                                  {item.primary_tag.name}
                                </div>
                              )}

                              {allImages.length > 1 && (
                                <div className="flex gap-1">
                                  {allImages.slice(0, 5).map((image, index) => (
                                    <div
                                      key={index}
                                      className="w-8 h-8 bg-gray-800 rounded border border-gray-700"
                                      style={{
                                        backgroundImage: `url(${image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                      }}
                                    />
                                  ))}
                                  {allImages.length > 5 && (
                                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-xs">
                                      +{allImages.length - 5}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Ad - Tiny */}
                <div className="py-4">
                  <div className="max-w-xs mx-auto">
                    <InContentAd />
                  </div>
                </div>

                {/* Pagination */}
                {galleryData?.meta?.pagination && galleryData.meta.pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, galleryData.meta.pagination.pages) }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === currentPage;
                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={isActive 
                              ? "bg-purple-600 hover:bg-purple-700 text-white" 
                              : "border-gray-600 text-gray-300 hover:bg-gray-800"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(galleryData.meta.pagination.pages, prev + 1))}
                      disabled={currentPage === galleryData.meta.pagination.pages}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Image Modal */}
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
              {selectedImage && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center justify-between">
                      <span>{selectedImage.item.title}</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="mt-4">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.alt || selectedImage.item.title}
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
      </div>
    </>
  );
};

export default Gallery;