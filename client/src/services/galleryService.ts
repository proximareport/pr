import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types for gallery data
export interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  primary_tag: {
    id: string;
    name: string;
    slug: string;
  } | null;
  primary_author: {
    id: string;
    name: string;
    slug: string;
    profile_image: string;
  } | null;
  feature_image: string;
  content_images: GalleryImage[];
  total_images: number;
}

export interface GalleryResponse {
  items: GalleryItem[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      pages: number;
      total: number;
      next: number | null;
      prev: number | null;
    };
  };
}

export interface GalleryTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: { posts: number };
}

// API functions
export const galleryApi = {
  getGallery: async (page = 1, limit = 20, tag?: string): Promise<GalleryResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (tag) {
      params.append('tag', tag);
    }

    const res = await apiRequest('GET', `/api/gallery?${params.toString()}`);
    return res.json();
  },

  getTags: async (): Promise<GalleryTag[]> => {
    const res = await apiRequest('GET', '/api/gallery/tags');
    return res.json();
  },

  getFeaturedImages: async (): Promise<string[]> => {
    const res = await apiRequest('GET', '/api/gallery/featured');
    return res.json();
  }
};

// React Query hooks
export const useGallery = (page = 1, limit = 20, tag?: string) => {
  return useQuery({
    queryKey: ['gallery', page, limit, tag],
    queryFn: () => galleryApi.getGallery(page, limit, tag),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGalleryTags = () => {
  return useQuery({
    queryKey: ['gallery-tags'],
    queryFn: galleryApi.getTags,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFeaturedImages = () => {
  return useQuery({
    queryKey: ['featured-images'],
    queryFn: galleryApi.getFeaturedImages,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 