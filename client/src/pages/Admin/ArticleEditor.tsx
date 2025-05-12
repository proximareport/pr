import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { SaveIcon, ImageIcon, UploadIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import ArticleEditor from '@/components/article/GoogleDocsEditor';
import { EditorLayout, EditorMainCard, EditorSideCard } from '@/components/admin/EditorLayout';
import { 
  TextFormField, 
  TextareaFormField, 
  SelectFormField,
  CheckboxFormField,
  SlugFormField,
  DragHandle,
  FormField
} from '@/components/admin/EnhancedFormFields';

interface ArticleParams {
  id?: string;
}

function AdminArticleEditor() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<ArticleParams>();
  const { toast } = useToast();
  const isEditing = Boolean(params.id);
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isDraft, setIsDraft] = useState(true); // Add draft mode state
  const [readTime, setReadTime] = useState(5);
  const [featuredImage, setFeaturedImage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Fetch article data if editing
  const { data: article, isLoading } = useQuery({
    queryKey: ['/api/articles', params.id],
    queryFn: () => apiRequest('GET', `/api/articles/${params.id}`).then(res => res.json()),
    enabled: isEditing && Boolean(params.id),
  });
  
  // Load categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('GET', '/api/categories').then(res => res.json()),
  });
  
  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: (articleData: any) => 
      apiRequest('POST', '/api/articles', articleData).then(res => res.json()),
    onSuccess: (response) => {
      // Log response for debugging
      console.log("Article create response:", response);
      
      // Extract the new article ID from the response
      const newArticleId = response?.id || response?.article?.id;
      
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Article created successfully",
        description: `Article ${isDraft ? 'saved as draft' : 'published'} successfully.`,
      });
      
      // Redirect to edit page if we got an article ID, otherwise to admin dashboard
      if (newArticleId) {
        navigate(`/admin/articles/${newArticleId}/edit`);
      } else {
        navigate('/admin');
      }
    },
    onError: (error: any) => {
      console.error("Article creation error:", error);
      toast({
        title: "Failed to create article",
        description: error.message || "There was an error publishing your article.",
        variant: "destructive",
      });
    }
  });
  
  // Update article mutation
  const updateArticleMutation = useMutation({
    mutationFn: (articleData: any) => 
      apiRequest('PATCH', `/api/articles/${params.id}`, articleData).then(res => res.json()),
    onSuccess: (response) => {
      // First invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      if (params.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/articles', params.id] });
      }
      
      // Log response for debugging
      console.log("Article update response:", response);
      
      // Extract article ID from response if available
      const articleId = response?.article?.id || params.id;
      
      // Show success message
      toast({
        title: "Article updated successfully",
        description: `Article ${isDraft ? 'saved as draft' : 'published'} successfully.`,
      });
      
      // Stay on the same page - no navigation needed
      // This prevents the undefined redirects
    },
    onError: (error: any) => {
      console.error("Article update error:", error);
      toast({
        title: "Failed to update article",
        description: error.message || "There was an error updating your article.",
        variant: "destructive",
      });
    }
  });
  
  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  // Generate slug from title
  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  };
  
  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(generateSlug(newTitle));
  };
  
  // Handle status change for an existing article
  const handleStatusChange = async (newIsDraft: boolean) => {
    if (!isEditing || !params.id) {
      // Can't change status of an article that doesn't exist yet
      toast({
        title: "Save article first",
        description: "Please save the article before changing its publication status.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log(`Changing article status to ${newIsDraft ? "draft" : "published"}`);
      
      // Create a minimal update payload with just the status change
      const statusUpdateData = {
        status: newIsDraft ? "draft" : "published",
        publishedAt: !newIsDraft ? new Date().toISOString() : null
      };
      
      // Use the direct PATCH endpoint for status updates
      const response = await fetch(`/api/articles/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdateData)
      });
      
      if (!response.ok) {
        throw new Error(`Status update failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Status update response:", data);
      
      // Update local state
      setIsDraft(newIsDraft);
      
      // Show success message
      toast({
        title: newIsDraft ? "Article unpublished" : "Article published",
        description: newIsDraft 
          ? "Article is now a draft and not visible to the public" 
          : "Article is now published and visible to the public",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles', params.id] });
    } catch (error) {
      console.error("Error updating article status:", error);
      toast({
        title: "Status update failed",
        description: "There was an error updating the article status.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title || !slug || !summary) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before publishing.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate content
    if (!Array.isArray(content) || content.length === 0) {
      toast({
        title: "Missing content",
        description: "Your article must include some content.",
        variant: "destructive",
      });
      return;
    }
    
    // Upload image if selected
    let imageUrl = featuredImage;
    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      try {
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url || uploadResult.imageUrl;
      } catch (error) {
        console.error("Image upload error:", error);
        toast({
          title: "Image upload failed",
          description: "Failed to upload the featured image. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Create article data object
    const articleData = {
      title,
      slug,
      summary,
      content: content, // Direct content array for Google Docs-style editor
      category: category || "general",
      isBreaking,
      readTime: Number(readTime) || 5,
      featuredImage: imageUrl,
      status: isDraft ? "draft" : "published", // Use draft status if isDraft is true
      publishedAt: !isDraft ? new Date().toISOString() : null, // Only set publishedAt for published articles
      authorId: user?.id,
    };
    
    // Log for debugging
    console.log("Submitting article data:", articleData);
    
    // Submit the article
    if (isEditing) {
      updateArticleMutation.mutate(articleData);
    } else {
      createArticleMutation.mutate(articleData);
    }
  };
  
  // Load article data when available
  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSlug(article.slug || '');
      setSummary(article.summary || '');
      
      // Handle content properly based on its structure
      if (article.content) {
        if (typeof article.content === 'object' && article.content.blocks) {
          // Handle structured content with blocks
          setContent(article.content.blocks || []);
        } else if (Array.isArray(article.content)) {
          // Handle direct array of blocks
          setContent(article.content);
        } else {
          // Default to empty blocks array if content is in unexpected format
          console.warn("Article content format unexpected:", article.content);
          setContent([]);
        }
      } else {
        setContent([]);
      }
      
      setCategory(article.category || '');
      setIsBreaking(article.isBreaking || false);
      setIsDraft(article.status === 'draft');
      setReadTime(article.readTime || 5);
      setFeaturedImage(article.featuredImage || '');
      if (article.featuredImage) {
        setPreviewUrl(article.featuredImage);
      }
    }
  }, [article]);
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  // Main content for article editor
  const mainContent = (
    <form onSubmit={handleSubmit}>
      <EditorMainCard 
        title="Article Content"
        description="Create your article using the rich editor below"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-lg font-medium">Article Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={handleTitleChange}
              placeholder="Enter a compelling title for your article"
              required
              className="h-12 text-lg border-white/10 bg-[#1A1A27] focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">URL Slug</Label>
              <div className="relative">
                <Input 
                  id="slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="article-url-slug"
                  required
                  className="border-white/10 bg-[#1A1A27] pl-10 focus:border-primary/50"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40">
                  /
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="readTime" className="text-sm font-medium">Read Time (minutes)</Label>
              <Input 
                id="readTime" 
                type="number" 
                min="1"
                max="60"
                value={readTime} 
                onChange={(e) => setReadTime(Number(e.target.value))}
                required
                className="border-white/10 bg-[#1A1A27] focus:border-primary/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-lg font-medium">Summary</Label>
            <Textarea 
              id="summary" 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write a concise summary that will appear in article previews and search results"
              rows={3}
              required
              className="min-h-[100px] border-white/10 bg-[#1A1A27] focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="mt-10 border-t border-white/10 pt-10">
          <div className="flex flex-wrap items-center justify-between mb-4">
            <div className="flex items-center">
              <Label htmlFor="content" className="text-xl font-semibold">Article Content Editor</Label>
              <span className="ml-3 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                <DragHandle />
                Drag to reorder blocks
              </span>
            </div>
            <div className="text-xs text-white/60 italic mt-2 md:mt-0">
              Tip: Use keyboard shortcuts - Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link)
            </div>
          </div>
          
          <div className="bg-[#1E1E2D] border border-white/10 rounded-lg p-6 shadow-lg">
            <div className="min-h-[700px]">
              <ArticleEditor 
                initialContent={Array.isArray(content) ? content : []}
                onSave={(updatedBlocks) => {
                  console.log("Content blocks updated:", updatedBlocks);
                  setContent(updatedBlocks);
                }}
              />
            </div>
          </div>
          
          <div className="mt-4 text-sm text-white/60 italic">
            Use the controls above to add different types of content blocks. Drag blocks to reorder them.
          </div>
        </div>
      </EditorMainCard>
    </form>
  );
  
  // Sidebar content
  const sidebarContent = (
    <EditorSideCard
      title="Article Settings"
      description="Configure publishing options"
      footer={
        <Button 
          type="submit" 
          className="w-full"
          onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
          disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          {(createArticleMutation.isPending || updateArticleMutation.isPending) 
            ? 'Saving...' 
            : isEditing 
              ? 'Save Changes'
              : isDraft ? 'Create Draft' : 'Create & Publish'
          }
        </Button>
      }
    >
      {/* Publication Controls */}
      <div className="space-y-6 mb-6">
        <div className="bg-[#1E1E2D] p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
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
          
          {isEditing && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant={isDraft ? "default" : "outline"}
                className={`w-full ${isDraft ? "bg-green-600 hover:bg-green-700" : "border-red-500 text-red-400 hover:bg-red-900/20"}`}
                onClick={() => handleStatusChange(!isDraft)}
              >
                {isDraft 
                  ? <><span className="mr-2">🚀</span> Publish Article Now</> 
                  : <><span className="mr-2">📝</span> Unpublish to Draft</>}
              </Button>
              <p className="text-xs text-white/60 mt-2 text-center">
                {isDraft 
                  ? "This will make the article visible to the public immediately" 
                  : "This will hide the article from the public"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Featured Image Section */}
      <div className="space-y-3">
        <Label className="text-lg font-medium">Featured Image</Label>
        
        {previewUrl ? (
          <div className="relative group rounded-lg overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg border border-white/10 shadow-lg" 
            />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setPreviewUrl('')}
              >
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center border border-dashed border-white/20 rounded-lg p-4 h-48 bg-[#1A1A27]">
            <div className="text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-white/40" />
              <p className="mt-2 text-sm text-white/60">Choose a featured image</p>
              <p className="text-xs text-white/40 mt-1">Recommended: 1200×630px</p>
            </div>
          </div>
        )}
        
        <div className="grid w-full items-center gap-2 mt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="picture" className="text-sm font-medium">Upload Image</Label>
            {selectedFile && (
              <span className="text-xs text-white/60">{selectedFile.name}</span>
            )}
          </div>
          <Input
            id="picture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border-white/10 bg-[#1A1A27] text-sm"
          />
        </div>
      </div>
      
      <div className="space-y-4 border-t border-white/10 pt-6 mt-6">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-lg font-medium">Category</Label>
          <Select 
            value={category} 
            onValueChange={(value) => setCategory(value)}
            required
          >
            <SelectTrigger className="border-white/10 bg-[#1A1A27]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              )) || (
                <>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="astronomy">Astronomy</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      
        <div className="flex items-center space-x-2 bg-[#1A1A27] p-4 rounded-lg border border-white/10">
          <Checkbox 
            id="isBreaking" 
            checked={isBreaking}
            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600" 
            onCheckedChange={(checked) => setIsBreaking(checked as boolean)}
          />
          <div>
            <Label htmlFor="isBreaking" className="cursor-pointer font-medium">
              Breaking News
            </Label>
            <p className="text-xs text-white/60 mt-1">
              Mark this article as breaking news to highlight it on the homepage
            </p>
          </div>
        </div>
      </div>
    </EditorSideCard>
  );

  return (
    <div className="container max-w-[1400px] mx-auto py-10">
      <div className="flex items-center mb-8 border-b border-white/10 pb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4 hover:bg-white/10"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold tracking-tight">{isEditing ? 'Edit Article' : 'New Article'}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {mainContent}
        </div>
        
        <div className="lg:col-span-1">
          {sidebarContent}
        </div>
      </div>
    </div>
  );
}

export default AdminArticleEditor;