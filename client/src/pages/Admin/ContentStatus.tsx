import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Eye, FileEdit } from 'lucide-react';
import { Link } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authors?: Array<{
    user: {
      id: number;
      username: string;
    };
  }>;
}

function ContentStatus() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['/api/articles/all'],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      articleId,
      status,
    }: {
      articleId: number;
      status: string;
    }) => {
      return await apiRequest('PATCH', `/api/articles/${articleId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles/all'] });
      toast({
        title: 'Success',
        description: 'Article status updated successfully',
      });
      setSelectedArticle(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update article status',
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = () => {
    if (selectedArticle && selectedStatus) {
      updateStatusMutation.mutate({
        articleId: selectedArticle.id,
        status: selectedStatus,
      });
    }
  };

  const openStatusDialog = (article: Article) => {
    setSelectedArticle(article);
    setSelectedStatus(article.status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
      case 'needs_edits':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs Edits</Badge>;
      case 'good_to_publish':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good to Publish</Badge>;
      case 'do_not_publish':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Do Not Publish</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getArticlesByStatus = (status: string | string[]) => {
    if (!articles) return [];
    
    if (Array.isArray(status)) {
      return articles.filter((article: Article) => status.includes(article.status));
    }
    
    return articles.filter((article: Article) => article.status === status);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderArticleTable = (filteredArticles: Article[]) => {
    if (filteredArticles.length === 0) {
      return <div className="text-center py-8 text-gray-500">No articles found</div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredArticles.map((article: Article) => (
            <TableRow key={article.id}>
              <TableCell className="font-medium">{article.title}</TableCell>
              <TableCell>
                {article.authors && article.authors.map((author, idx) => (
                  <span key={author.user.id}>
                    {author.user.username}
                    {idx < article.authors!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </TableCell>
              <TableCell>{getStatusBadge(article.status)}</TableCell>
              <TableCell>{formatDate(article.updatedAt)}</TableCell>
              <TableCell>{formatDate(article.publishedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/article/${article.slug}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/edit-article/${article.id}`}>
                      <FileEdit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openStatusDialog(article)}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Content Status</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
              <TabsList className="grid grid-cols-5 max-w-md mx-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="needs_edits" className="flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4" /> Needs Edits
                </TabsTrigger>
                <TabsTrigger value="good_to_publish" className="flex gap-2 items-center">
                  <CheckCircle className="h-4 w-4" /> Good to Publish
                </TabsTrigger>
                <TabsTrigger value="do_not_publish" className="flex gap-2 items-center">
                  <XCircle className="h-4 w-4" /> Do Not Publish
                </TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
              </TabsList>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Article Management</CardTitle>
                <CardDescription>Review and manage article status</CardDescription>
              </CardHeader>
              <CardContent>
                <TabsContent value="all">
                  {renderArticleTable(articles)}
                </TabsContent>
                <TabsContent value="needs_edits">
                  {renderArticleTable(getArticlesByStatus('needs_edits'))}
                </TabsContent>
                <TabsContent value="good_to_publish">
                  {renderArticleTable(getArticlesByStatus('good_to_publish'))}
                </TabsContent>
                <TabsContent value="do_not_publish">
                  {renderArticleTable(getArticlesByStatus('do_not_publish'))}
                </TabsContent>
                <TabsContent value="published">
                  {renderArticleTable(getArticlesByStatus('published'))}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        )}

        {/* Status Update Dialog */}
        <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Article Status</DialogTitle>
              <DialogDescription>
                {selectedArticle?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft" className="flex items-center">
                    <Badge className="ml-2 bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>
                    <span className="ml-2">Work in progress</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="needs_edits" id="needs_edits" />
                  <Label htmlFor="needs_edits" className="flex items-center">
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">Needs Edits</Badge>
                    <span className="ml-2">Requires revisions before publishing</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good_to_publish" id="good_to_publish" />
                  <Label htmlFor="good_to_publish" className="flex items-center">
                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">Good to Publish</Badge>
                    <span className="ml-2">Ready for publication</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="do_not_publish" id="do_not_publish" />
                  <Label htmlFor="do_not_publish" className="flex items-center">
                    <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">Do Not Publish</Badge>
                    <span className="ml-2">Content rejected - do not publish</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="published" id="published" />
                  <Label htmlFor="published" className="flex items-center">
                    <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Published</Badge>
                    <span className="ml-2">Live on the site</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending || selectedStatus === selectedArticle?.status}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default ContentStatus;