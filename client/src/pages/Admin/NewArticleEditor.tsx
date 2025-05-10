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
import { SaveIcon, UploadIcon, PlusIcon, XIcon } from 'lucide-react';
import ArticleEditor from '@/components/article/GoogleDocsEditor';
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
  const [content, setContent] = useState<any[]>([]);
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
  // This is the primary save mutation
  const { mutate: autosave, isPending: isSaving } = useMutation({
    mutationFn: async (articleData: any) => {
      if (isEditing) {
        return apiRequest('PATCH', `/api/articles/${id}`, articleData).then(r => r.json());
      } else {
        return apiRequest('POST', '/api/articles', articleData).then(r => r.json());
      }
    },
    onSuccess: (data) => {
      // Silent success - just update article ID if needed
      if (!isEditing && data.id) {
        setLastSaved(new Date());
        window.history.replaceState(null, '', `/admin/articles/${data.id}/edit`);
      } else {
        setLastSaved(new Date());
      }
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
      setContent(initialArticle.content || []);
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
    
    // Reset selection
    setSelectedCoauthorId(null);
  };
  
  const handleRemoveCoauthor = (id: number) => {
    setCoauthors(coauthors.filter(author => author.id !== id));
  };
  
  const handleCoauthorRoleChange = (id: number, role: string) => {
    setCoauthors(coauthors.map(author => 
      author.id === id ? { ...author, role } : author
    ));
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
  function doAutosave() {
    if (!title.trim()) return;
    
    const articleData = prepareArticleData(false); // Always save as draft
    
    // Perform the autosave
    autosaveArticleMutation(articleData);
  }
  
  function scheduleAutosave() {
    // Clear any existing timeout
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }
    
    // Don't autosave if title is empty
    if (!title.trim()) {
      return;
    }
    
    // Set a new timeout for autosave (5 seconds after last change)
    autosaveTimeoutRef.current = window.setTimeout(() => {
      doAutosave();
    }, 5000);
  }

  // Autosave mutation - doesn't show toasts, doesn't redirect
  const { mutate: autosaveArticleMutation, isPending: isAutosaving } = useMutation({
    mutationFn: async (articleData: any) => {
      if (isEditing) {
        return apiRequest('PATCH', `/api/articles/${id}`, articleData).then(r => r.json());
      } else {
        return apiRequest('POST', '/api/articles', articleData).then(r => r.json());
      }
    },
    onSuccess: (data) => {
      // Silent success - just update article ID if needed
      if (!isEditing && data.id) {
        setLastSaved(new Date());
        window.history.replaceState(null, '', `/admin/articles/${data.id}/edit`);
        setArticleId(data.id);
      } else {
        setLastSaved(new Date());
      }
      setAutosaveError(null);
    },
    onError: (error: any) => {
      console.error('Autosave error:', error);
      setAutosaveError(error.message || 'Failed to autosave');
    }
  });
  
  // Format the last saved time
  const formatLastSavedTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Effect to autosave when content changes
  useEffect(() => {
    scheduleAutosave();
    
    // Cleanup on unmount
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, summary, content, category, tags, featuredImage, readTime, isBreaking, isFeatured, isCollaborative, coauthors]);
  
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
  }, [title]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const articleData = prepareArticleData(!isDraft);
    mutate(articleData);
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
          onChange={(e) => setSummary(e.target.value)}
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
          <ArticleEditor 
            initialContent={content}
            onSave={(newContent) => {
              setContent(newContent);
              scheduleAutosave();
            }}
          />
        </div>
      </EditorMainCard>
    </form>
  );
  
  // Create sidebar content
  const sidebarContent = (
    <>
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
              onCheckedChange={setIsDraft}
            />
          </div>
          
          <CheckboxFormField
            id="isBreaking"
            label="Breaking News"
            checked={isBreaking}
            onChange={setIsBreaking}
            description="Mark this article as breaking news"
            highlightBox
          />
          
          <CheckboxFormField
            id="isFeatured"
            label="Featured Article"
            checked={isFeatured}
            onChange={setIsFeatured}
            description="Show on homepage hero section"
          />
          
          <SelectFormField
            id="category"
            label="Category"
            value={category}
            onChange={setCategory}
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
            onChange={(e) => setReadTime(parseInt(e.target.value) || 1)}
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
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Collaborative Mode</h4>
              <p className="text-xs text-white/60">
                {isCollaborative 
                  ? 'Multiple authors can collaborate on this article' 
                  : 'Standard single-author article'}
              </p>
            </div>
            <Switch 
              checked={isCollaborative} 
              onCheckedChange={setIsCollaborative}
            />
          </div>
          
          {isCollaborative && (
            <div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Add Co-authors</label>
                <div className="flex items-center gap-2">
                  <select 
                    className="flex-1 bg-[#0A0A15] border border-white/10 rounded-md p-2 text-sm"
                    onChange={(e) => setSelectedCoauthorId(parseInt(e.target.value))}
                    value={selectedCoauthorId || ''}
                  >
                    <option value="">Select a user</option>
                    {allUsers
                      .filter((u: {id: number, username: string}) => u.id !== user?.id) // Filter out current user
                      .filter((u: {id: number, username: string}) => !coauthors.some(author => author.id === u.id)) // Filter out already added
                      .map((u: {id: number, username: string}) => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))
                    }
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddCoauthor}
                    disabled={!selectedCoauthorId}
                    className="px-3"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Co-authors list */}
              <div>
                <h4 className="text-sm font-medium mb-2">Current Co-authors</h4>
                {coauthors.length === 0 ? (
                  <p className="text-xs text-white/60 italic">No co-authors yet. Add someone above.</p>
                ) : (
                  <ul className="space-y-2">
                    {coauthors.map(author => (
                      <li key={author.id} className="flex items-center justify-between bg-[#0A0A15] rounded-md p-2 text-sm border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-900 flex items-center justify-center text-xs">
                            {author.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{author.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={author.role}
                            onChange={(e) => handleCoauthorRoleChange(author.id, e.target.value)}
                            className="bg-transparent border border-white/10 rounded-md text-xs p-1"
                          >
                            <option value="coauthor">Co-author</option>
                            <option value="editor">Editor</option>
                            <option value="contributor">Contributor</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCoauthor(author.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Remove co-author"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </EditorSideCard>
      
      <EditorSideCard
        title="Featured Image"
        description="Upload a high-quality image"
      >
        <div className="space-y-4">
          {featuredImage ? (
            <div className="relative rounded-md overflow-hidden">
              <img 
                src={featuredImage} 
                alt="Featured" 
                className="w-full aspect-video object-cover" 
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => setFeaturedImage('')}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/20 rounded-md p-8 text-center">
              <div className="flex flex-col items-center">
                <UploadIcon className="h-10 w-10 text-white/40 mb-3" />
                <p className="text-white/60 mb-4">Upload a featured image</p>
                <label className="cursor-pointer">
                  <Button disabled={imageUploading}>
                    {imageUploading ? 'Uploading...' : 'Browse Files'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                    />
                  </Button>
                </label>
              </div>
            </div>
          )}
        </div>
      </EditorSideCard>
      
      <EditorSideCard
        title="Tags"
        description="Add relevant topic tags"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} className="group transition flex items-center gap-1 py-1 px-2">
                {tag}
                <XIcon 
                  className="h-3 w-3 cursor-pointer opacity-70 group-hover:opacity-100" 
                  onClick={() => removeTag(tag)} 
                />
              </Badge>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-white/60">No tags added yet</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Enter a tag name"
              className="flex-1 border-white/10 bg-[#1A1A27]"
            />
            <Button 
              size="sm"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput}
              type="button"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {availableTags && availableTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.slice(0, 10).map((tag: any) => (
                  <Badge 
                    key={tag.name}
                    variant="outline" 
                    className="cursor-pointer hover:bg-white/10"
                    onClick={() => addTag(tag.name)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </EditorSideCard>
    </>
  );

  return (
    <EditorLayout
      title={isEditing ? 'Edit Article' : 'New Article'}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}

export default AdminArticleEditor;