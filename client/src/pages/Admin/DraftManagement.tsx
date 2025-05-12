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
import { 
  FileEditIcon, 
  EyeIcon, 
  TrashIcon, 
  CheckSquareIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon,
  XCircleIcon 
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export function DraftManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);

  // Define article type
  interface ArticleDraft {
    id: number;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
    authors?: Array<{
      id: number;
      username: string;
      profilePicture?: string;
      role: string;
    }>;
  }

  // Fetch draft articles based on user role
  const { data: drafts = [], isLoading, error } = useQuery<ArticleDraft[]>({
    queryKey: ['/api/articles/drafts'],
    enabled: !!user && (user.role === 'admin' || user.role === 'editor'),
  });

  // Fetch user's draft articles if they're an author
  const { data: myDrafts = [] } = useQuery<ArticleDraft[]>({
    queryKey: ['/api/articles/drafts/me'],
    enabled: !!user,
  });

  // Determine which drafts to display based on user role
  const displayDrafts: ArticleDraft[] = user?.role === 'author' ? myDrafts : drafts;

  const handleEdit = (id: number) => {
    navigate(`/admin/articles/${id}/edit`);
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
      const updateResponse = await apiRequest('PUT', `/api/articles/${id}`, {
        ...article,
        status: 'published',
        publishedAt: new Date().toISOString()
      });

      if (updateResponse.ok) {
        toast({
          title: 'Success',
          description: 'Article published successfully',
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      } else {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to publish article');
      }
    } catch (error: any) {
      console.error('Error publishing article:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish article. Only editors and admins can publish.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      // Get the current article data
      const response = await apiRequest('GET', `/api/articles/${id}`);
      const article = await response.json();

      // Update the status
      await apiRequest('PUT', `/api/articles/${id}`, {
        ...article,
        status
      });

      toast({
        title: 'Status Updated',
        description: `Article marked as "${status.replace('_', ' ')}"`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts/me'] });
    } catch (error) {
      console.error('Error updating article status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update article status',
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

  // Function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'needs_edits':
        return <Badge className="bg-amber-500">Needs Edits</Badge>;
      case 'good_to_publish':
        return <Badge className="bg-blue-500">Ready to Publish</Badge>;
      case 'do_not_publish':
        return <Badge className="bg-red-500">Do Not Publish</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
              {displayDrafts.map((draft) => (
                <TableRow key={draft.id}>
                  <TableCell className="font-medium">{draft.title || 'Untitled Draft'}</TableCell>
                  <TableCell>
                    {draft.authors?.map((author) => author.username).join(', ') || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {draft.updatedAt 
                      ? formatDistance(new Date(draft.updatedAt), new Date(), { addSuffix: true }) 
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(draft.status || 'draft')}
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
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePublish(draft.id)}
                          title="Publish"
                          disabled={draft.status === 'do_not_publish'}
                        >
                          <CheckSquareIcon className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(draft.id, 'needs_edits')}
                              className="text-amber-500 flex items-center"
                            >
                              <AlertTriangleIcon className="h-4 w-4 mr-2" />
                              Needs Edits
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(draft.id, 'good_to_publish')}
                              className="text-blue-500 flex items-center"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Good to Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(draft.id, 'do_not_publish')}
                              className="text-red-500 flex items-center"
                            >
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Do Not Publish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
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