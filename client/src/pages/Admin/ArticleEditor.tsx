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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { SaveIcon, ImageIcon, UploadIcon } from 'lucide-react';
import ArticleEditor from '@/components/article/ArticleEditorSimple';
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
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Article created successfully",
        description: "Your article has been published.",
      });
      navigate('/admin');
    },
    onError: (error: any) => {
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
      apiRequest('PUT', `/api/articles/${params.id}`, articleData).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles', params.id] });
      toast({
        title: "Article updated successfully",
        description: "Your changes have been saved.",
      });
      navigate('/admin');
    },
    onError: (error: any) => {
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      } catch (error) {
        toast({
          title: "Image upload failed",
          description: "Failed to upload the featured image.",
          variant: "destructive",
        });
        return;
      }
    }
    
    const articleData = {
      title,
      slug,
      summary,
      content: {
        blocks: Array.isArray(content) ? content : []
      },
      category,
      isBreaking,
      readTime: Number(readTime),
      featuredImage: imageUrl,
      authorId: user?.id,
    };
    
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
      setContent(article.content || '');
      setCategory(article.category || '');
      setIsBreaking(article.isBreaking || false);
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
                initialArticle={{
                  title,
                  slug,
                  summary,
                  category,
                  isBreaking,
                  readTime,
                  featuredImage: previewUrl || featuredImage,
                  tags: [],
                  content: {
                    blocks: typeof content === 'string' ? [] : content
                  }
                }}
                onSave={(articleData) => {
                  // Update our form state with the new content
                  if (articleData.content?.blocks) {
                    setContent(articleData.content.blocks);
                  }
                  // Update other fields as well
                  setTitle(articleData.title);
                  setSlug(articleData.slug);
                  setSummary(articleData.summary);
                  setCategory(articleData.category);
                  setIsBreaking(articleData.isBreaking);
                  setReadTime(articleData.readTime);
                  if (articleData.featuredImage) {
                    setFeaturedImage(articleData.featuredImage);
                    setPreviewUrl(articleData.featuredImage);
                  }
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
            : isEditing ? 'Update Article' : 'Publish Article'
          }
        </Button>
      }
    >
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
    <EditorLayout
      title={isEditing ? 'Edit Article' : 'New Article'}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}

export default AdminArticleEditor;