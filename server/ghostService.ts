import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GHOST_URL = process.env.GHOST_URL as string;
const GHOST_CONTENT_API_KEY = process.env.GHOST_CONTENT_API_KEY as string;

if (!GHOST_URL || !GHOST_CONTENT_API_KEY) {
  throw new Error('Missing required Ghost API configuration');
}

// Test the Ghost API connection
async function testGhostConnection() {
  try {
    const testUrl = `${GHOST_URL}/ghost/api/v3/content/posts/?key=${GHOST_CONTENT_API_KEY}&limit=1`;
    console.log('Testing Ghost API connection:', testUrl);
    
    const response = await axios.get(testUrl);
    console.log('Ghost API test response:', {
      status: response.status,
      hasPosts: !!response.data?.posts,
      postCount: response.data?.posts?.length,
      firstPost: response.data?.posts?.[0]?.title
    });
    
    return response.data;
  } catch (error) {
    console.error('Ghost API test failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    throw error;
  }
}

// Define types for Ghost API response
export interface GhostAuthor {
  id: string;
  name: string;
  slug: string;
  profile_image: string;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
}

export interface GhostPost {
  id: string;
  title: string;
  slug: string;
  html: string;
  feature_image: string;
  published_at: string;
  excerpt: string;
  reading_time: number;
  primary_author: GhostAuthor;
  primary_tag: GhostTag;
  tags: GhostTag[];
  authors: GhostAuthor[];
}

export interface GhostResponse {
  posts: GhostPost[];
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

// Helper function to format Ghost post data
function formatGhostPost(post: any): GhostPost | null {
  if (!post) return null;
  
  // Debug: Log the raw post data to see what fields we're actually getting
  console.log('Raw Ghost post data:', {
    id: post.id,
    title: post.title,
    hasReadingTime: !!post.reading_time,
    readingTimeValue: post.reading_time,
    readingTimeType: typeof post.reading_time,
    hasAuthors: !!post.authors,
    authorsLength: post.authors?.length || 0,
    hasPrimaryAuthor: !!post.primary_author,
    authorsData: post.authors?.map((a: any) => ({ id: a.id, name: a.name })) || [],
    primaryAuthorData: post.primary_author ? { id: post.primary_author.id, name: post.primary_author.name } : null,
    allFields: Object.keys(post),
    rawPost: JSON.stringify(post, null, 2).substring(0, 500) + '...'
  });
  
  const formattedPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    html: post.html,
    feature_image: post.feature_image,
    published_at: post.published_at,
    excerpt: post.excerpt,
    reading_time: post.reading_time || 5,
    primary_author: post.primary_author as GhostAuthor,
    primary_tag: post.primary_tag as GhostTag,
    tags: (post.tags || []) as GhostTag[],
    authors: (post.authors || []) as GhostAuthor[]
  };
  
  console.log('Formatted post data:', {
    id: formattedPost.id,
    title: formattedPost.title,
    readingTime: formattedPost.reading_time,
    authorsCount: formattedPost.authors.length,
    hasPrimaryAuthor: !!formattedPost.primary_author,
    authorsNames: formattedPost.authors.map(a => a.name)
  });
  
  return formattedPost;
}

// Get posts with pagination
export async function getPosts(page = 1, limit = 10, filter?: string) {
  try {
    const params = new URLSearchParams();
    params.append('key', GHOST_CONTENT_API_KEY);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('include', 'tags,authors');
    params.append('fields', 'id,title,slug,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag');

    if (filter) {
      params.append('filter', filter);
    }

    console.log('Making Ghost API request:', {
      url: `${GHOST_URL}/ghost/api/v3/content/posts/`,
      params: params.toString()
    });

    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/posts/`, {
      params,
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });

    console.log('Ghost API response:', {
      status: response.status,
      postCount: response.data?.posts?.length || 0
    });

    // Ensure posts is always an array
    const posts = Array.isArray(response.data?.posts) ? response.data.posts : [];
    
    return {
      posts,
      meta: {
        pagination: {
          page: response.data?.meta?.pagination?.page || page,
          limit: response.data?.meta?.pagination?.limit || limit,
          pages: response.data?.meta?.pagination?.pages || 1,
          total: response.data?.meta?.pagination?.total || 0,
          next: response.data?.meta?.pagination?.next || null,
          prev: response.data?.meta?.pagination?.prev || null
        }
      }
    };
  } catch (error) {
    console.error('Error fetching posts from Ghost:', error);
    throw error;
  }
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<GhostPost | null> {
  try {
    console.log('Fetching post by slug:', slug);
    console.log('Ghost API Config:', {
      url: GHOST_URL,
      hasKey: !!GHOST_CONTENT_API_KEY,
      keyLength: GHOST_CONTENT_API_KEY?.length
    });
    
    const params = new URLSearchParams();
    params.append('key', GHOST_CONTENT_API_KEY);
    params.append('include', 'tags,authors');
    params.append('fields', 'id,title,slug,html,excerpt,custom_excerpt,feature_image,published_at,reading_time,primary_tag');
    
    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/posts/slug/${slug}/`, {
      params,
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });

    console.log('Ghost API response:', {
      status: response.status,
      hasPost: !!response.data?.posts?.[0],
      postTitle: response.data?.posts?.[0]?.title
    });

    if (!response.data?.posts?.[0]) {
      console.log('Post not found:', slug);
      return null;
    }

    const post = response.data.posts[0];
    console.log('Received post:', {
      title: post.title,
      hasAuthor: !!post.primary_author,
      hasImage: !!post.feature_image,
      tags: post.tags?.length || 0
    });

    return formatGhostPost(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Get all tags
export async function getTags() {
  try {
    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/tags/`, {
      params: {
        key: GHOST_CONTENT_API_KEY,
        limit: 'all',
        include: 'count.posts'
      },
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });
    return response.data.tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

// Get all authors
export async function getAuthors() {
  try {
    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/authors/`, {
      params: {
        key: GHOST_CONTENT_API_KEY,
        limit: 'all',
        include: 'count.posts'
      },
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });
    return response.data.authors;
  } catch (error) {
    console.error('Error fetching authors:', error);
    throw error;
  }
}

// Gallery-specific interfaces
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
  primary_tag: GhostTag | null;
  primary_author: GhostAuthor | null;
  feature_image: string;
  content_images: GalleryImage[];
  total_images: number;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export async function getFeaturedImages() {
  return getCachedData('featured-images', async () => {
    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/posts/`, {
      params: {
        key: GHOST_CONTENT_API_KEY,
        limit: 5,
        filter: 'featured:true',
        fields: ['feature_image']
      },
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });
    return response.data.posts.map((post: any) => post.feature_image).filter(Boolean);
  });
}

// Enhanced function to get gallery images with metadata
export async function getGalleryImages(page = 1, limit = 20, tag?: string) {
  const cacheKey = `gallery-images-${page}-${limit}-${tag || 'all'}`;
  
  return getCachedData(cacheKey, async () => {
    const params = new URLSearchParams();
    params.append('key', GHOST_CONTENT_API_KEY);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('include', 'tags,authors');
    params.append('fields', 'id,title,slug,excerpt,feature_image,published_at,reading_time,primary_tag,html');
    
    // Filter posts that have featured images
    let filter = 'feature_image:-null';
    
    if (tag) {
      filter += `+tag:${tag}`;
    }
    
    params.append('filter', filter);

    console.log('Fetching gallery images:', {
      url: `${GHOST_URL}/ghost/api/v3/content/posts/`,
      params: params.toString()
    });

    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/posts/`, {
      params,
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });

    console.log('Gallery API response:', {
      status: response.status,
      postCount: response.data?.posts?.length || 0
    });

    // Extract images from posts with metadata
    const posts = response.data?.posts || [];
    const galleryItems = posts.map((post: any) => {
      // Extract additional images from HTML content
      const htmlImages = extractImagesFromHTML(post.html || '');
      
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        published_at: post.published_at,
        primary_tag: post.primary_tag,
        primary_author: post.primary_author,
        feature_image: post.feature_image,
        content_images: htmlImages,
        total_images: htmlImages.length + (post.feature_image ? 1 : 0)
      };
    }).filter((item: any) => item.feature_image || item.content_images.length > 0);

    return {
      items: galleryItems,
      meta: {
        pagination: {
          page: response.data?.meta?.pagination?.page || page,
          limit: response.data?.meta?.pagination?.limit || limit,
          pages: response.data?.meta?.pagination?.pages || 1,
          total: response.data?.meta?.pagination?.total || 0,
          next: response.data?.meta?.pagination?.next || null,
          prev: response.data?.meta?.pagination?.prev || null
        }
      }
    };
  });
}

