import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileEditIcon, EyeIcon, TrashIcon, CheckSquareIcon } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function DraftManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);

  // Fetch draft articles based on user role
  const { data: drafts = [], isLoading, error } = useQuery({
    queryKey: ['/api/articles/drafts'],
    enabled: !!user,
  });

  // Fetch user's draft articles if they're an author
  const { data: myDrafts = [] } = useQuery({
    queryKey: ['/api/articles/drafts/me'],
    enabled: !!user && user.role === 'author',
  });

  // Determine which drafts to display based on user role
  const displayDrafts = user?.role === 'author' ? myDrafts : drafts;

  const handleEdit = (id: number) => {
    navigate(`/admin/articles/edit/${id}`);
  };

  const handlePreview = (slug: string) => {
    window.open(`/article/${slug}?preview=true`, '_blank');
  };

  const handlePublish = async (id: number) => {
    try {
      // Get the current article data
      const response = await apiRequest('GET', `/api/articles/${id}`);
      const article = await response.json();

      // Update to published status
      await apiRequest('PUT', `/api/articles/${id}`, {
        ...article,
        status: 'published'
      });

      toast({
        title: 'Success',
        description: 'Article published successfully',
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    } catch (error) {
      console.error('Error publishing article:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish article. Only editors and admins can publish.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (id: number) => {
    setSelectedDraftId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDraftId) return;
    
    try {
      await apiRequest('DELETE', `/api/articles/${selectedDraftId}`);

      toast({
        title: 'Success',
        description: 'Draft deleted successfully',
      });

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setSelectedDraftId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts/me'] });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Draft Management</CardTitle>
          <CardDescription>Loading drafts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Draft Management</CardTitle>
          <CardDescription>Error loading drafts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Failed to load drafts. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Management</CardTitle>
        <CardDescription>
          {user?.role === 'author' 
            ? 'Manage your article drafts before publishing' 
            : 'Review and manage all article drafts'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayDrafts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No draft articles found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayDrafts.map((draft: any) => (
                <TableRow key={draft.id}>
                  <TableCell className="font-medium">{draft.title || 'Untitled Draft'}</TableCell>
                  <TableCell>
                    {draft.authors?.map((author: any) => author.user.username).join(', ') || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {draft.updatedAt 
                      ? formatDistance(new Date(draft.updatedAt), new Date(), { addSuffix: true }) 
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={draft.status === 'draft' ? 'outline' : 'default'}>
                      {draft.status || 'draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(draft.id)}
                      title="Edit"
                    >
                      <FileEditIcon className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(draft.slug)}
                      title="Preview"
                      disabled={!draft.slug}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePublish(draft.id)}
                        title="Publish"
                      >
                        <CheckSquareIcon className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(draft.id)}
                      title="Delete"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="secondary"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </Button>
        <Button 
          variant="default"
          onClick={() => navigate('/admin/articles/new')}
        >
          Create New Article
        </Button>
      </CardFooter>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
            <p>Are you sure you want to delete this draft? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedDraftId(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default DraftManagement;