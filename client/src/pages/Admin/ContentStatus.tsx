import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  // Fetch all articles for editors and admins
  const { data: articles, isLoading, isError } = useQuery<Article[]>({
    queryKey: ['/api/articles/all'],
    retry: false,
  });
  
  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/articles/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update article status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the articles query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/articles/all'] });
      toast({
        title: 'Status updated',
        description: 'The article status has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error updating article status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update article status. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-gray-500';
      case 'needs_edits':
        return 'bg-yellow-500';
      case 'good_to_publish':
        return 'bg-blue-500';
      case 'do_not_publish':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Status display mapping
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'needs_edits':
        return 'Needs Edits';
      case 'good_to_publish':
        return 'Good to Publish';
      case 'do_not_publish':
        return 'Do Not Publish';
      default:
        return status;
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Content Status</h1>
          <Link href="/admin/articles/new">
            <Button>Create New Article</Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading articles...</span>
          </div>
        ) : isError ? (
          <div className="bg-red-100 p-4 rounded-md text-red-700">
            Failed to load articles. Please refresh the page or try again later.
          </div>
        ) : (
          <div className="bg-white rounded-md shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead>Authors</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles && articles.length > 0 ? (
                  articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>
                        {article.authors ? (
                          article.authors.map((author, index) => (
                            <span key={author.id}>
                              {author.username}
                              {index < article.authors!.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : (
                          'No authors'
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(article.status)}>
                          {getStatusDisplay(article.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Select
                          defaultValue={article.status}
                          onValueChange={(value) => handleStatusChange(article.id, value)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="needs_edits">Needs Edits</SelectItem>
                            <SelectItem value="good_to_publish">Good to Publish</SelectItem>
                            <SelectItem value="do_not_publish">Do Not Publish</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Link href={`/admin/articles/edit/${article.id}`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        
                        {article.status === 'published' && (
                          <a href={`/article/${article.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No articles found. Create your first article to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ContentStatus;