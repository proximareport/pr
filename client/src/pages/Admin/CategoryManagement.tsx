import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusIcon, Pencil, Trash2, XCircle, InfoIcon, CheckIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHomepageDialogOpen, setIsHomepageDialogOpen] = useState(false);
  
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [homepageCategories, setHomepageCategories] = useState<string[]>([]);
  
  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch site settings to get homepage categories
  const { data: siteSettings } = useQuery({
    queryKey: ['/api/site-settings'],
  });
  
  useEffect(() => {
    if (siteSettings?.homeCategories) {
      setHomepageCategories(siteSettings.homeCategories);
    }
  }, [siteSettings]);
  
  // Create category
  const createMutation = useMutation({
    mutationFn: async (categoryData: typeof newCategory) => {
      return await apiRequest('POST', '/api/categories', categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsCreateDialogOpen(false);
      setNewCategory({ name: '', slug: '', description: '' });
      toast({
        title: 'Category Created',
        description: 'The category has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    },
  });
  
  // Update category
  const updateMutation = useMutation({
    mutationFn: async (categoryData: Partial<Category> & { id: number }) => {
      const { id, ...data } = categoryData;
      return await apiRequest('PATCH', `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: 'Category Updated',
        description: 'The category has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    },
  });
  
  // Delete category
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      toast({
        title: 'Category Deleted',
        description: 'The category has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });
  
  // Update homepage categories
  const updateHomepageMutation = useMutation({
    mutationFn: async (categories: string[]) => {
      return await apiRequest('PATCH', '/api/site-settings', { 
        homeCategories: categories 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      setIsHomepageDialogOpen(false);
      toast({
        title: 'Homepage Categories Updated',
        description: 'The homepage category filters have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update homepage categories',
        variant: 'destructive',
      });
    },
  });
  
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newCategory);
  };
  
  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate(editingCategory);
    }
  };
  
  const handleDeleteCategory = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };
  
  const handleSaveHomepageCategories = () => {
    updateHomepageMutation.mutate(homepageCategories);
  };
  
  const toggleHomepageCategory = (categoryName: string) => {
    if (homepageCategories.includes(categoryName)) {
      setHomepageCategories(homepageCategories.filter(cat => cat !== categoryName));
    } else {
      setHomepageCategories([...homepageCategories, categoryName]);
    }
  };
  
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Category Management</h2>
          <p className="text-gray-400">Manage website categories and homepage filters</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsHomepageDialogOpen(true)} variant="outline">
            <InfoIcon className="h-4 w-4 mr-2" />
            Configure Homepage Filters
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-800">
          <Table>
            <TableHeader className="bg-gray-800">
              <TableRow className="border-b border-gray-700 hover:bg-transparent">
                <TableHead className="font-semibold text-gray-300">Name</TableHead>
                <TableHead className="font-semibold text-gray-300">Slug</TableHead>
                <TableHead className="font-semibold text-gray-300">Description</TableHead>
                <TableHead className="font-semibold text-gray-300">Homepage Filter</TableHead>
                <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    No categories found. Create your first category.
                  </TableCell>
                </TableRow>
              )}
              {categories?.map((category) => (
                <TableRow key={category.id} className="hover:bg-gray-800 border-b border-gray-700">
                  <TableCell className="font-medium text-gray-100">{category.name}</TableCell>
                  <TableCell className="text-gray-300">{category.slug}</TableCell>
                  <TableCell className="text-gray-300">
                    {category.description || <span className="text-gray-500">No description</span>}
                  </TableCell>
                  <TableCell>
                    {homepageCategories.includes(category.slug) ? (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-900/30 text-blue-400 rounded-md text-xs">
                        <CheckIcon className="h-3 w-3 mr-1" /> Shown
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">Hidden</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingCategory(category);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => {
                          setDeletingCategory(category);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category for organizing articles
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewCategory({
                      ...newCategory,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || !newCategory.name || !newCategory.slug}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleUpdateCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Category Name</Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => {
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                      });
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input
                    id="edit-slug"
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      slug: e.target.value,
                    })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Input
                    id="edit-description"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending || !editingCategory.name || !editingCategory.slug}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Category'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{deletingCategory?.name}"?
              This action cannot be undone. Articles using this category will need to be recategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Homepage Categories Dialog */}
      <Dialog open={isHomepageDialogOpen} onOpenChange={setIsHomepageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Homepage Filters</DialogTitle>
            <DialogDescription>
              Select which categories appear as filter options on the homepage.
              "All" is always included by default.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-800/50 p-4 rounded-md mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Selected categories will appear as tabs on the homepage. Users will be able to filter articles by these categories.
              </p>
            </div>
            <div className="grid gap-3">
              {categories?.map((category) => (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-md border border-gray-700 bg-gray-800/30"
                >
                  <div>
                    <p className="font-medium text-white">{category.name}</p>
                    <p className="text-sm text-gray-400">{category.slug}</p>
                  </div>
                  <Button 
                    variant={homepageCategories.includes(category.slug) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleHomepageCategory(category.slug)}
                  >
                    {homepageCategories.includes(category.slug) ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" /> Included
                      </>
                    ) : "Add to Homepage"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsHomepageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveHomepageCategories}
              disabled={updateHomepageMutation.isPending}
            >
              {updateHomepageMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}