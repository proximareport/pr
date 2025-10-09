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
  const filteredItems = galleryData?.items?.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleTagFilter = (tagSlug: string) => {
    setSelectedTag(tagSlug === selectedTag ? '' : tagSlug);
    setCurrentPage(1);
  };

  const handlePageClick = (page: number) => {
    const isPageLocked = page >= 3 && !isPaidSubscriber;
    if (isPageLocked) {
      // Show upgrade message for locked pages
      alert('This page requires a Supporter plan or higher. Please upgrade to access additional gallery pages.');
      return;
    }
    setCurrentPage(page);
  };

  const openImageModal = (imageUrl: string, alt: string, caption: string, item: GalleryItem) => {
    // Track image view for analytics
    analyticsTracker.trackGalleryItem(`${item.id}_${imageUrl}`);
    
    setSelectedImage({
      url: imageUrl,
      alt,
      caption,
      item
    });
  };

  const getAllImages = (item: GalleryItem) => {
    const images = [];
    if (item.feature_image) {
      images.push({
        url: item.feature_image,
        alt: `Featured image for ${item.title}`,
        caption: ''
      });
    }
    images.push(...item.content_images);
    return images;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Track gallery page view for analytics
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
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Proxima Gallery
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Explore stunning images from our space journalism and scientific articles
              </p>
            </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2 items-center">
              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'masonry' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('masonry')}
                  className="px-2"
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tag Filters */}
          {tags && tags.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTagFilter('')}
                  className="h-8"
                >
                  All Tags
                </Button>
                {tags.slice(0, 10).map((tag: GalleryTag) => (
                  <Button
                    key={tag.id}
                    variant={selectedTag === tag.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTagFilter(tag.slug)}
                    className="h-8"
                  >
                    {tag.name}
                    {tag.count && (
                      <Badge variant="secondary" className="ml-2 h-4 text-xs">
                        {tag.count.posts}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tiny Top Ad - Minimal Size */}
      <div className="container mx-auto px-4 py-0">
        <div className="max-w-xs mx-auto">
          <InContentAd />
        </div>
      </div>

      {/* Gallery Content */}
      <div className="container mx-auto px-4 py-8">
        {isPageLocked ? (
          <PremiumAccess
            requiredTier="tier1"
            featureName="Gallery Access"
            description="Access to additional gallery pages requires Supporter plan or higher"
          >
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gallery Page {currentPage}</h3>
              <p className="text-gray-400">
                This page contains additional gallery content
              </p>
            </div>
          </PremiumAccess>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Images Found</h3>
            <p className="text-gray-400">
              {searchQuery || selectedTag
                ? 'Try adjusting your search or filters'
                : 'No articles with images are available at this time'}
            </p>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-400">
                Showing {filteredItems.length} article{filteredItems.length !== 1 ? 's' : ''} with images
              </p>
              {galleryData?.meta && (
                <p className="text-gray-400">
                  Page {galleryData.meta.pagination.page} of {galleryData.meta.pagination.pages}
                </p>
              )}
            </div>

            {/* Gallery Grid */}
            <div className={`
              ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : ''}
              ${viewMode === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6' : ''}
              ${viewMode === 'list' ? 'space-y-6' : ''}
            `}>
              {filteredItems.slice(0, 6).map((item) => {
                const allImages = getAllImages(item);
                
                if (viewMode === 'list') {
                  return (
                    <Card key={item.id} className="bg-gray-900/50 border-gray-700 p-6">
                      <div className="flex gap-6">
                        {item.feature_image && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.feature_image}
                              alt={`Featured image for ${item.title}`}
                              className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageModal(
                                item.feature_image,
                                `Featured image for ${item.title}`,
                                '',
                                item
                              )}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.excerpt}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
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
                            <div className="flex flex-wrap gap-2">
                              {allImages.slice(1, 5).map((img, index) => (
                                <img
                                  key={index}
                                  src={img.url}
                                  alt={img.alt || ''}
                                  className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openImageModal(img.url, img.alt || '', img.caption || '', item)}
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
                }

                return (
                  <Card key={item.id} className={`bg-gray-900/50 border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all group ${viewMode === 'masonry' ? 'break-inside-avoid' : ''}`}>
                    {item.feature_image && (
                      <div className="relative">
                        <img
                          src={item.feature_image}
                          alt={`Featured image for ${item.title}`}
                          className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          onClick={() => openImageModal(
                            item.feature_image,
                            `Featured image for ${item.title}`,
                            '',
                            item
                          )}
                        />
                        {item.total_images > 1 && (
                          <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {item.total_images}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 text-white line-clamp-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.excerpt}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
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
                        <Badge variant="outline" className="text-xs">
                          {item.primary_tag.name}
                        </Badge>
                      )}

                      {/* Additional Images Grid */}
                      {item.content_images.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-1">
                          {item.content_images.slice(0, 3).map((img, index) => (
                            <img
                              key={index}
                              src={img.url}
                              alt={img.alt || ''}
                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageModal(img.url, img.alt || '', img.caption || '', item)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* In-Feed Ad after first 6 items - Tiny */}
            <div className="my-2">
              <div className="max-w-xs mx-auto">
                <InContentAd />
              </div>
            </div>

            {/* Remaining Gallery Items */}
            {filteredItems.length > 6 && (
              <div className={`
                ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : ''}
                ${viewMode === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6' : ''}
                ${viewMode === 'list' ? 'space-y-6' : ''}
              `}>
              {filteredItems.slice(6).map((item) => {
                const allImages = getAllImages(item);
                
                if (viewMode === 'list') {
                  return (
                    <Card key={item.id} className="bg-gray-900/50 border-gray-700 p-6">
                      <div className="flex gap-6">
                        {item.feature_image && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.feature_image}
                              alt={`Featured image for ${item.title}`}
                              className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageModal(
                                item.feature_image,
                                `Featured image for ${item.title}`,
                                '',
                                item
                              )}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.excerpt}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
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
                            <div className="flex flex-wrap gap-2">
                              {allImages.slice(1, 5).map((img, index) => (
                                <img
                                  key={index}
                                  src={img.url}
                                  alt={img.alt || ''}
                                  className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openImageModal(img.url, img.alt || '', img.caption || '', item)}
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
                }

                return (
                  <Card key={item.id} className={`bg-gray-900/50 border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all group ${viewMode === 'masonry' ? 'break-inside-avoid' : ''}`}>
                    {item.feature_image && (
                      <div className="relative">
                        <img
                          src={item.feature_image}
                          alt={`Featured image for ${item.title}`}
                          className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                          onClick={() => openImageModal(
                            item.feature_image,
                            `Featured image for ${item.title}`,
                                '',
                                item
                              )}
                            />
                            {item.total_images > 1 && (
                              <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {item.total_images}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="p-4">
                          <h3 className="text-lg font-semibold mb-2 text-white line-clamp-2">{item.title}</h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.excerpt}</p>
                          
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
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
                            <Badge variant="outline" className="text-xs">
                              {item.primary_tag.name}
                            </Badge>
                          )}

                          {/* Additional Images Grid */}
                          {item.content_images.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-1">
                              {item.content_images.slice(0, 3).map((img, index) => (
                                <img
                                  key={index}
                                  src={img.url}
                                  alt={img.alt || ''}
                                  className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openImageModal(img.url, img.alt || '', img.caption || '', item)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

            {/* In-Content Ad - Tiny */}
            <div className="my-2">
              <div className="max-w-xs mx-auto">
                <InContentAd />
              </div>
            </div>

            {/* Pagination */}
            {galleryData?.meta && galleryData.meta.pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!galleryData.meta.pagination.prev}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: galleryData.meta.pagination.pages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === galleryData.meta.pagination.pages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, arr) => {
                      const isPageLocked = page >= 3 && !isPaidSubscriber;
                      return (
                        <React.Fragment key={page}>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="text-gray-500">...</span>
                          )}
                          <Button
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageClick(page)}
                            className={`w-10 h-10 ${isPageLocked ? 'border-orange-500 text-orange-400 hover:bg-orange-500/20' : ''}`}
                            title={isPageLocked ? 'Click to see upgrade message' : ''}
                          >
                            {page}
                            {isPageLocked && <span className="text-xs ml-1">🔒</span>}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    const nextPage = currentPage + 1;
                    const isNextPageLocked = nextPage >= 3 && !isPaidSubscriber;
                    if (isNextPageLocked) {
                      alert('This page requires a Supporter plan or higher. Please upgrade to access additional gallery pages.');
                      return;
                    }
                    setCurrentPage(nextPage);
                  }}
                  disabled={!galleryData.meta.pagination.next}
                  className="flex items-center gap-2"
                >
                  Next
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(`https://proxima-report.ghost.io/${selectedImage.item.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Read Article
                  </Button>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || ''}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
                
                {selectedImage.caption && (
                  <p className="text-gray-400 text-sm text-center italic">
                    {selectedImage.caption}
                  </p>
                )}

                <div className="border-t border-gray-700 pt-4">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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