// Function to extract images from HTML content
function extractImagesFromHTML(html: string): GalleryImage[] {
  if (!html) return [];
  
  const images: GalleryImage[] = [];
  
  // Replace newlines to handle multiline figure tags
  const cleanHtml = html.replace(/\r?\n|\r/g, ' ');
  
  // Regular expression to match img tags
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi;
  const figureRegex = /<figure[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>.*?(?:<figcaption[^>]*>(.*?)<\/figcaption>)?.*?<\/figure>/gi;
  
  let match;
  
  // Extract images from figure tags (with captions)
  while ((match = figureRegex.exec(cleanHtml)) !== null) {
    const url = match[1];
    const alt = match[2] || '';
    const caption = match[3] ? match[3].replace(/<[^>]*>/g, '').trim() : '';
    
    if (url && !images.some(img => img.url === url)) {
      images.push({ url, alt, caption });
    }
  }
  
  // Extract standalone img tags
  while ((match = imgRegex.exec(cleanHtml)) !== null) {
    const url = match[1];
    const alt = match[2] || '';
    
    if (url && !images.some(img => img.url === url)) {
      images.push({ url, alt });
    }
  }
  
  return images;
}

// Get all available tags for filtering
export async function getAvailableTags() {
  return getCachedData('available-tags', async () => {
    const params = new URLSearchParams();
    params.append('key', GHOST_CONTENT_API_KEY);
    params.append('limit', '50');
    params.append('include', 'count.posts');
    params.append('order', 'count.posts DESC');

    const response = await axios.get(`${GHOST_URL}/ghost/api/v3/content/tags/`, {
      params,
      headers: {
        'Accept-Version': 'v3.0',
        'Content-Type': 'application/json'
      }
    });

    return response.data?.tags || [];
  });
} 