import React, { useEffect, useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { InsertArticle } from '@/../../shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save as SaveIcon, Upload as UploadIcon, Plus as PlusIcon, X as XIcon, Image as ImageIcon } from 'lucide-react';

// Constant for autosave delay in milliseconds (2 seconds)
const AUTOSAVE_DELAY = 2000;
import RichTextEditor from '@/components/article/RichTextEditor';
import MediaSelector from '@/components/MediaSelector';
import { EditorLayout, EditorMainCard, EditorSideCard } from '@/components/admin/EditorLayout';
import { 
  TextFormField, 
  TextareaFormField, 
  SelectFormField,
  CheckboxFormField,
  SlugFormField,
  FormField
} from '@/components/admin/EnhancedFormFields';

interface ArticleParams {
  id?: string;
}

function AdminArticleEditor() {
  const { id } = useParams<ArticleParams>();
  const isEditing = !!id;
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState('space-exploration');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [isDraft, setIsDraft] = useState(true);
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [coauthors, setCoauthors] = useState<Array<{id: number, username: string, role: string}>>([]);
  const [selectedCoauthorId, setSelectedCoauthorId] = useState<number | null>(null);
  const [articleId, setArticleId] = useState<number | undefined>(id ? parseInt(id) : undefined);
  
  // Autosave related state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false); // Track if autosave is in progress
  const autosaveTimeoutRef = useRef<number | null>(null);
  const lastSavedContentRef = useRef<string>(''); // Track the last saved content to avoid unnecessary saves
  const contentModifiedSinceLastSave = useRef<boolean>(false); // Track if content has been modified since last save
  const [availableUsers, setAvailableUsers] = useState<Array<{id: number, username: string, profilePicture?: string}>>([]);
  
  // Fetch available users for coauthor selection
  const { data: fetchedUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: isCollaborative
  });
  
  // Update available users when data is fetched
  useEffect(() => {
    if (fetchedUsers) {
      setAvailableUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
    }
  }, [fetchedUsers]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-generate slug if empty
    if (!isEditing || (!initialArticle && slug === '')) {
      // Create base slug from title
      const baseSlug = newTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Add timestamp to ensure uniqueness
      const timestamp = new Date().getTime().toString().slice(-5);
      const uniqueSlug = baseSlug ? `${baseSlug}-${timestamp}` : '';
      
      setSlug(uniqueSlug);
    }
    
    // Schedule autosave after title change
    scheduleAutosave();
  };
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let slugValue = e.target.value
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Preserve uniqueness by adding timestamp if needed
    if (!slugValue.match(/-\d{5}$/)) {
      const timestamp = new Date().getTime().toString().slice(-5);
      slugValue = slugValue ? `${slugValue}-${timestamp}` : '';
    }
    
    setSlug(slugValue);
    
    // Schedule autosave after slug change
    scheduleAutosave();
  };

  // Get editor state key
  const getEditorStateKey = useCallback(() => {
    return id ? `article-editor-state-${id}` : 'article-editor-state-new';
  }, [id]);
  
  // Clear editor state from localStorage
  const clearEditorState = useCallback(() => {
    localStorage.removeItem(getEditorStateKey());
    console.log('Cleared editor state from localStorage');
  }, [getEditorStateKey]);
  
  // Save editor state to localStorage
  const saveEditorState = useCallback(() => {
    if (!title.trim()) return; // Don't save if title is empty
    
    const editorState = {
      title,
      slug,
      summary,
      content,
      category,
      tags,
      featuredImage,
      readTime,
      isDraft,
      isBreaking,
      isFeatured,
      isCollaborative,
      coauthors,
      lastSaved: new Date().toISOString(),
      articleId
    };
    
    localStorage.setItem(getEditorStateKey(), JSON.stringify(editorState));
    console.log('Saved editor state to localStorage');
  }, [
    title, slug, summary, content, category, tags, featuredImage, 
    readTime, isDraft, isBreaking, isFeatured, isCollaborative, 
    coauthors, getEditorStateKey, articleId
  ]);
  
  // Load editor state from localStorage
  const loadEditorState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(getEditorStateKey());
      if (!savedState) return false;
      
      const state = JSON.parse(savedState);
      
      // Check if we have article data (minimum required fields)
      if (!state.title || !state.content) return false;
      
      setTitle(state.title || '');
      setSlug(state.slug || '');
      setSummary(state.summary || '');
      setContent(state.content || '');
      setCategory(state.category || 'space-exploration');
      setTags(state.tags || []);
      setFeaturedImage(state.featuredImage || '');
      setReadTime(state.readTime || 5);
      setIsDraft(state.isDraft !== undefined ? state.isDraft : true);
      setIsBreaking(state.isBreaking || false);
      setIsFeatured(state.isFeatured || false);
      setIsCollaborative(state.isCollaborative || false);
      
      if (state.coauthors && Array.isArray(state.coauthors)) {
        setCoauthors(state.coauthors);
      }
      
      if (state.articleId && !articleId) {
        setArticleId(state.articleId);
      }
      
      console.log('Loaded editor state from localStorage');
      
      // Update last saved time
      setLastSaved(state.lastSaved ? new Date(state.lastSaved) : new Date());
      
      // Show toast notification about restored content
      if (state.lastSaved) {
        try {
          const savedDate = new Date(state.lastSaved);
          const timeAgo = formatDistanceToNow(savedDate, { addSuffix: true });
          
          toast({
            title: "Restored saved content",
            description: `Loaded content saved ${timeAgo}`,
            variant: "default"
          });
        } catch (e) {
          console.error('Error parsing saved date:', e);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error loading editor state from localStorage:', error);
      return false;
    }
  }, [getEditorStateKey, articleId]);

  // Fetch article data if editing
  const { data: initialArticle, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['/api/articles', id],
    queryFn: () => apiRequest('GET', `/api/articles/${id}`).then(r => r.json()),
    enabled: isEditing,
  });

  // Fetch available categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('GET', '/api/categories').then(r => r.json()),
  });

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['/api/tags'],
    queryFn: () => apiRequest('GET', '/api/tags').then(r => r.json()),
  });
  
  // Fetch all users (used for coauthor selection)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then(r => r.json()),
  });

  // Create/Update article mutation
  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: async (articleData: ArticleFormData) => {
      try {
        let response;
        if (isEditing) {
          response = await apiRequest('PATCH', `/api/articles/${id}`, articleData);
        } else {
          response = await apiRequest('POST', '/api/articles', articleData);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response from server');
        }
        
        // Check for HTTP error status
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || 
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        
        return response.json();
      } catch (error: any) {
        console.error('Article save request error:', error);
        
        // Extract meaningful error information to help with debugging
        const errorMessage = error.response?.statusText || 
                            error.message || 
                            'Unknown error saving article';
        
        throw new Error(`Failed to save article: ${errorMessage}`);
      }
    },
    onSuccess: (data) => {
      console.log("API success response:", data);
      
      // Ensure we have a valid response with article data
      if (!data || !data.id) {
        console.error("Invalid response data received:", data);
        toast({
          title: "Warning",
          description: "Received incomplete response from server",
          variant: "destructive"
        });
        return;
      }
      
      // Display a toast with a different message based on the action
      const action = data.status === 'published' 
        ? 'published'
        : data.status === 'draft' && !isDraft
        ? 'unpublished to draft'
        : isEditing 
        ? 'updated' 
        : 'created';
        
      toast({
        title: `Article ${action}`,
        description: `Successfully ${action} the article "${data.title}"`,
      });
      
      // Invalidate the articles query to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      
      // Update the isDraft state to match the returned data
      setIsDraft(data.status === 'draft');
      
      // Only navigate if this is a new article being created (not editing an existing one)
      if (!isEditing && data.id) {
        // Ensure we have a valid ID before navigating
        navigate(`/admin/articles/${data.id}/edit`);
      } else if (isEditing && !articleId && data.id) {
        // Edge case: we're editing but somehow don't have articleId in state
        // Update URL without navigation
        setArticleId(data.id);
        window.history.replaceState(null, '', `/admin/articles/${data.id}/edit`);
      }
      
      // If the article was published (not just saved as draft), clear the saved editor state
      // This ensures we don't restore from localStorage after a successful publish
      if (data.status === 'published') {
        clearEditorState();
      }
    },
    onError: (error: any) => {
      console.error('Article save error:', error);
      
      // Extract detailed error information
      const errorMessage = error.message || `Failed to ${isEditing ? 'update' : 'create'} article`;
      
      // Show a detailed error message to help the user understand what went wrong
      toast({
        title: 'Error Saving Article',
        description: errorMessage.includes('permission') 
          ? `You don't have permission to ${isEditing ? 'update' : 'create'} this article. Please check your access rights.`
          : errorMessage.includes('validation') 
            ? `Your article has validation errors: ${errorMessage}. Please check all required fields.`
            : `Failed to ${isEditing ? 'update' : 'create'} article: ${errorMessage}`,
        variant: 'destructive',
        duration: 7000 // Show longer for serious errors
      });
    },
  });
  
  // Autosave mutation - doesn't show toasts, doesn't redirect
  const { mutate: autosaveArticleMutation, isPending: isAutosavePending } = useMutation({
    mutationFn: async (articleData: ArticleFormData) => {
      try {
        let response;
        if (isEditing) {
          response = await apiRequest('PATCH', `/api/articles/${id}`, articleData);
        } else {
          response = await apiRequest('POST', '/api/articles', articleData);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response from server');
        }
        
        // Check for HTTP error status
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message || 
            `Server error: ${response.status} ${response.statusText}`
          );
        }
        
        return response.json();
      } catch (error: any) {
        console.error('Autosave request error:', error);
        
        // Extract meaningful error information to help with debugging
        const errorMessage = error.response?.statusText || 
                            error.message || 
                            'Unknown error saving draft';
        
        throw new Error(`Failed to save draft: ${errorMessage}`);
      }
    },
    onSuccess: (data) => {
      // If we're creating a new article and get an ID back, update the state
      if (!isEditing && data?.id) {
        setArticleId(data.id);
        window.history.replaceState(null, '', `/admin/articles/edit/${data.id}`);
      }
      
      // Set last saved time
      setLastSaved(new Date());
      
      // Clear any autosave error
      setAutosaveError(null);
      
      // Store the last saved content string for comparison to prevent unnecessary saves
      const savedArticleData = prepareArticleData(false);
      lastSavedContentRef.current = JSON.stringify(savedArticleData);
      console.log('Content saved, updated lastSavedContentRef');
      
      // Save to localStorage for persistence between refreshes
      saveEditorState();
      
      // Reset the modified flag since content was just saved successfully
      contentModifiedSinceLastSave.current = false;
      
      // Invalidate the articles query
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    },
    onError: (error: any) => {
      console.error('Autosave error:', error);
      
      // Store detailed error information for display in the UI
      const errorMessage = error.message || 'Failed to autosave';
      setAutosaveError(errorMessage);
      
      // Only show a toast for non-transient errors that might need user attention
      if (errorMessage.includes('network') || errorMessage.includes('timeout') || 
          errorMessage.includes('permission') || errorMessage.includes('schema')) {
        toast({
          title: 'Autosave Warning',
          description: `Unable to save your work: ${errorMessage}. Changes may be lost if you leave this page.`,
          variant: 'destructive',
          duration: 5000 // Show longer
        });
      }
    },
  });

  // Initialize form with article data when editing or from localStorage
  useEffect(() => {
    // First check if we have saved state in localStorage
    const hasSavedState = loadEditorState();
    
    // If no saved state and we have initialArticle from API, use that
    if (!hasSavedState && initialArticle) {
      setTitle(initialArticle.title || '');
      setSlug(initialArticle.slug || '');
      setSummary(initialArticle.summary || '');
      setContent(typeof initialArticle.content === 'string' ? initialArticle.content : JSON.stringify(initialArticle.content));
      setCategory(initialArticle.category || 'space-exploration');
      setTags(initialArticle.tags || []);
      setFeaturedImage(initialArticle.featuredImage || '');
      setReadTime(initialArticle.readTime || 5);
      setIsDraft(initialArticle.status === 'draft');
      setIsBreaking(initialArticle.isBreaking || false);
      setIsFeatured(initialArticle.isFeatured || false);
      setIsCollaborative(initialArticle.isCollaborative || false);
      
      // Initialize the lastSavedContentRef with the initial article data
      // This prevents unnecessary autosaves when initially loading the article
      setTimeout(() => {
        const initialArticleData = {
          title: initialArticle.title || '',
          slug: initialArticle.slug || '',
          summary: initialArticle.summary || '',
          content: typeof initialArticle.content === 'string' ? initialArticle.content : JSON.stringify(initialArticle.content),
          category: initialArticle.category || 'space-exploration',
          tags: initialArticle.tags || [],
          featuredImage: initialArticle.featuredImage || '',
          readTime: initialArticle.readTime || 5,
          status: initialArticle.status || 'draft',
          isBreaking: initialArticle.isBreaking || false,
          isFeatured: initialArticle.isFeatured || false,
          isCollaborative: initialArticle.isCollaborative || false
        };
        lastSavedContentRef.current = JSON.stringify(initialArticleData);
        console.log('Initialized lastSavedContentRef with initial article data');
      }, 100); // Small delay to ensure state is updated
      
      // Handle authors
      if (initialArticle.authors && initialArticle.authors.length > 0) {
        // Filter out the current user (primary author) from coauthors list
        const coauthorsList = initialArticle.authors.filter((author: {id: number, username: string, role: string}) => 
          author.id !== user?.id
        );
        setCoauthors(coauthorsList);
      }
    }
  }, [initialArticle, user?.id]);

  // Coauthor management
  const handleAddCoauthor = () => {
    if (!selectedCoauthorId) return;
    
    // Check if already added
    if (coauthors.some(author => author.id === selectedCoauthorId)) {
      toast({
        title: "Already added",
        description: "This user is already a coauthor",
        variant: "destructive"
      });
      return;
    }
    
    // Find user info
    const selectedUser = allUsers.find((u: {id: number, username: string}) => u.id === selectedCoauthorId);
    if (!selectedUser) return;
    
    // Add to coauthors
    setCoauthors([...coauthors, {
      id: selectedUser.id,
      username: selectedUser.username,
      role: "coauthor" // Default role
    }]);
    
    // Schedule autosave
    scheduleAutosave();
    
    // Reset selection
    setSelectedCoauthorId(null);
  };
  
  const handleRemoveCoauthor = (id: number) => {
    setCoauthors(coauthors.filter(author => author.id !== id));
    scheduleAutosave();
  };
  
  const handleCoauthorRoleChange = (id: number, role: string) => {
    setCoauthors(coauthors.map(author => 
      author.id === id ? { ...author, role } : author
    ));
    scheduleAutosave();
  };

  // Define a type for the article data we prepare for saving
  type ArticleFormData = {
    title: string;
    slug: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    featuredImage: string;
    readTime: number;
    status: string;
    isBreaking: boolean;
    isFeatured: boolean;
    isCollaborative: boolean;
    authors: { id: number | undefined, role: string }[];
    primaryAuthorId?: number; // Added to match the InsertArticle schema requirements
  };

  // Function to prepare article data for saving
  const prepareArticleData = useCallback((statusOverride?: 'published' | 'draft' | boolean | null): ArticleFormData => {
    // All articles need at least the current user as author
    const authors = [
      { id: user?.id, role: "primary" },
      ...coauthors
    ];
    
    // Handle different types of statusOverride
    let effectiveStatus: 'published' | 'draft';
    
    if (statusOverride === true) {
      // True means publish
      effectiveStatus = 'published';
    } else if (statusOverride === false) {
      // False means draft
      effectiveStatus = 'draft';
    } else if (statusOverride === 'published' || statusOverride === 'draft') {
      // Explicit string status
      effectiveStatus = statusOverride;
    } else {
      // Use current state if no override
      effectiveStatus = isDraft ? 'draft' : 'published';
    }
    
    console.log("Preparing article data with status:", effectiveStatus, "isDraft:", isDraft, "statusOverride:", statusOverride);
    
    return {
      title,
      slug,
      summary,
      content,
      category,
      tags,
      featuredImage,
      readTime: Number(readTime),
      status: effectiveStatus,
      isBreaking,
      isFeatured,
      isCollaborative,
      authors,
      primaryAuthorId: user?.id // Add primary author ID for database requirements
    };
  }, [title, slug, summary, content, category, tags, featuredImage, readTime, isBreaking, isFeatured, isCollaborative, coauthors, user?.id, isDraft]);

  // Function to compare deeply two ArticleFormData objects with detailed change tracking
  const hasContentChanged = useCallback((current: ArticleFormData, previous: ArticleFormData | null): boolean => {
    if (!previous) {
      console.log('Content changed: No previous version available');
      return true;
    }
    
    // For logging changes
    const changes: string[] = [];
    
    // Helper function to track and log field changes
    const checkField = (fieldName: string, currentValue: any, previousValue: any): boolean => {
      if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
        // For debugging, don't log the full content which could be very large
        if (fieldName === 'content') {
          changes.push(`${fieldName}: [content modified]`);
        } else {
          // Trim long values for readable logs
          const formatValue = (val: any) => {
            const str = typeof val === 'string' ? val : JSON.stringify(val);
            return str.length > 50 ? str.substring(0, 47) + '...' : str;
          };
          changes.push(`${fieldName}: ${formatValue(previousValue)} → ${formatValue(currentValue)}`);
        }
        return true;
      }
      return false;
    };
    
    // Compare primitive fields
    let hasChanged = false;
    
    // Essential fields that always trigger an autosave
    if (checkField('title', current.title, previous.title)) hasChanged = true;
    if (checkField('slug', current.slug, previous.slug)) hasChanged = true;
    if (checkField('summary', current.summary, previous.summary)) hasChanged = true;
    if (checkField('content', current.content, previous.content)) hasChanged = true;
    
    // Secondary fields - also important but grouped for logging
    if (checkField('category', current.category, previous.category)) hasChanged = true;
    if (checkField('readTime', current.readTime, previous.readTime)) hasChanged = true;
    if (checkField('status', current.status, previous.status)) hasChanged = true;
    if (checkField('featuredImage', current.featuredImage, previous.featuredImage)) hasChanged = true;
    
    // Boolean properties - grouped for simpler logging
    const booleanChecks = [
      { name: 'isBreaking', current: current.isBreaking, previous: previous.isBreaking },
      { name: 'isFeatured', current: current.isFeatured, previous: previous.isFeatured },
      { name: 'isCollaborative', current: current.isCollaborative, previous: previous.isCollaborative }
    ];
    
    for (const check of booleanChecks) {
      if (checkField(check.name, check.current, check.previous)) hasChanged = true;
    }
    
    // Compare tags array - simpler to just check the whole array
    if (!arraysEqual(current.tags, previous.tags)) {
      changes.push(`tags: ${JSON.stringify(previous.tags)} → ${JSON.stringify(current.tags)}`);
      hasChanged = true;
    }
    
    // Compare authors array more thoroughly
    if (current.authors.length !== previous.authors.length) {
      changes.push(`authors length: ${previous.authors.length} → ${current.authors.length}`);
      hasChanged = true;
    } else {
      // Check individual authors
      for (let i = 0; i < current.authors.length; i++) {
        const currentAuthor = current.authors[i];
        const previousAuthor = previous.authors[i];
        
        if (currentAuthor.id !== previousAuthor.id || currentAuthor.role !== previousAuthor.role) {
          changes.push(`author[${i}]: ${JSON.stringify(previousAuthor)} → ${JSON.stringify(currentAuthor)}`);
          hasChanged = true;
        }
      }
    }
    
    // Log all changes for debugging
    if (hasChanged && changes.length > 0) {
      console.log(`Content changes detected (${changes.length}):`);
      changes.forEach(change => console.log(`- ${change}`));
    }
    
    return hasChanged;
  }, [/* No dependencies needed as this is a pure comparison function */]);
  
  // Helper function to compare arrays for equality
  const arraysEqual = (arr1: any[], arr2: any[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    
    // Handle primitive arrays
    if (typeof arr1[0] !== 'object') {
      return JSON.stringify(arr1) === JSON.stringify(arr2);
    }
    
    // For arrays of objects, we need to compare each element
    for (let i = 0; i < arr1.length; i++) {
      if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
        return false;
      }
    }
    
    return true;
  };

  // Function definitions for autosave with enhanced change detection and error prevention
  const doAutosave = useCallback(() => {
    // Skip autosave if no content has been modified since last save
    if (!contentModifiedSinceLastSave.current) {
      console.log('No content modified since last save, skipping autosave');
      return;
    }
    
    // Check minimum required content
    if (!title.trim()) {
      console.log('Title is empty, skipping autosave');
      return;
    }
    
    // Ensure slug exists, create one from title if needed
    const currentSlug = slug || title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
    if (!slug && currentSlug) {
      setSlug(currentSlug);
    }
    
    const currentArticleData = prepareArticleData(false); // Always save as draft
    
    // Basic validation before attempting to save
    const validationErrors = [];
    
    if (!currentArticleData.title?.trim()) {
      validationErrors.push('Title is required');
    }
    
    if (!currentArticleData.slug?.trim()) {
      validationErrors.push('Slug is required');
    }
    
    if (validationErrors.length > 0) {
      console.log('Skipping autosave due to validation errors:', validationErrors);
      setAutosaveError(`Validation errors: ${validationErrors.join(', ')}`);
      return;
    }
    
    // If no previous save reference exists, do the first save
    if (!lastSavedContentRef.current) {
      console.log('First save of article content...');
    } else {
      try {
        // Parse previous data for typed comparison
        const previousArticleData: ArticleFormData = JSON.parse(lastSavedContentRef.current);
        
        // Use our deep comparison function to check for changes
        if (!hasContentChanged(currentArticleData, previousArticleData)) {
          console.log('Content unchanged since last save, skipping autosave');
          // Update last save timestamp without actual saving to show recent check
          setLastSaved(new Date());
          return;
        }
        
        console.log('Changes detected, proceeding with autosave...');
      } catch (error) {
        console.error('Error comparing content for autosave:', error);
        // Continue with save since we couldn't properly compare
        console.log('Continuing with autosave due to error in comparison');
      }
    }
    
    // Basic validation for article size/limits
    if (currentArticleData.content && typeof currentArticleData.content === 'string' && 
        currentArticleData.content.length > 1000000) { // ~1MB content limit
      console.warn('Article content exceeds recommended size limit');
      // Continue with save but log warning
    }
    
    // Execute the autosave with detailed error handling
    setAutosaveError(null); // Clear any previous errors
    console.log(`Starting autosave: ${new Date().toLocaleTimeString()}`);
    
    // Execute the save mutation, providing the updated article data
    // isAutosavePending will be automatically set to true when mutation starts
    autosaveArticleMutation(currentArticleData);
    
    // Reset the modified flag after triggering a save
    contentModifiedSinceLastSave.current = false;
  }, [title, prepareArticleData, autosaveArticleMutation, lastSavedContentRef, hasContentChanged, slug]);
  
  const scheduleAutosave = useCallback(() => {
    // Clear any existing timeout
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      console.log('Cleared existing autosave timeout');
    }
    
    // Don't autosave if title is empty
    if (!title.trim()) {
      console.log('Title is empty, not scheduling autosave');
      return;
    }
    
    console.log(`Scheduling autosave in ${AUTOSAVE_DELAY}ms`);
    
    // Set a new timeout for autosave (configurable delay after user stops typing/editing)
    autosaveTimeoutRef.current = window.setTimeout(() => {
      console.log('Autosave timeout triggered, executing save...');
      doAutosave();
    }, AUTOSAVE_DELAY);
  }, [title, doAutosave]);
  
  // Format the last saved time
  const formatLastSavedTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Helper function to mark content as modified
  const markContentAsModified = useCallback(() => {
    contentModifiedSinceLastSave.current = true;
  }, []);

  // Effect to autosave when any article field changes
  useEffect(() => {
    // Mark content as modified when any of these fields change
    markContentAsModified();
    scheduleAutosave();
    
    // Cleanup on unmount
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, summary, content, category, tags, featuredImage, readTime, isBreaking, isFeatured, isCollaborative, coauthors, scheduleAutosave, markContentAsModified]);
  
  // Effect to handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (title) {
        // Save to localStorage before unloading
        saveEditorState();
        doAutosave();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also save state on component unmount
      if (title) {
        saveEditorState();
      }
    };
  }, [title, doAutosave, saveEditorState]);
  
  // Function to save the article without changing publish status
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Just save with current status (don't toggle status)
    // Pass null to indicate we don't want to change the status
    const articleData = prepareArticleData(null);
    mutate(articleData);
  };
  
  // Direct status change mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: 'published' | 'draft') => {
      if (!articleId) throw new Error("No article ID");
      
      // Use dedicated status endpoint instead of PATCH endpoint
      const response = await apiRequest(
        "POST", 
        `/api/articles/${articleId}/status`, 
        { status: newStatus }
      );
      
      // Process the response
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Invalidate article cache
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
      
      // Show success message
      toast({
        title: data?.article?.status === 'published' ? "Article Published" : "Article Saved as Draft",
        description: data?.message || "Status updated successfully",
      });
      
      // Update local state to match what came back from the server
      if (data?.article?.status) {
        setIsDraft(data.article.status === 'draft');
        console.log("Updated isDraft state to:", data.article.status === 'draft');
      }
    },
    onError: (error) => {
      console.error("Error updating article status:", error);
      toast({
        title: "Error",
        description: "Failed to update article status. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Dedicated function to explicitly publish or unpublish an article
  const handlePublishToggle = (shouldPublish: boolean) => {
    console.log("Publish toggle called with shouldPublish:", shouldPublish);
    
    // Create article data with explicit published/draft status
    const newStatus = shouldPublish ? 'published' : 'draft';
    console.log("Setting article status to:", newStatus);
    
    // If the article is already in the requested state, don't do anything
    if ((newStatus === 'published' && !isDraft) || (newStatus === 'draft' && isDraft)) {
      console.log("Article is already in the requested state, skipping update");
      return;
    }
    
    // First ensure article is saved before changing status    
    // Prepare article data using current state
    const articleData = prepareArticleData(null);
    mutate(articleData, {
      onSuccess: () => {
        console.log("Article saved, now changing status to:", newStatus);
        // After successful save, change status
        statusMutation.mutate(newStatus);
      },
      onError: (error) => {
        console.error("Failed to save article before status change:", error);
        toast({
          title: "Save Failed",
          description: "Could not save article changes before updating status.",
          variant: "destructive"
        });
      }
    });
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      scheduleAutosave();
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    scheduleAutosave();
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiRequest('POST', '/api/upload', formData);
      const data = await response.json();
      setFeaturedImage(data.imageUrl);
      scheduleAutosave();
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setImageUploading(false);
    }
  };
  
  // Handle media selection from the library for featured image
  const handleFeaturedImageSelect = (media: any) => {
    if (media.fileType === 'image') {
      setFeaturedImage(media.fileUrl);
      scheduleAutosave();
      
      toast({
        title: "Image selected",
        description: "Featured image selected from media library.",
      });
    } else {
      toast({
        title: "Invalid selection",
        description: "Please select an image file for the featured image.",
        variant: "destructive",
      });
    }
  };
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  // Create main content with article editor
  const mainContent = (
    <form onSubmit={handleSubmit}>
      <EditorMainCard
        title="Basic Information"
        description="Enter the core details of your article"
      >
        <TextFormField
          id="title"
          label="Article Title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter a descriptive title for your article"
          hint="A clear, concise title improves discoverability"
          required
          isLarge
        />
        
        <SlugFormField
          id="slug"
          label="Article URL Slug"
          value={slug}
          onChange={handleSlugChange}
          placeholder="article-url-slug"
          hint="Used in the URL: proxima.com/slug"
          required
        />
        
        <TextareaFormField
          id="summary"
          label="Summary"
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            scheduleAutosave();
          }}
          placeholder="Write a brief summary of the article content"
          hint="Will appear in article previews and social media shares"
          required
          rows={4}
        />
      </EditorMainCard>
      
      <EditorMainCard
        title="Article Content"
        description="Create your article using the rich editor below"
      >
        <div className="border border-white/10 rounded-md overflow-hidden bg-[#0A0A15]">
          <RichTextEditor 
            initialValue={typeof content === 'string' ? content : ''}
            onChange={(newContent: string) => {
              // Store content as a string
              setContent(newContent);
              scheduleAutosave();
            }}
          />
        </div>
      </EditorMainCard>
    </form>
  );

  // Create sidebar content with publishing options and tags
  const sidebarContent = (
    <div className="flex flex-col space-y-6">
      <EditorSideCard
        title="Publishing Options"
        description={
          <div className="flex flex-col space-y-1">
            <span>Configure how your article will be published</span>
            {isAutosavePending && (
              <span className="text-xs text-yellow-400 flex items-center">
                <span className="inline-block h-2 w-2 bg-yellow-400 rounded-full mr-1 animate-pulse"></span>
                Autosaving...
              </span>
            )}
            {lastSaved && !isAutosavePending && (
              <span className="text-xs text-green-400 flex items-center">
                <span className="inline-block h-2 w-2 bg-green-400 rounded-full mr-1"></span>
                Last saved {formatLastSavedTime(lastSaved)}
              </span>
            )}
            {autosaveError && (
              <span className="text-xs text-red-400 flex items-center">
                <span className="inline-block h-2 w-2 bg-red-400 rounded-full mr-1"></span>
                Error: {autosaveError}
              </span>
            )}
          </div>
        }
        footer={
          <div className="flex flex-col gap-3 w-full">
            {/* Save button */}
            <Button 
              type="submit" 
              onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
              className="w-full"
              disabled={isSubmitting}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            
            {/* Publish/Unpublish button */}
            {isDraft ? (
              <Button 
                type="button"
                onClick={() => handlePublishToggle(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Publish Article Now
                  </>
                )}
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={() => handlePublishToggle(false)}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isSubmitting || statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Unpublishing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Unpublish to Draft
                  </>
                )}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Draft Mode</h4>
              <p className="text-xs text-white/60">
                {isDraft ? 'Save as draft (not visible to public)' : 'Ready to publish'}
              </p>
            </div>
            <Switch 
              // Switch should be checked when it's in DRAFT mode
              checked={isDraft} 
              onCheckedChange={(newValue) => {
                console.log(`Switch toggled from ${isDraft} to ${newValue}`);
                // When switch is toggled ON (true), that means we want to set to DRAFT mode
                // When switch is toggled OFF (false), that means we want to PUBLISH (not draft)
                
                // newValue is the new isDraft state (true = draft, false = published)
                // handlePublishToggle expects (true = publish, false = draft)
                // So we need to pass the OPPOSITE of newValue
                
                // If the new switch value is true (draft), we pass false (unpublish)
                // If the new switch value is false (published), we pass true (publish)
                handlePublishToggle(!newValue);
              }}
            />
          </div>
          
          <CheckboxFormField
            id="isBreaking"
            label="Breaking News"
            checked={isBreaking}
            onChange={(value) => {
              setIsBreaking(value);
              scheduleAutosave();
            }}
            description="Mark this article as breaking news"
            highlightBox
          />
          
          <CheckboxFormField
            id="isFeatured"
            label="Featured Article"
            checked={isFeatured}
            onChange={(value) => {
              setIsFeatured(value);
              scheduleAutosave();
            }}
            description="Show on homepage hero section"
            highlightBox
          />
          
          <SelectFormField
            id="category"
            label="Category"
            value={category}
            onChange={(value) => {
              setCategory(value);
              scheduleAutosave();
            }}
            options={[
              { label: 'Space Exploration', value: 'space-exploration' },
              { label: 'Astronomy', value: 'astronomy' },
              { label: 'Space Technology', value: 'space-technology' },
              { label: 'Astrophysics', value: 'astrophysics' },
              { label: 'Space Agencies', value: 'space-agencies' },
            ]}
            hint="Primary topic for this article"
          />
          
          <TextFormField
            id="readTime"
            label="Read Time (minutes)"
            value={readTime.toString()}
            onChange={(e) => {
              setReadTime(parseInt(e.target.value) || 1);
              scheduleAutosave();
            }}
            placeholder="5"
            hint="Estimated time to read the article"
          />
        </div>
      </EditorSideCard>
      
      {/* Collaboration Options */}
      <EditorSideCard
        title="Collaboration Options"
        description="Manage article co-authors and collaboration settings"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Collaboration</h4>
              <p className="text-xs text-white/60">Allow multiple authors to work on this article</p>
            </div>
            <Switch 
              checked={isCollaborative} 
              onCheckedChange={(value) => {
                setIsCollaborative(value);
                scheduleAutosave();
              }}
            />
          </div>
          
          {isCollaborative && (
            <div>
              <h4 className="text-sm font-medium mb-2">Coauthors</h4>
              
              {/* Current coauthors */}
              <div className="space-y-2 mb-4">
                {coauthors.length > 0 ? (
                  coauthors.map((author) => (
                    <div key={author.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{author.username}</span>
                        <select 
                          value={author.role} 
                          onChange={(e) => handleCoauthorRoleChange(author.id, e.target.value)}
                          className="bg-transparent border border-white/10 rounded-md text-xs p-1"
                        >
                          <option value="coauthor">Co-author</option>
                          <option value="editor">Editor</option>
                          <option value="contributor">Contributor</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoauthor(author.id)}
                        className="text-white/60 hover:text-white"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/60">No coauthors added yet.</p>
                )}
              </div>
              
              {/* Add coauthor */}
              <div className="flex items-center space-x-2">
                <select
                  className="flex-grow bg-gray-800/50 rounded-md border border-white/10 p-2 text-sm"
                  value={selectedCoauthorId || ""}
                  onChange={(e) => setSelectedCoauthorId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select a user...</option>
                  {allUsers
                    .filter((u: any) => u.id !== user?.id && !coauthors.some(a => a.id === u.id))
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                </select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddCoauthor}
                  disabled={!selectedCoauthorId}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </EditorSideCard>
      
      {/* Tags */}
      <EditorSideCard
        title="Article Tags"
        description="Add tags to make your article more discoverable"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="flex items-center space-x-1">
                <span>{tag}</span>
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-white/90"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <p className="text-xs text-white/60">No tags added yet.</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag..."
              className="flex-grow"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Popular tags</h4>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter((tag: string) => !tags.includes(tag))
                  .slice(0, 6)
                  .map((tag: string, i: number) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-white/10"
                      onClick={() => {
                        addTag(tag);
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </EditorSideCard>
      
      {/* Featured Image */}
      <EditorSideCard
        title="Featured Image"
        description="Upload or select an image to display with your article"
      >
        <div className="space-y-4">
          {featuredImage ? (
            <div className="space-y-2">
              <div className="relative aspect-video rounded-md overflow-hidden bg-gray-800/50">
                <img 
                  src={featuredImage} 
                  alt="Featured" 
                  className="object-cover w-full h-full" 
                />
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFeaturedImage('');
                    scheduleAutosave();
                  }}
                >
                  Remove
                </Button>
                <div className="flex space-x-2">
                  <MediaSelector
                    onSelect={handleFeaturedImageSelect}
                    allowedTypes={["image"]}
                    triggerComponent={
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Media Library
                      </Button>
                    }
                  />
                  <label className="inline-flex cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      disabled={imageUploading}
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      {imageUploading ? 'Uploading...' : 'Upload New'}
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center items-center aspect-video rounded-md border border-dashed border-white/20 bg-gray-800/50">
                <div className="flex flex-col items-center space-y-4 p-4">
                  <UploadIcon className="h-8 w-8 text-white/60" />
                  <span className="text-sm font-medium">Add Featured Image</span>
                  <div className="flex space-x-2">
                    <MediaSelector
                      onSelect={handleFeaturedImageSelect}
                      allowedTypes={["image"]}
                      triggerComponent={
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Select from Media
                        </Button>
                      }
                    />
                    <label className="inline-flex cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={imageUploading}
                      >
                        <UploadIcon className="h-4 w-4 mr-1" />
                        Upload New
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
              {imageUploading && (
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </EditorSideCard>
    </div>
  );

  return (
    <EditorLayout
      title={isEditing ? "Edit Article" : "Create New Article"}
      subtitle={isEditing ? `Editing ${initialArticle?.title || 'article'}` : "Create a new article for your publication"}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={isLoadingArticle && isEditing}
    />
  );
}

export default AdminArticleEditor;