import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Tag = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

const TagManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagName, setTagName] = useState<string>('');
  const [tagDescription, setTagDescription] = useState<string>('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: tags, isLoading } = useQuery({
    queryKey: ['/api/tags'],
    staleTime: 60000,
  });

  const createTag = useMutation({
    mutationFn: async (newTag: { name: string; description?: string }) => {
      return apiRequest('POST', '/api/tags', newTag);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsCreateDialogOpen(false);
      setTagName('');
      setTagDescription('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tag',
        variant: 'destructive',
      });
    },
  });

  const updateTag = useMutation({
    mutationFn: async (data: { id: number; name: string; description?: string }) => {
      return apiRequest('PATCH', `/api/tags/${data.id}`, {
        name: data.name,
        description: data.description,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tag updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsEditDialogOpen(false);
      setEditingTag(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tag',
        variant: 'destructive',
      });
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tags/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Tag deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tag',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTag = () => {
    if (!tagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name is required',
        variant: 'destructive',
      });
      return;
    }

    createTag.mutate({
      name: tagName.trim(),
      description: tagDescription.trim() || undefined,
    });
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;

    if (!editingTag.name.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name is required',
        variant: 'destructive',
      });
      return;
    }

    updateTag.mutate({
      id: editingTag.id,
      name: editingTag.name.trim(),
      description: editingTag.description?.trim() || undefined,
    });
  };

  const handleDeleteTag = () => {
    if (deleteTagId !== null) {
      deleteTag.mutate(deleteTagId);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setDeleteTagId(id);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tag Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Enter the details for the new tag.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-description">Description (optional)</Label>
                <Textarea
                  id="tag-description"
                  value={tagDescription}
                  onChange={(e) => setTagDescription(e.target.value)}
                  placeholder="Enter tag description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTag}
                disabled={createTag.isPending}
              >
                {createTag.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tags && tags.length > 0 ? (
            tags.map((tag: Tag) => (
              <Card key={tag.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{tag.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDeleteDialog(tag.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {tag.slug}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tag.description || "No description provided"}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No tags found. Create your first tag to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag details.
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tag-name">Name</Label>
                <Input
                  id="edit-tag-name"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  placeholder="Enter tag name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tag-description">Description (optional)</Label>
                <Textarea
                  id="edit-tag-description"
                  value={editingTag.description || ''}
                  onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                  placeholder="Enter tag description"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTag}
              disabled={updateTag.isPending}
            >
              {updateTag.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tag
              and may affect articles that are using this tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTag.isPending}
            >
              {deleteTag.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TagManagement;