import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileTextIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon,
  CheckCircleIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function DraftManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: drafts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/articles/drafts'],
    queryFn: () => apiRequest('GET', '/api/articles/drafts').then(r => r.json()),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PUT', `/api/articles/${id}`, { status: 'published' })
        .then(r => r.json());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article published successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to publish article",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/articles/${id}`)
        .then(r => r.json());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/articles/drafts'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    },
  });

  const handlePublish = (id: number) => {
    if (confirm('Are you sure you want to publish this article?')) {
      publishMutation.mutate(id);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Draft Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Draft Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading drafts. Please try again.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Draft Articles</span>
          <Button size="sm" asChild>
            <Link href="/admin/articles/new">
              <FileTextIcon className="h-4 w-4 mr-2" />
              New Article
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {drafts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No draft articles found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author(s)</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft: any) => (
                <TableRow key={draft.id}>
                  <TableCell>
                    <div className="font-medium">{draft.title}</div>
                    <div className="text-sm text-gray-500">
                      {draft.category}
                    </div>
                  </TableCell>
                  <TableCell>
                    {draft.authors && draft.authors.length > 0 ? (
                      <div className="space-y-1">
                        {draft.authors.map((author: any) => (
                          <Badge key={author.id} variant="outline" className="mr-1">
                            {author.username}
                            {author.role && ` (${author.role})`}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No authors</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {draft.updatedAt ? (
                      formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })
                    ) : (
                      "Unknown"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/articles/${draft.id}/edit`}>
                          <EditIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/article/${draft.slug}`}>
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePublish(draft.id)}
                        disabled={publishMutation.isPending}
                      >
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(draft.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default DraftManagement;