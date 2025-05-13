import { useState } from 'react';
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
import { PlusIcon, Pencil, Trash2, Hash } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TagManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [newTag, setNewTag] = useState({ name: '', slug: '', description: '' });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [filter, setFilter] = useState('');
  
  // Fetch tags
  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });
  
  // Create tag
  const createMutation = useMutation({
    mutationFn: async (tagData: typeof newTag) => {
      return await apiRequest('POST', '/api/tags', tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsCreateDialogOpen(false);
      setNewTag({ name: '', slug: '', description: '' });
      toast({
        title: 'Tag Created',
        description: 'The tag has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tag',
        variant: 'destructive',
      });
    },
  });
  
  // Update tag
  const updateMutation = useMutation({
    mutationFn: async (tagData: Partial<Tag> & { id: number }) => {
      const { id, ...data } = tagData;
      return await apiRequest('PATCH', `/api/tags/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsEditDialogOpen(false);
      setEditingTag(null);
      toast({
        title: 'Tag Updated',
        description: 'The tag has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tag',
        variant: 'destructive',
      });
    },
  });
  
  // Delete tag
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsDeleteDialogOpen(false);
      setDeletingTag(null);
      toast({
        title: 'Tag Deleted',
        description: 'The tag has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tag',
        variant: 'destructive',
      });
    },
  });
  
  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newTag);
  };
  
  const handleUpdateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateMutation.mutate(editingTag);
    }
  };
  
  const handleDeleteTag = () => {
    if (deletingTag) {
      deleteMutation.mutate(deletingTag.id);
    }
  };
  
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  const filteredTags = tags?.filter(tag => 
    tag.name.toLowerCase().includes(filter.toLowerCase()) || 
    tag.slug.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Tag Management</h2>
          <p className="text-gray-400">Create and manage article tags</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Tag
        </Button>
      </div>
      
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search tags..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
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
                <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                    {filter ? "No tags match your search." : "No tags found. Create your first tag."}
                  </TableCell>
                </TableRow>
              )}
              {filteredTags?.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-gray-800 border-b border-gray-700">
                  <TableCell className="font-medium text-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-900/30 text-blue-400 p-1 rounded">
                        <Hash className="h-4 w-4" />
                      </span>
                      {tag.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{tag.slug}</TableCell>
                  <TableCell className="text-gray-300">
                    {tag.description || <span className="text-gray-500">No description</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingTag(tag);
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
                          setDeletingTag(tag);
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
      
      {/* Create Tag Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a new tag for organizing articles
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTag}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  value={newTag.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewTag({
                      ...newTag,
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
                  value={newTag.slug}
                  onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
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
                disabled={createMutation.isPending || !newTag.name || !newTag.slug}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Tag'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag details
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <form onSubmit={handleUpdateTag}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Tag Name</Label>
                  <Input
                    id="edit-name"
                    value={editingTag.name}
                    onChange={(e) => {
                      setEditingTag({
                        ...editingTag,
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
                    value={editingTag.slug}
                    onChange={(e) => setEditingTag({
                      ...editingTag,
                      slug: e.target.value,
                    })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Input
                    id="edit-description"
                    value={editingTag.description || ''}
                    onChange={(e) => setEditingTag({
                      ...editingTag,
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
                  disabled={updateMutation.isPending || !editingTag.name || !editingTag.slug}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Tag'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Tag Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{deletingTag?.name}"?
              This action cannot be undone. This tag will be removed from all articles that use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Tag'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}