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
  AlertTriangleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  RefreshCcwIcon
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  publishedAt?: string;
  authors?: Array<{
    id: number;
    username: string;
    profilePicture?: string;
    role: string;
  }>;
}

function ContentStatus() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Guard for non-editor, non-admin users
  React.useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch all articles
  const { data: articles = [], isLoading, refetch } = useQuery<Article[]>({
    queryKey: ['/api/articles/all'],
    enabled: !!user && (user.role === 'admin' || user.role === 'editor'),
  });

  // Filter articles by status
  const needsEditsArticles = articles.filter(article => article.status === 'needs_edits');
  const goodToPublishArticles = articles.filter(article => article.status === 'good_to_publish');
  const doNotPublishArticles = articles.filter(article => article.status === 'do_not_publish');
  const publishedArticles = articles.filter(article => article.status === 'published');
  const draftArticles = articles.filter(article => article.status === 'draft');

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

      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Error updating article status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update article status',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/articles/edit/${id}`);
  };

  const handleView = (slug: string) => {
    window.open(`/article/${slug}${slug.includes('?') ? '&' : '?'}preview=true`, '_blank');
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

  // Render a table of articles with the given title and articles array
  const renderArticleTable = (title: string, articlesToShow: Article[]) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {articlesToShow.length} article{articlesToShow.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {articlesToShow.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No articles in this category.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articlesToShow.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title || 'Untitled Article'}</TableCell>
                  <TableCell>
                    {article.authors?.map((author) => author.username).join(', ') || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {article.updatedAt 
                      ? formatDistance(new Date(article.updatedAt), new Date(), { addSuffix: true }) 
                      : 'Unknown'}
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
                      disabled={!article.slug}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    
                    {/* Status change buttons - only show the ones that make sense for the current status */}
                    {article.status !== 'needs_edits' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateStatus(article.id, 'needs_edits')}
                        title="Needs Edits"
                        className="text-amber-500"
                      >
                        <AlertTriangleIcon className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {article.status !== 'good_to_publish' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateStatus(article.id, 'good_to_publish')}
                        title="Good to Publish"
                        className="text-blue-500"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {article.status !== 'do_not_publish' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdateStatus(article.id, 'do_not_publish')}
                        title="Do Not Publish"
                        className="text-red-500"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Content Status Management</h1>
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Status Management</h1>
        <Button onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCcwIcon size={16} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="needs-edits" className="w-full mb-8">
        <TabsList className="w-full">
          <TabsTrigger value="needs-edits" className="flex-1">
            Needs Edits ({needsEditsArticles.length})
          </TabsTrigger>
          <TabsTrigger value="good-to-publish" className="flex-1">
            Good to Publish ({goodToPublishArticles.length})
          </TabsTrigger>
          <TabsTrigger value="do-not-publish" className="flex-1">
            Do Not Publish ({doNotPublishArticles.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            All Content
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="needs-edits" className="mt-6">
          {renderArticleTable("Articles Needing Edits", needsEditsArticles)}
        </TabsContent>
        
        <TabsContent value="good-to-publish" className="mt-6">
          {renderArticleTable("Articles Ready to Publish", goodToPublishArticles)}
        </TabsContent>
        
        <TabsContent value="do-not-publish" className="mt-6">
          {renderArticleTable("Articles Not to Publish", doNotPublishArticles)}
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          {renderArticleTable("Published Articles", publishedArticles)}
          {renderArticleTable("Draft Articles", draftArticles)}
          {renderArticleTable("Articles Needing Edits", needsEditsArticles)}
          {renderArticleTable("Articles Ready to Publish", goodToPublishArticles)}
          {renderArticleTable("Articles Not to Publish", doNotPublishArticles)}
        </TabsContent>
      </Tabs>

      <Button 
        variant="outline" 
        onClick={() => navigate('/admin')}
        className="mt-8"
      >
        Back to Dashboard
      </Button>
    </div>
  );
}

export default ContentStatus;