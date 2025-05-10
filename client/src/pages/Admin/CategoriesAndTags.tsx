import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TagIcon, Hash, PlusCircle, Edit, Trash2, CheckCircle2, ArrowLeftIcon } from 'lucide-react';

function CategoriesAndTags() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingTag, setEditingTag] = useState<any>(null);
  
  // Dialogs
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'category' | 'tag', id: number} | null>(null);
  
  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['/api/tags'],
  });
  
  // Mutations
  const createCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      return await apiRequest('POST', '/api/categories', categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setCategoryDialogOpen(false);
      resetCategoryForm();
      toast({
        title: "Category created",
        description: "The category has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    }
  });
  
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest('PUT', `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "The category has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    }
  });
  
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  });
  
  const createTag = useMutation({
    mutationFn: async (tagData: any) => {
      return await apiRequest('POST', '/api/tags', tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setTagDialogOpen(false);
      setNewTagName('');
      toast({
        title: "Tag created",
        description: "The tag has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive",
      });
    }
  });
  
  const updateTag = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest('PUT', `/api/tags/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setTagDialogOpen(false);
      setEditingTag(null);
      toast({
        title: "Tag updated",
        description: "The tag has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tag",
        variant: "destructive",
      });
    }
  });
  
  const deleteTag = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      toast({
        title: "Tag deleted",
        description: "The tag has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag",
        variant: "destructive",
      });
    }
  });
  
  // Helper functions
  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryDescription('');
  };
  
  const handleSubmitCategory = () => {
    if (!newCategoryName || !newCategorySlug) {
      toast({
        title: "Required fields",
        description: "Name and slug are required.",
        variant: "destructive",
      });
      return;
    }
    
    const categoryData = {
      name: newCategoryName,
      slug: newCategorySlug,
      description: newCategoryDescription,
    };
    
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createCategory.mutate(categoryData);
    }
  };
  
  const handleSubmitTag = () => {
    if (!newTagName) {
      toast({
        title: "Required field",
        description: "Tag name is required.",
        variant: "destructive",
      });
      return;
    }
    
    const tagData = {
      name: newTagName,
    };
    
    if (editingTag) {
      updateTag.mutate({ id: editingTag.id, data: tagData });
    } else {
      createTag.mutate(tagData);
    }
  };
  
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategorySlug(category.slug);
    setNewCategoryDescription(category.description || '');
    setCategoryDialogOpen(true);
  };
  
  const handleEditTag = (tag: any) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setTagDialogOpen(true);
  };
  
  const confirmDelete = (type: 'category' | 'tag', id: number) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };
  
  const handleDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'category') {
      deleteCategory.mutate(itemToDelete.id);
    } else {
      deleteTag.mutate(itemToDelete.id);
    }
  };
  
  useEffect(() => {
    // Redirect if not admin
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
          onClick={() => navigate('/admin')}
          className="mr-2 p-0 h-auto"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Categories & Tags</h1>
      </div>
      
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="categories" className="flex-1">
            <TagIcon className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex-1">
            <Hash className="mr-2 h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Create and manage article categories</CardDescription>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory 
                        ? 'Make changes to the existing category.' 
                        : 'Create a new category for articles.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          // Auto-generate slug if not editing
                          if (!editingCategory) {
                            setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                          }
                        }}
                        placeholder="e.g. Astronomy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categorySlug">Slug</Label>
                      <Input
                        id="categorySlug"
                        value={newCategorySlug}
                        onChange={(e) => setNewCategorySlug(e.target.value)}
                        placeholder="e.g. astronomy"
                      />
                      <p className="text-sm text-muted-foreground">
                        Used in URLs: /category/your-slug
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryDescription">Description (optional)</Label>
                      <Input
                        id="categoryDescription"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Optional description for this category"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setCategoryDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitCategory}>
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length > 0 ? (
                      categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.slug}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {category.description || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete('category', category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No categories found. Create your first category.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tags">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Create and manage article tags</CardDescription>
              </div>
              <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setEditingTag(null);
                      setNewTagName('');
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTag ? 'Edit Tag' : 'Add New Tag'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTag 
                        ? 'Make changes to the existing tag.' 
                        : 'Create a new tag for articles.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tagName">Name</Label>
                      <Input
                        id="tagName"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="e.g. mars"
                      />
                      <p className="text-sm text-muted-foreground">
                        Tags should be simple, one-word identifiers
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setTagDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitTag}>
                      {editingTag ? 'Save Changes' : 'Create Tag'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.length > 0 ? (
                      tags.map((tag: any) => (
                        <Badge
                          key={tag.id}
                          className="bg-purple-800 px-3 py-1 flex items-center gap-2"
                        >
                          <span>{tag.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditTag(tag)}
                              className="hover:text-white/70 transition"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => confirmDelete('tag', tag.id)}
                              className="hover:text-white/70 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </Badge>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground w-full">
                        No tags found. Create your first tag.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CategoriesAndTags;