import React, { useEffect, useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SaveIcon, UploadIcon, PlusIcon, XIcon, ImageIcon } from 'lucide-react';
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
  const autosaveTimeoutRef = useRef<number | null>(null);
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
    mutationFn: async (articleData: any) => {
      if (isEditing) {
        return apiRequest('PATCH', `/api/articles/${id}`, articleData).then(r => r.json());
      } else {
        return apiRequest('POST', '/api/articles', articleData).then(r => r.json());
      }
    },
    onSuccess: (data) => {
      toast({
        title: isEditing ? 'Article updated' : 'Article created',
        description: `Successfully ${isEditing ? 'updated' : 'created'} the article "${data.title}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      navigate(`/admin/articles/${data.id}/edit`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} article: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Autosave mutation - doesn't show toasts, doesn't redirect
  const { mutate: autosaveArticleMutation, isPending: isAutosaving } = useMutation({
    mutationFn: async (articleData: any) => {
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
        
        return response.json();
      } catch (error: any) {
        console.error('Autosave request error:', error);
        throw new Error('Failed to save draft');
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
      
      // Invalidate the articles query
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    },
    onError: (error: any) => {
      console.error('Autosave error:', error);
      setAutosaveError(error.message || 'Failed to autosave');
    },
  });

  // Initialize form with article data when editing
  useEffect(() => {
    if (initialArticle) {
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

  // Function to prepare article data for saving
  const prepareArticleData = useCallback((forPublishing = false) => {
    // All articles need at least the current user as author
    const authors = [
      { id: user?.id, role: "primary" },
      ...coauthors
    ];
    
    return {
      title,
      slug,
      summary,
      content,
      category,
      tags,
      featuredImage,
      readTime: Number(readTime),
      status: forPublishing ? 'published' : 'draft',
      isBreaking,
      isFeatured,
      isCollaborative,
      authors
    };
  }, [title, slug, summary, content, category, tags, featuredImage, readTime, isBreaking, isFeatured, isCollaborative, coauthors, user?.id]);

  // Function definitions for autosave
  const doAutosave = useCallback(() => {
    if (!title.trim()) return;
    
    const articleData = prepareArticleData(false); // Always save as draft
    
    // Perform the autosave
    autosaveArticleMutation(articleData);
  }, [title, prepareArticleData, autosaveArticleMutation]);
  
  const scheduleAutosave = useCallback(() => {
    // Clear any existing timeout
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }
    
    // Don't autosave if title is empty
    if (!title.trim()) {
      return;
    }
    
    // Set a new timeout for autosave (2 seconds after user stops typing/editing)
    autosaveTimeoutRef.current = window.setTimeout(() => {
      doAutosave();
    }, 2000);
  }, [title, doAutosave]);
  
  // Format the last saved time
  const formatLastSavedTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Effect to autosave when any article field changes
  useEffect(() => {
    scheduleAutosave();
    
    // Cleanup on unmount
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, summary, content, category, tags, featuredImage, readTime, isBreaking, isFeatured, isCollaborative, coauthors, scheduleAutosave]);
  
  // Effect to handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (title) {
        doAutosave();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [title, doAutosave]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const articleData = prepareArticleData(!isDraft);
    mutate(articleData);
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
            {isAutosaving && (
              <span className="text-xs text-yellow-400 flex items-center">
                <span className="inline-block h-2 w-2 bg-yellow-400 rounded-full mr-1 animate-pulse"></span>
                Autosaving...
              </span>
            )}
            {lastSaved && !isAutosaving && (
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
          <Button 
            type="submit" 
            onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            className="w-full"
            disabled={isSubmitting}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Article' : 'Publish Article'}
          </Button>
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
              checked={isDraft} 
              onCheckedChange={(value) => {
                setIsDraft(value);
                scheduleAutosave();
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