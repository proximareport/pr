import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  BellIcon,
  Settings,
  ClockIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Newspaper,
  Edit3,
  PieChart,
  Layers,
  Compass,
  Clock
} from 'lucide-react';

// Import all tab components
import UserManagement from './UserManagement';
import MediaLibraryTab from './MediaLibraryTab';
import AdvertisementTab from './AdvertisementTab';
import EmergencyBannerTab from './EmergencyBannerTab';
import TaxonomyTab from './TaxonomyTab';
import SiteSettingsForm from '@/components/admin/SiteSettingsForm';
import DraftManagement from './DraftManagement';
import PublishedContent from './PublishedContent';

// Types
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

function NewAdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse URL query parameters for tab selection
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  
  // Get saved tab from localStorage or use URL parameter
  const getSavedTab = () => {
    const savedTab = localStorage.getItem('adminActiveTab');
    return tabFromUrl || savedTab || "dashboard";
  };
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>(getSavedTab());
  
  // Effect to handle URL parameter changes
  useEffect(() => {
    // Update active tab state when URL parameters change
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
      localStorage.setItem('adminActiveTab', tabFromUrl);
    }
  }, [location]); // dependency on location to detect URL changes
  
  // Function to set active tab and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Save to localStorage for persistence
    localStorage.setItem('adminActiveTab', value);
    
    // Update URL when tab changes without forcing a page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', value);
    window.history.pushState({tab: value}, '', newUrl.toString());
  };
  
  // Fetch data for dashboard
  const { data: articles = [], isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    retry: false,
    enabled: !!isAdmin
  });
  
  const { data: advertisements = [], isLoading: adsLoading } = useQuery({
    queryKey: ['/api/advertisements/all'],
    retry: false,
    enabled: !!isAdmin
  });
  
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    retry: false,
    enabled: !!isAdmin
  });
  
  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['/api/media'],
    retry: false,
    enabled: !!isAdmin
  });
  
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
    enabled: !!isAdmin
  });
  
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['/api/tags'],
    retry: false,
    enabled: !!isAdmin
  });
  
  // Calculate dashboard statistics
  const stats = {
    totalArticles: Array.isArray(articles) ? articles.length : 0,
    publishedArticles: Array.isArray(articles) ? articles.filter(a => a.status === 'published').length : 0,
    draftArticles: Array.isArray(articles) ? articles.filter(a => a.status === 'draft').length : 0,
    needsEditsArticles: Array.isArray(articles) ? articles.filter(a => a.status === 'needs_edits').length : 0,
    pendingAds: Array.isArray(advertisements) ? advertisements.filter((ad: any) => !ad.isApproved).length : 0,
    totalUsers: Array.isArray(users) ? users.length : 0,
    totalMedia: Array.isArray(mediaItems) ? mediaItems.length : 0,
    totalCategories: Array.isArray(categories) ? categories.length : 0,
    totalTags: Array.isArray(tags) ? tags.length : 0,
    // Get recent activity - latest 5 articles
    recentArticles: Array.isArray(articles) 
      ? [...articles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)
      : []
  };
  
  // Date formatting helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-700 hover:bg-green-800 text-white">Published</Badge>;
      case 'draft':
        return <Badge className="bg-gray-600 hover:bg-gray-700 text-white">Draft</Badge>;
      case 'needs_edits':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Needs Edits</Badge>;
      case 'good_to_publish':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Ready to Publish</Badge>;
      case 'do_not_publish':
        return <Badge className="bg-red-600 hover:bg-red-700 text-white">Do Not Publish</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Calculate days since last publish
  const lastPublishedDate = Array.isArray(articles) 
    ? articles
        .filter(a => a.publishedAt)
        .sort((a, b) => 
          (new Date(b.publishedAt || 0)).getTime() - (new Date(a.publishedAt || 0)).getTime()
        )[0]?.publishedAt
    : null;
  
  const daysSinceLastPublish = lastPublishedDate 
    ? Math.floor((new Date().getTime() - new Date(lastPublishedDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your content, users, and site settings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              asChild 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Link href="/admin/articles/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Article
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main navigation tabs */}
      <div className="sticky top-0 z-10 bg-[#0D0D17] border-b border-gray-800 mb-6 pb-2">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="bg-gray-900 p-1 w-full flex flex-wrap justify-start overflow-x-auto hide-scrollbar">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600">
              <BarChart3Icon className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-blue-600">
              <Newspaper className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
              <UsersIcon className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="taxonomy" className="data-[state=active]:bg-blue-600">
              <TagIcon className="h-4 w-4 mr-2" />
              Categories & Tags
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-blue-600">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="advertisements" className="data-[state=active]:bg-blue-600 relative">
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              Advertisements
              {stats.pendingAds > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pendingAds}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-blue-600">
              <AlertOctagonIcon className="h-4 w-4 mr-2" />
              Emergency Banner
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard overview */}
          <TabsContent value="dashboard" className="mt-6 space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-200 flex items-center">
                    <FileTextIcon className="h-5 w-5 mr-2 text-blue-400" />
                    Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{stats.totalArticles}</span>
                      <span className="text-sm text-gray-400">Total Articles</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{stats.publishedArticles}</span>
                      <span className="text-sm text-gray-400">Published</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Published</span>
                      <span className="text-white">{stats.publishedArticles}/{stats.totalArticles}</span>
                    </div>
                    <Progress value={(stats.publishedArticles / Math.max(stats.totalArticles, 1)) * 100} className="h-2 bg-gray-700" />
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" asChild className="w-full mt-2 border-gray-700 text-gray-300">
                    <Link href="?tab=content">Manage Content</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-200 flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-indigo-400" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
                      <span className="text-sm text-gray-400">Total Users</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{Array.isArray(users) ? users.filter(u => u.role === 'author').length : 0}</span>
                      <span className="text-sm text-gray-400">Authors</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">User Types</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600">Admin: {Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0}</Badge>
                      <Badge className="bg-green-600">Author: {Array.isArray(users) ? users.filter(u => u.role === 'author').length : 0}</Badge>
                      <Badge className="bg-purple-600">User: {Array.isArray(users) ? users.filter(u => u.role === 'user').length : 0}</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" asChild className="w-full mt-2 border-gray-700 text-gray-300">
                    <Link href="?tab=users">Manage Users</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-200 flex items-center">
                    <TagIcon className="h-5 w-5 mr-2 text-green-400" />
                    Taxonomy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{stats.totalCategories}</span>
                      <span className="text-sm text-gray-400">Categories</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{stats.totalTags}</span>
                      <span className="text-sm text-gray-400">Tags</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-2">Top Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(categories) && categories.slice(0, 3).map(category => (
                        <Badge key={category.id} variant="secondary" className="bg-gray-800">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" asChild className="w-full mt-2 border-gray-700 text-gray-300">
                    <Link href="?tab=taxonomy">Manage Taxonomy</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-200 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-amber-400" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{daysSinceLastPublish ?? '-'}</span>
                      <span className="text-sm text-gray-400">Days Since Publish</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-white">{stats.draftArticles}</span>
                      <span className="text-sm text-gray-400">Drafts</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-2">Articles Needing Attention</div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-600">Needs Edits: {stats.needsEditsArticles}</Badge>
                      <Badge className="bg-red-600">Not Published: {stats.draftArticles}</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" asChild className="w-full mt-2 border-gray-700 text-gray-300">
                    <Link href="?tab=content">View Content</Link>
                  </Button>
                </CardFooter>
              </Card>
            </section>
            
            {/* Recent activity section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-blue-400" />
                    Recent Articles
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest content updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recentArticles.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentArticles.map(article => (
                        <div key={article.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white truncate">{article.title}</h3>
                              {getStatusBadge(article.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-400">Updated: {formatDate(article.updatedAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline" className="h-8 p-0 px-2 rounded-md bg-transparent border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-600">
                              <Link href={`/article/${article.slug}`}>
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="h-8 p-0 px-2 rounded-md bg-transparent border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-600">
                              <Link href={`/admin/articles/edit/${article.id}`}>
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      No recent articles found
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full border-gray-700 text-gray-300">
                    <Link href="?tab=content">View All Articles</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-200 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-400" />
                    Pending Tasks
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Items that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.pendingAds > 0 && (
                      <Alert className="bg-gray-800 border-amber-700">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <AlertDescription className="text-gray-300">
                          {stats.pendingAds} advertisement{stats.pendingAds !== 1 ? 's' : ''} pending approval
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {stats.needsEditsArticles > 0 && (
                      <Alert className="bg-gray-800 border-yellow-700">
                        <Edit3 className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-gray-300">
                          {stats.needsEditsArticles} article{stats.needsEditsArticles !== 1 ? 's' : ''} need editing
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {daysSinceLastPublish !== null && daysSinceLastPublish > 7 && (
                      <Alert className="bg-gray-800 border-blue-700">
                        <Compass className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-gray-300">
                          {daysSinceLastPublish} days since last published article
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {stats.pendingAds === 0 && stats.needsEditsArticles === 0 && (daysSinceLastPublish === null || daysSinceLastPublish <= 7) && (
                      <Alert className="bg-gray-800 border-green-700">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <AlertDescription className="text-gray-300">
                          All tasks are up to date!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {stats.pendingAds > 0 && (
                    <Button asChild variant="outline" size="sm" className="w-full border-gray-700 text-gray-300">
                      <Link href="?tab=advertisements">Review Advertisements</Link>
                    </Button>
                  )}
                  
                  {stats.needsEditsArticles > 0 && (
                    <Button asChild variant="outline" size="sm" className="w-full border-gray-700 text-gray-300">
                      <Link href="?tab=content">Edit Articles</Link>
                    </Button>
                  )}
                  
                  <Button asChild variant="default" size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/admin/articles/new">Create New Article</Link>
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </TabsContent>
          
          {/* Content Management */}
          <TabsContent value="content" className="mt-6">
            <Tabs defaultValue="published">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Content Management</h2>
                <TabsList>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="all">All Articles</TabsTrigger>
                </TabsList>
              </div>
                
              <TabsContent value="published">
                <PublishedContent />
              </TabsContent>
              
              <TabsContent value="drafts">
                <DraftManagement />
              </TabsContent>
              
              <TabsContent value="all">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">All Articles</h3>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/admin/articles/new">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Article
                    </Link>
                  </Button>
                </div>
                
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full grid grid-cols-5 mb-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="needs_edits" className="flex gap-2 items-center">
                      <AlertTriangle className="h-4 w-4" /> Needs Edits
                    </TabsTrigger>
                    <TabsTrigger value="good_to_publish" className="flex gap-2 items-center">
                      <CheckCircle2 className="h-4 w-4" /> Ready to Publish
                    </TabsTrigger>
                    <TabsTrigger value="do_not_publish" className="flex gap-2 items-center">
                      <XCircle className="h-4 w-4" /> Do Not Publish
                    </TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    {articlesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <PublishedContent showAll={true} />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="needs_edits">
                    <PublishedContent statusFilter="needs_edits" />
                  </TabsContent>
                  
                  <TabsContent value="good_to_publish">
                    <PublishedContent statusFilter="good_to_publish" />
                  </TabsContent>
                  
                  <TabsContent value="do_not_publish">
                    <PublishedContent statusFilter="do_not_publish" />
                  </TabsContent>
                  
                  <TabsContent value="published">
                    <PublishedContent statusFilter="published" />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          {/* Users tab */}
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
          
          {/* Categories & Tags */}
          <TabsContent value="taxonomy" className="mt-6">
            <TaxonomyTab />
          </TabsContent>
          
          {/* Media Management */}
          <TabsContent value="media" className="mt-6">
            <MediaLibraryTab />
          </TabsContent>
          
          {/* Advertisements */}
          <TabsContent value="advertisements" className="mt-6">
            <AdvertisementTab />
          </TabsContent>
          
          {/* Emergency Banner */}
          <TabsContent value="emergency" className="mt-6">
            <EmergencyBannerTab />
          </TabsContent>
          
          {/* Site Settings */}
          <TabsContent value="settings" className="mt-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6">Site Settings</h2>
              <SiteSettingsForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default NewAdminDashboard;