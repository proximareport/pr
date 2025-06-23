import axios from 'axios';

// API configuration for different environments
const getApiBaseUrl = () => {
  // In development, use the local server
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // In production, use the deployed backend URL
  // You'll need to set this environment variable in Netlify
  return import.meta.env.VITE_API_BASE_URL || 'https://your-backend-domain.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors like 401, 403, etc.
    if (error.response?.status === 401) {
      // Redirect to login or clear auth state
      console.log('Unauthorized - redirecting to login');
    }
    return Promise.reject(error);
  }
);

// Export common API functions
export const api = {
  // Articles
  getArticles: (params?: any) => apiClient.get('/api/articles', { params }),
  getArticle: (id: number) => apiClient.get(`/api/articles/${id}`),
  getArticleBySlug: (slug: string) => apiClient.get(`/api/articles/slug/${slug}`),
  
  // Auth
  login: (credentials: { username?: string; email?: string; password: string }) => 
    apiClient.post('/api/login', credentials),
  register: (userData: any) => apiClient.post('/api/register', userData),
  logout: () => apiClient.post('/api/logout'),
  getMe: () => apiClient.get('/api/me'),
  
  // Themes
  getThemes: () => apiClient.get('/api/themes'),
  getCurrentTheme: () => apiClient.get('/api/themes/current'),
  setTheme: (themeName: string) => apiClient.post('/api/themes/set', { themeName }),
  resetTheme: () => apiClient.post('/api/themes/reset'),
  
  // Site settings
  getSiteSettings: () => apiClient.get('/api/site-settings'),
  getEmergencyBanner: () => apiClient.get('/api/emergency-banner'),
  
  // Ghost posts
  getGhostPosts: (params?: any) => apiClient.get('/api/ghost/posts', { params }),
  getGhostPostBySlug: (slug: string) => apiClient.get(`/api/ghost/posts/slug/${slug}`),
  
  // Search
  search: (query: string, type?: string) => 
    apiClient.get('/api/search', { params: { q: query, type } }),
  getSearchSuggestions: (query: string) => 
    apiClient.get('/api/search/suggestions', { params: { q: query } }),
  
  // Advertisements
  getAdvertisements: (placement: string) => 
    apiClient.get(`/api/advertisements/${placement}`),
};

export default api; 