import React, { useEffect, useState } from 'react';
import { useLocation, useRouter, Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileTextIcon, 
  UsersIcon, 
  ImageIcon, 
  AlertOctagonIcon, 
  BriefcaseIcon,
  PlusIcon,
  BarChart3Icon,
  TagIcon,
  KeyIcon,
  FileEditIcon,
  DollarSignIcon,
  BellIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  Eye,
  XCircle
} from 'lucide-react';
import DraftManagement from './DraftManagement';
import PublishedContent from './PublishedContent';
import UserManagement from './UserManagement';

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

function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse URL query parameters for tab selection
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  const subTabFromUrl = urlParams.get('subtab');

  // ContentStatus state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  const renderArticleTable = (filteredArticles: Article[]) => {
    if (!filteredArticles || filteredArticles.length === 0) {
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
                      <FileEditIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openStatusDialog(article)}>
                    <CheckCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  // Fetch all advertisements to count pending ones
  const { data: advertisements = [] } = useQuery({
    queryKey: ['/api/advertisements/all'],
    retry: false,
    enabled: !!isAdmin
  });
  
  // Fetch all articles for content status tab
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/articles/all'],
    retry: false,
    enabled: !!isAdmin
  });

  // Status update mutation
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
  
  // Count pending advertisements that need review
  const pendingAdsCount = Array.isArray(advertisements) 
    ? advertisements.filter((ad: any) => !ad.isApproved).length 
    : 0;
    
  // ContentStatus helper functions
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
    if (!articles || !Array.isArray(articles)) return [];
    
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
  
  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container py-8">
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
      
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs 
        defaultValue={tabFromUrl || "overview"} 
        className="w-full"
        onValueChange={(value) => {
          // Update URL when tab changes without forcing a page reload
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('tab', value);
          window.history.pushState({}, '', newUrl.toString());
        }}
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="advertisements" className="flex items-center">
            <DollarSignIcon className="h-4 w-4 mr-1 text-green-600" />
            Ad Overview
            {pendingAdsCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-800 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {pendingAdsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-green-50 border-2 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-green-800">
                  <DollarSignIcon className="mr-2 h-5 w-5 text-green-600" />
                  Advertisement Management
                </CardTitle>
                <CardDescription>Review and approve ad submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-green-800">
                    {pendingAdsCount > 0 ? pendingAdsCount : 'No'} Pending Ads
                  </div>
                  {pendingAdsCount > 0 && (
                    <Badge variant="destructive" className="ml-3 px-3 py-1">
                      <BellIcon className="h-3 w-3 mr-1" /> Needs attention
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="default" 
                    size="lg" 
                    className={`bg-green-600 hover:bg-green-700 text-white font-medium ${pendingAdsCount > 0 ? 'animate-pulse' : ''}`}
                    onClick={() => navigate('/admin/advertisements')}
                  >
                    <DollarSignIcon className="mr-2 h-5 w-5" />
                    {pendingAdsCount > 0 ? 'Review Pending Advertisements' : 'Manage Advertisements'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Articles</CardTitle>
                <CardDescription>Manage published content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42</div>
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => navigate('/admin/articles')}
                  >
                    View All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => navigate('/admin/articles/new')}
                  >
                    <PlusIcon className="mr-1 h-3 w-3" />
                    New
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Users</CardTitle>
                <CardDescription>User management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">156</div>
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => navigate('/admin/users')}
                  >
                    Manage Users
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Subscription Revenue</CardTitle>
                <CardDescription>Monthly recurring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$328</div>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <BarChart3Icon className="h-3 w-3 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center text-sm">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FileTextIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">New article published</p>
                      <p className="text-gray-500">Webb Telescope Discovers New Exoplanet</p>
                      <p className="text-gray-400 text-xs">2 hours ago</p>
                    </div>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <UsersIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">New user registered</p>
                      <p className="text-gray-500">astronautX</p>
                      <p className="text-gray-400 text-xs">4 hours ago</p>
                    </div>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <ImageIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">New astronomy photo submitted</p>
                      <p className="text-gray-500">Andromeda Galaxy</p>
                      <p className="text-gray-400 text-xs">Yesterday</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/articles/new')}
                  >
                    <FileTextIcon className="h-5 w-5 mb-2" />
                    <span>New Article</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/categories-tags')}
                  >
                    <TagIcon className="h-5 w-5 mb-2" />
                    <span>Tags & Categories</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/emergency-banner')}
                  >
                    <AlertOctagonIcon className="h-5 w-5 mb-2" />
                    <span>Emergency Banner</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/astronomy-photos')}
                  >
                    <ImageIcon className="h-5 w-5 mb-2" />
                    <span>Approve Photos</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/job-listings')}
                  >
                    <BriefcaseIcon className="h-5 w-5 mb-2" />
                    <span>Job Listings</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/api-keys')}
                  >
                    <KeyIcon className="h-5 w-5 mb-2" />
                    <span>API Keys</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <div className="space-y-6">
            <Tabs 
              defaultValue={subTabFromUrl || "published"} 
              className="w-full"
              onValueChange={(value) => {
                // Update URL when subtab changes without forcing a page reload
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('subtab', value);
                window.history.pushState({}, '', newUrl.toString());
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="published">Published Content</TabsTrigger>
                <TabsTrigger value="drafts">Draft Management</TabsTrigger>
                <TabsTrigger value="content_status">Content Status</TabsTrigger>
              </TabsList>
              <TabsContent value="published">
                <div className="mt-4">
                  <PublishedContent />
                </div>
              </TabsContent>
              <TabsContent value="drafts">
                <div className="mt-4">
                  <DraftManagement />
                </div>
              </TabsContent>
              <TabsContent value="content_status">
                <div className="mt-4">
                  {articlesLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Tabs defaultValue="all" className="w-full">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
                        <TabsList className="grid grid-cols-5 max-w-md mx-auto">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="needs_edits" className="flex gap-2 items-center">
                            <AlertTriangleIcon className="h-4 w-4" /> Needs Edits
                          </TabsTrigger>
                          <TabsTrigger value="good_to_publish" className="flex gap-2 items-center">
                            <CheckCircleIcon className="h-4 w-4" /> Good to Publish
                          </TabsTrigger>
                          <TabsTrigger value="do_not_publish" className="flex gap-2 items-center">
                            <XCircle className="h-4 w-4" /> Do Not Publish
                          </TabsTrigger>
                          <TabsTrigger value="published">Published</TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="all">
                        {Array.isArray(articles) && renderArticleTable(articles)}
                      </TabsContent>
                      <TabsContent value="needs_edits">
                        {Array.isArray(articles) && renderArticleTable(getArticlesByStatus('needs_edits'))}
                      </TabsContent>
                      <TabsContent value="good_to_publish">
                        {Array.isArray(articles) && renderArticleTable(getArticlesByStatus('good_to_publish'))}
                      </TabsContent>
                      <TabsContent value="do_not_publish">
                        {Array.isArray(articles) && renderArticleTable(getArticlesByStatus('do_not_publish'))}
                      </TabsContent>
                      <TabsContent value="published">
                        {Array.isArray(articles) && renderArticleTable(getArticlesByStatus('published'))}
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage all content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/articles/new')}
                  >
                    <FileTextIcon className="h-5 w-5 mb-2" />
                    <span>New Article</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/categories-tags')}
                  >
                    <TagIcon className="h-5 w-5 mb-2" />
                    <span>Tags & Categories</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/emergency-banner')}
                  >
                    <AlertOctagonIcon className="h-5 w-5 mb-2" />
                    <span>Emergency Banner</span>
                  </Button>
                  {/* Content Status button removed as functionality is integrated in the dashboard */}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Advertisement Management</CardTitle>
                <CardDescription>Approve and manage advertisements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Review pending advertisements and manage existing ads</p>
                    <Button 
                      variant="default" 
                      onClick={() => navigate('/admin/advertisements')}
                      className="gap-2"
                    >
                      <DollarSignIcon className="h-4 w-4" />
                      Manage Advertisements
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-orange-100 text-orange-800 text-sm p-3 rounded-lg">
                      <p className="font-semibold">Pending Approval</p>
                      <p className="text-2xl font-bold mt-1">New Ads</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2 text-blue-600" />
                User Management
              </CardTitle>
              <CardDescription>Manage user accounts, roles, and membership tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advertisements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSignIcon className="h-5 w-5 mr-2 text-green-600" />
                Advertisement Overview
              </CardTitle>
              <CardDescription>Quick overview of advertisement status and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 flex items-center">
                      <span className="bg-amber-200 p-2 rounded-full mr-2">
                        <BellIcon className="h-5 w-5 text-amber-600" />
                      </span>
                      Pending Approval
                    </h3>
                    <p className="text-3xl font-bold mt-2">{pendingAdsCount}</p>
                    <p className="text-sm text-amber-700 mt-1">Waiting for review</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 flex items-center">
                      <span className="bg-green-200 p-2 rounded-full mr-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </span>
                      Active Ads
                    </h3>
                    <p className="text-3xl font-bold mt-2">
                      {Array.isArray(advertisements) 
                        ? advertisements.filter((ad: any) => 
                            ad && ad.isApproved && 
                            new Date(ad.startDate) <= new Date() && 
                            new Date(ad.endDate) >= new Date()
                          ).length 
                        : 0}
                    </p>
                    <p className="text-sm text-green-700 mt-1">Currently running</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 flex items-center">
                      <span className="bg-blue-200 p-2 rounded-full mr-2">
                        <BarChart3Icon className="h-5 w-5 text-blue-600" />
                      </span>
                      Total Revenue
                    </h3>
                    <p className="text-3xl font-bold mt-2">
                      ${Array.isArray(advertisements) 
                        ? advertisements
                            .filter((ad: any) => ad && ad.isApproved)
                            .reduce((sum: number, ad: any) => {
                              const price = ad.price ? Number(ad.price) / 100 : 0;
                              return sum + (isNaN(price) ? 0 : price);
                            }, 0)
                            .toFixed(2)
                        : '0.00'}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">From approved ads</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 mt-8">
                  <Button 
                    size="lg" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/admin/advertisements')}
                  >
                    <DollarSignIcon className="mr-2 h-5 w-5" />
                    Go to Ad Management Console
                  </Button>
                  
                  {pendingAdsCount > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="text-amber-800 font-semibold flex items-center">
                        <AlertTriangleIcon className="h-5 w-5 mr-2 text-amber-600" />
                        Important Note
                      </h4>
                      <p className="text-amber-700 mt-1">
                        There are {pendingAdsCount} advertisements waiting for your review. 
                        Please use the sidebar <b>Ad Management</b> link or the button above to access the complete
                        ad management interface.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="media" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>Manage uploads and media</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Media library tab content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>Configure site settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settings tab content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;