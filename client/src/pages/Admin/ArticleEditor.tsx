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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftIcon, SaveIcon, ImageIcon, UploadIcon } from 'lucide-react';
import ArticleEditor from '@/components/article/ArticleEditor';

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

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Article' : 'New Article'}</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
                <CardDescription>Enter the main content for your article</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={handleTitleChange}
                    placeholder="Enter article title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input 
                    id="slug" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="article-url-slug"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea 
                    id="summary" 
                    value={summary} 
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief summary of the article (appears in previews)"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="content" className="mb-2 block">Content</Label>
                  <div className="min-h-[600px]">
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
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Settings</CardTitle>
                <CardDescription>Configure article properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={category} 
                    onValueChange={(value) => setCategory(value)}
                    required
                  >
                    <SelectTrigger>
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
                
                <div className="space-y-2">
                  <Label htmlFor="readTime">Read Time (minutes)</Label>
                  <Input 
                    id="readTime" 
                    type="number" 
                    min="1"
                    max="60"
                    value={readTime} 
                    onChange={(e) => setReadTime(Number(e.target.value))}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="isBreaking" 
                    checked={isBreaking} 
                    onCheckedChange={(checked) => setIsBreaking(checked as boolean)}
                  />
                  <Label htmlFor="isBreaking" className="cursor-pointer">
                    Mark as breaking news
                  </Label>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>Select an image for the article</CardDescription>
              </CardHeader>
              <CardContent>
                {previewUrl ? (
                  <div className="mb-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-md" 
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center border border-dashed rounded-md h-48 mb-4 bg-gray-50">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No image selected</p>
                    </div>
                  </div>
                )}
                
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="picture">Upload Image</Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate('/admin')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                >
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update' : 'Publish'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminArticleEditor;