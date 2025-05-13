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

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  publishedAt?: string;
  authors?: Array<{
    user: {
      id: number;
      username: string;
      profilePicture?: string;
      role?: string;
    };
  }>;
}

interface PublishedContentProps {
  showAll?: boolean;
  statusFilter?: string;
}

export function PublishedContent({ showAll = false, statusFilter }: PublishedContentProps = {}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  // Fetch articles based on props
  const { data: articles = [], isLoading, error } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    enabled: !!user && (user.role === 'admin' || user.role === 'editor' || user.role === 'author'),
  });
  
  // Filter articles based on statusFilter prop if provided
  const filteredArticles = React.useMemo(() => {
    if (!articles || !Array.isArray(articles)) return [];
    
    if (statusFilter) {
      return articles.filter(article => article.status === statusFilter);
    }
    
    if (!showAll) {
      // Default behavior - only show published articles
      return articles.filter(article => article.status === 'published');
    }
    
    return articles;
  }, [articles, statusFilter, showAll]);

  const handleEdit = (id: number) => {
    navigate(`/admin/articles/${id}/edit`);
  };

  const handleView = (slug: string) => {
    window.open(`/article/${slug}`, '_blank');
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
        title: 'Success',
        description: `Article marked as "${status.replace('_', ' ')}"`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
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
    setSelectedArticleId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedArticleId) return;
    
    try {
      await apiRequest('DELETE', `/api/articles/${selectedArticleId}`);

      toast({
        title: 'Success',
        description: 'Article deleted successfully',
      });

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setSelectedArticleId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete article',
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
        return <Badge className="bg-blue-500">Good to Publish</Badge>;
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
          <CardTitle>
            {statusFilter ? 
              `${statusFilter.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} Articles` : 
              (showAll ? 'All Articles' : 'Published Content')
            }
          </CardTitle>
          <CardDescription>Loading articles...</CardDescription>
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
          <CardTitle>
            {statusFilter ? 
              `${statusFilter.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} Articles` : 
              (showAll ? 'All Articles' : 'Published Content')
            }
          </CardTitle>
          <CardDescription>Error loading articles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Failed to load articles. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {statusFilter ? 
            `${statusFilter.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())} Articles` : 
            (showAll ? 'All Articles' : 'Published Content')
          }
        </CardTitle>
        <CardDescription>
          {statusFilter ? 
            `Manage articles with ${statusFilter.replace('_', ' ')} status` : 
            (showAll ? 'Manage all your articles' : 'Manage your published articles')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredArticles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {statusFilter ? 
              `No articles with ${statusFilter.replace('_', ' ')} status found.` : 
              (showAll ? 'No articles found.' : 'No published articles found.')
            }
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article: Article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title || 'Untitled Article'}</TableCell>
                  <TableCell>
                    {article.authors?.map((author: { user: { id: number; username: string } }) => author.user.username).join(', ') || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {article.publishedAt 
                      ? formatDistance(new Date(article.publishedAt), new Date(), { addSuffix: true }) 
                      : 'Not published'}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(article.status)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(article.id)}
                      title="Edit"
                    >
                      <FileEditIcon className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(article.slug)}
                      title="View"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    
                    {(user?.role === 'admin' || user?.role === 'editor') && (
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
                            onClick={() => handleUpdateStatus(article.id, 'needs_edits')}
                            className="text-amber-500 flex items-center"
                          >
                            <AlertTriangleIcon className="h-4 w-4 mr-2" />
                            Needs Edits
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(article.id, 'good_to_publish')}
                            className="text-blue-500 flex items-center"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Good to Publish
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateStatus(article.id, 'do_not_publish')}
                            className="text-red-500 flex items-center"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Do Not Publish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    
                    {user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(article.id)}
                        title="Delete"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
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
            <p>Are you sure you want to delete this article? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedArticleId(null);
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

export default PublishedContent;