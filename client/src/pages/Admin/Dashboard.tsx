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
  XCircle,
  Settings,
  ClockIcon
} from 'lucide-react';
import DraftManagement from './DraftManagement';
import PublishedContent from './PublishedContent';
import UserManagement from './UserManagement';
import MediaLibraryTab from './MediaLibraryTab';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';

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
      return (
        <div className="text-center py-12 px-4 bg-gray-800 rounded-lg border border-dashed border-gray-700">
          <div className="flex flex-col items-center justify-center">
            <FileTextIcon className="h-12 w-12 text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-200 mb-1">No articles found</h3>
            <p className="text-gray-400 mb-4 max-w-md text-center">There are no articles matching the selected criteria.</p>
            <Button onClick={() => navigate('/admin/articles/new')} className="bg-blue-700 hover:bg-blue-800">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Article
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-800">
        <Table>
          <TableHeader className="bg-gray-800">
            <TableRow className="border-b border-gray-700 hover:bg-transparent">
              <TableHead className="font-semibold text-gray-300">Title</TableHead>
              <TableHead className="font-semibold text-gray-300">Author</TableHead>
              <TableHead className="font-semibold text-gray-300">Status</TableHead>
              <TableHead className="font-semibold text-gray-300">Last Updated</TableHead>
              <TableHead className="font-semibold text-gray-300">Published</TableHead>
              <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.map((article: Article) => (
              <TableRow key={article.id} className="hover:bg-gray-800 border-b border-gray-700 transition-colors">
                <TableCell className="font-medium text-gray-100">
                  <div className="max-w-md truncate">{article.title}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {article.authors && article.authors.map((author, idx) => (
                      <span key={author.user.id} className="inline-flex items-center px-2 py-1 bg-gray-700 text-xs rounded-full font-medium text-gray-300">
                        {author.user.username}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(article.status)}</TableCell>
                <TableCell className="text-gray-400">{formatDate(article.updatedAt)}</TableCell>
                <TableCell className="text-gray-400">{formatDate(article.publishedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full bg-transparent border-gray-700 text-gray-400 hover:text-gray-100 hover:bg-gray-800 hover:border-gray-600">
                      <Link href={`/article/${article.slug}`} title="View Article">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full bg-transparent border-gray-700 text-gray-400 hover:text-gray-100 hover:bg-gray-800 hover:border-gray-600">
                      <Link href={`/admin/edit-article/${article.id}`} title="Edit Article">
                        <FileEditIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 rounded-full bg-transparent border-gray-700 text-gray-400 hover:text-gray-100 hover:bg-gray-800 hover:border-gray-600" 
                      onClick={() => openStatusDialog(article)}
                      title="Change Status"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Fetch all advertisements to count pending ones
  const { data: advertisements = [] } = useQuery({
    queryKey: ['/api/advertisements/all'],
    retry: false,
    enabled: !!isAdmin
  });
  
  // Fetch all articles for content status tab
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Status Update Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-xl bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center text-gray-100">
              <CheckCircleIcon className="text-blue-400 h-5 w-5 mr-2" />
              Update Article Status
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-gray-400 mt-1">
              {selectedArticle?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="space-y-4"
            >
              <div className={`flex items-start p-3 rounded-lg ${selectedStatus === 'draft' ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50'} cursor-pointer`} onClick={() => setSelectedStatus('draft')}>
                <RadioGroupItem value="draft" id="draft" className="mt-1" />
                <Label htmlFor="draft" className="flex flex-col ml-3 cursor-pointer">
                  <div className="flex items-center">
                    <Badge className="bg-gray-700 text-gray-200 border-gray-600 font-medium">Draft</Badge>
                  </div>
                  <span className="mt-1 text-sm text-gray-400">Work in progress. Article is being developed and is not visible to the public.</span>
                </Label>
              </div>
              
              <div className={`flex items-start p-3 rounded-lg ${selectedStatus === 'needs_edits' ? 'bg-yellow-900/40 border border-yellow-700/50' : 'hover:bg-gray-800/50'} cursor-pointer`} onClick={() => setSelectedStatus('needs_edits')}>
                <RadioGroupItem value="needs_edits" id="needs_edits" className="mt-1" />
                <Label htmlFor="needs_edits" className="flex flex-col ml-3 cursor-pointer">
                  <div className="flex items-center">
                    <Badge className="bg-yellow-900/70 text-yellow-200 border-yellow-700 font-medium">Needs Edits</Badge>
                  </div>
                  <span className="mt-1 text-sm text-gray-400">Article requires revisions before it can be approved for publication.</span>
                </Label>
              </div>
              
              <div className={`flex items-start p-3 rounded-lg ${selectedStatus === 'good_to_publish' ? 'bg-blue-900/40 border border-blue-700/50' : 'hover:bg-gray-800/50'} cursor-pointer`} onClick={() => setSelectedStatus('good_to_publish')}>
                <RadioGroupItem value="good_to_publish" id="good_to_publish" className="mt-1" />
                <Label htmlFor="good_to_publish" className="flex flex-col ml-3 cursor-pointer">
                  <div className="flex items-center">
                    <Badge className="bg-blue-900/70 text-blue-200 border-blue-700 font-medium">Good to Publish</Badge>
                  </div>
                  <span className="mt-1 text-sm text-gray-400">Article has been reviewed and approved for publication.</span>
                </Label>
              </div>
              
              <div className={`flex items-start p-3 rounded-lg ${selectedStatus === 'do_not_publish' ? 'bg-red-900/40 border border-red-700/50' : 'hover:bg-gray-800/50'} cursor-pointer`} onClick={() => setSelectedStatus('do_not_publish')}>
                <RadioGroupItem value="do_not_publish" id="do_not_publish" className="mt-1" />
                <Label htmlFor="do_not_publish" className="flex flex-col ml-3 cursor-pointer">
                  <div className="flex items-center">
                    <Badge className="bg-red-900/70 text-red-200 border-red-700 font-medium">Do Not Publish</Badge>
                  </div>
                  <span className="mt-1 text-sm text-gray-400">Content has been rejected and should not be published.</span>
                </Label>
              </div>
              
              <div className={`flex items-start p-3 rounded-lg ${selectedStatus === 'published' ? 'bg-green-900/40 border border-green-700/50' : 'hover:bg-gray-800/50'} cursor-pointer`} onClick={() => setSelectedStatus('published')}>
                <RadioGroupItem value="published" id="published" className="mt-1" />
                <Label htmlFor="published" className="flex flex-col ml-3 cursor-pointer">
                  <div className="flex items-center">
                    <Badge className="bg-green-900/70 text-green-200 border-green-700 font-medium">Published</Badge>
                  </div>
                  <span className="mt-1 text-sm text-gray-400">Article is live and visible to the public on the site.</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter className="flex justify-between sm:justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setSelectedArticle(null)} className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-gray-100">
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending || selectedStatus === selectedArticle?.status}
              className={`${selectedStatus === 'published' ? 'bg-green-700 hover:bg-green-800' : selectedStatus === 'do_not_publish' ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-700 hover:bg-blue-800'}`}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your content, users, and site settings</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-blue-700 hover:bg-blue-800 shadow-sm transition-all font-medium flex items-center gap-2"
            onClick={() => navigate('/admin/articles/new')}
          >
            <PlusIcon className="h-4 w-4" />
            New Article
          </Button>
        </div>
      </div>

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
        <div className="border-b border-gray-700 mb-8">
          <TabsList className="bg-transparent justify-start gap-8">
            <TabsTrigger 
              value="overview" 
              className="text-gray-400 hover:text-gray-200 data-[state=active]:text-blue-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
            >
              <div className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="content" 
              className="text-gray-400 hover:text-gray-200 data-[state=active]:text-blue-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
            >
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                <span>Content</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="advertisements" 
              className="text-gray-400 hover:text-gray-200 data-[state=active]:text-blue-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
            >
              <div className="flex items-center gap-2 relative">
                <DollarSignIcon className="h-4 w-4 text-green-400" />
                <span>Advertisements</span>
                {pendingAdsCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ml-1">
                    {pendingAdsCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="users" 
              className="text-gray-400 hover:text-gray-200 data-[state=active]:text-blue-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
            >
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                <span>Users</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="media" 
              className="text-gray-400 hover:text-gray-200 data-[state=active]:text-blue-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Media</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="settings" 
              className="text-gray-400 hover:text-gray-200 data-[state=active]:text-blue-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ad Management Card */}
            <Card className="rounded-xl border border-gray-800 shadow-md overflow-hidden bg-gray-900">
              <div className={`h-2 w-full ${pendingAdsCount > 0 ? 'bg-amber-600' : 'bg-emerald-600'}`}></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center text-xl text-gray-100">
                  <div className={`p-3 rounded-xl ${pendingAdsCount > 0 ? 'bg-amber-900/60 text-amber-400' : 'bg-emerald-900/60 text-emerald-400'} mr-4 flex-shrink-0`}>
                    <DollarSignIcon className="h-6 w-6" />
                  </div>
                  <div>
                    Advertisement Management
                    {pendingAdsCount > 0 && (
                      <Badge className="ml-2 bg-red-700 text-gray-100">
                        {pendingAdsCount} pending
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-base ml-[3.25rem]">
                  Review and approve advertisement submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {pendingAdsCount > 0 ? (
                  <div className="flex items-center mb-6 bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4 flex-shrink-0">
                      <AlertTriangleIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-800">Action Required</h4>
                      <p className="text-amber-700 text-sm">
                        You have {pendingAdsCount} advertisement{pendingAdsCount !== 1 ? 's' : ''} waiting for approval.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center mb-6 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4 flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-emerald-800">All Caught Up</h4>
                      <p className="text-emerald-700 text-sm">
                        No pending advertisements requiring your attention.
                      </p>
                    </div>
                  </div>
                )}
                <Button 
                  variant="default" 
                  className={`w-full ${pendingAdsCount > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-medium py-6`}
                  onClick={() => navigate('/admin/advertisements')}
                >
                  {pendingAdsCount > 0 ? (
                    <>
                      <BellIcon className="mr-2 h-5 w-5" />
                      Review Pending Advertisements
                    </>
                  ) : (
                    <>
                      <DollarSignIcon className="mr-2 h-5 w-5" />
                      Manage Advertisements
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {/* Articles Card */}
            <Card className="rounded-xl border border-gray-200 shadow-md overflow-hidden bg-white">
              <div className="h-2 w-full bg-blue-500"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600 mr-4 flex-shrink-0">
                    <FileTextIcon className="h-6 w-6" />
                  </div>
                  <div>Content Management</div>
                </CardTitle>
                <CardDescription className="text-base ml-[3.25rem]">
                  Monitor and manage all site content
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {(articles as Article[]).filter(a => a.status === 'published').length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Published</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-amber-400 mb-1">
                      {(articles as Article[]).filter(a => a.status === 'draft').length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Drafts</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {(articles as Article[]).filter(a => a.status === 'good_to_publish').length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Ready</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-orange-400 mb-1">
                      {(articles as Article[]).filter(a => a.status === 'needs_edits').length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Need Review</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-blue-700 hover:bg-blue-800 text-white py-5"
                    onClick={() => navigate('/admin/articles/new')}
                  >
                    <PlusIcon className="mr-2 h-5 w-5" />
                    New Article
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-blue-400 border-blue-800 hover:bg-blue-900/50 py-5"
                    onClick={() => navigate('/admin/articles')}
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Users Card */}
            <Card className="rounded-xl border border-gray-800 shadow-md overflow-hidden bg-gray-900">
              <div className="h-2 w-full bg-purple-600"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center text-xl text-gray-100">
                  <div className="p-3 rounded-xl bg-purple-900/60 text-purple-400 mr-4 flex-shrink-0">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                  <div>User Management</div>
                </CardTitle>
                <CardDescription className="text-base ml-[3.25rem] text-gray-400">
                  Manage accounts and user permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-300">User Summary</h4>
                    <Badge variant="outline" className="font-semibold bg-purple-900/50 text-purple-300 border-purple-700">
                      {8} Total
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center p-2.5 bg-gray-800/70 rounded-md border border-gray-700">
                      <div className="p-2 rounded-full bg-red-900/60 text-red-400 mr-3 flex-shrink-0">
                        <UsersIcon className="h-5 w-5" />
                      </div>
                      <span className="text-gray-300 flex-1 font-medium">Administrators</span>
                      <Badge className="bg-red-900/70 text-red-300 border-red-700">
                        1
                      </Badge>
                    </div>
                    
                    <div className="flex items-center p-2.5 bg-gray-800/70 rounded-md border border-gray-700">
                      <div className="p-2 rounded-full bg-blue-900/60 text-blue-400 mr-3 flex-shrink-0">
                        <FileEditIcon className="h-5 w-5" />
                      </div>
                      <span className="text-gray-300 flex-1 font-medium">Editors</span>
                      <Badge className="bg-blue-900/70 text-blue-300 border-blue-700">
                        2
                      </Badge>
                    </div>
                    
                    <div className="flex items-center p-2.5 bg-gray-800/70 rounded-md border border-gray-700">
                      <div className="p-2 rounded-full bg-green-900/60 text-green-400 mr-3 flex-shrink-0">
                        <FileTextIcon className="h-5 w-5" />
                      </div>
                      <span className="text-gray-300 flex-1 font-medium">Authors</span>
                      <Badge className="bg-green-900/70 text-green-300 border-green-700">
                        5
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="default" 
                  className="bg-purple-700 hover:bg-purple-800 text-white font-medium w-full py-5"
                  onClick={() => navigate('/admin/users')}
                >
                  <UsersIcon className="mr-2 h-5 w-5" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl border border-gray-800 shadow-md overflow-hidden bg-gray-900">
              <div className="h-2 w-full bg-green-600"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center text-xl text-gray-100">
                  <div className="p-3 rounded-xl bg-green-900/60 text-green-400 mr-4 flex-shrink-0">
                    <DollarSignIcon className="h-6 w-6" />
                  </div>
                  <div>Subscription Revenue</div>
                </CardTitle>
                <CardDescription className="text-base ml-[3.25rem] text-gray-400">
                  Monthly recurring revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-gray-800/80 p-6 rounded-lg border border-gray-700 flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-gray-200">$328</div>
                    <div className="flex items-center text-sm text-green-400 mt-2 font-medium">
                      <BarChart3Icon className="h-4 w-4 mr-1" />
                      <span>+12% from last month</span>
                    </div>
                  </div>
                  <div className="h-16 w-16 bg-green-900/60 rounded-full flex items-center justify-center">
                    <DollarSignIcon className="h-8 w-8 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Card className="rounded-xl border border-gray-800 shadow-md overflow-hidden bg-gray-900">
              <div className="h-2 w-full bg-gray-700"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center text-xl text-gray-100">
                  <div className="p-3 rounded-xl bg-gray-800 text-gray-300 mr-4 flex-shrink-0">
                    <BellIcon className="h-6 w-6" />
                  </div>
                  <div>Recent Activity</div>
                </CardTitle>
                <CardDescription className="text-base ml-[3.25rem] text-gray-400">
                  Latest site updates and events
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <li className="flex p-3 bg-gray-800/70 rounded-lg border border-gray-700">
                    <div className="bg-blue-900/50 p-3 rounded-xl mr-4 flex-shrink-0">
                      <FileTextIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-100">New article published</p>
                      <p className="text-gray-400 mt-0.5">Webb Telescope Discovers New Exoplanet</p>
                      <p className="text-gray-500 text-xs mt-1.5 flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" /> 2 hours ago
                      </p>
                    </div>
                  </li>
                  <li className="flex p-3 bg-gray-800/70 rounded-lg border border-gray-700">
                    <div className="bg-green-900/50 p-3 rounded-xl mr-4 flex-shrink-0">
                      <UsersIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-100">New user registered</p>
                      <p className="text-gray-400 mt-0.5">astronautX</p>
                      <p className="text-gray-500 text-xs mt-1.5 flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" /> 4 hours ago
                      </p>
                    </div>
                  </li>
                  <li className="flex p-3 bg-gray-800/70 rounded-lg border border-gray-700">
                    <div className="bg-violet-900/50 p-3 rounded-xl mr-4 flex-shrink-0">
                      <ImageIcon className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-100">New astronomy photo submitted</p>
                      <p className="text-gray-400 mt-0.5">Andromeda Galaxy</p>
                      <p className="text-gray-500 text-xs mt-1.5 flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" /> Yesterday
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl border border-gray-800 shadow-md overflow-hidden bg-gray-900">
              <div className="h-2 w-full bg-indigo-500"></div>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center text-xl text-gray-100">
                  <div className="p-3 rounded-xl bg-indigo-900/60 text-indigo-400 mr-4 flex-shrink-0">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>Quick Actions</div>
                </CardTitle>
                <CardDescription className="text-base ml-[3.25rem] text-gray-400">
                  Shortcuts to common tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="flex flex-col items-center justify-center p-0 h-auto bg-blue-700 hover:bg-blue-800 shadow-sm transition-all rounded-lg overflow-hidden border-0"
                    onClick={() => navigate('/admin/articles/new')}
                  >
                    <div className="w-full flex flex-col items-center py-5">
                      <FileTextIcon className="h-8 w-8 mb-3" />
                      <span className="font-medium">New Article</span>
                    </div>
                  </Button>
                  
                  <Button
                    className="flex flex-col items-center justify-center p-0 h-auto bg-purple-700 hover:bg-purple-800 shadow-sm transition-all rounded-lg overflow-hidden border-0"
                    onClick={() => navigate('/admin/categories-tags')}
                  >
                    <div className="w-full flex flex-col items-center py-5">
                      <TagIcon className="h-8 w-8 mb-3" />
                      <span className="font-medium">Tags & Categories</span>
                    </div>
                  </Button>
                  
                  <Button
                    className="flex flex-col items-center justify-center p-0 h-auto bg-amber-700 hover:bg-amber-800 shadow-sm transition-all rounded-lg overflow-hidden border-0"
                    onClick={() => navigate('/admin/emergency-banner')}
                  >
                    <div className="w-full flex flex-col items-center py-5">
                      <AlertOctagonIcon className="h-8 w-8 mb-3" />
                      <span className="font-medium">Emergency Banner</span>
                    </div>
                  </Button>
                  
                  <Button
                    className="flex flex-col items-center justify-center p-0 h-auto bg-teal-700 hover:bg-teal-800 shadow-sm transition-all rounded-lg overflow-hidden border-0"
                    onClick={() => navigate('/admin/astronomy-photos')}
                  >
                    <div className="w-full flex flex-col items-center py-5">
                      <ImageIcon className="h-8 w-8 mb-3" />
                      <span className="font-medium">Approve Photos</span>
                    </div>
                  </Button>
                  <Button
                    className="flex flex-col items-center justify-center p-0 h-auto bg-green-700 hover:bg-green-800 shadow-sm transition-all rounded-lg overflow-hidden border-0"
                    onClick={() => navigate('/admin/job-listings')}
                  >
                    <div className="w-full flex flex-col items-center py-5">
                      <BriefcaseIcon className="h-8 w-8 mb-3" />
                      <span className="font-medium">Job Listings</span>
                    </div>
                  </Button>
                  <Button
                    className="flex flex-col items-center justify-center p-0 h-auto bg-slate-700 hover:bg-slate-800 shadow-sm transition-all rounded-lg overflow-hidden border-0"
                    onClick={() => navigate('/admin/api-keys')}
                  >
                    <div className="w-full flex flex-col items-center py-5">
                      <KeyIcon className="h-8 w-8 mb-3" />
                      <span className="font-medium">API Keys</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="mt-8">
          <div className="space-y-8">
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
              <div className="border-b border-gray-200 mb-6">
                <TabsList className="bg-transparent w-full justify-start gap-8">
                  <TabsTrigger 
                    value="published" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
                  >
                    Published Content
                  </TabsTrigger>
                  <TabsTrigger 
                    value="drafts" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
                  >
                    Draft Management
                  </TabsTrigger>
                  <TabsTrigger 
                    value="content_status" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-1 pb-3"
                  >
                    Content Status
                  </TabsTrigger>
                </TabsList>
              </div>
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
          <MediaLibraryTab />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <SiteSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;