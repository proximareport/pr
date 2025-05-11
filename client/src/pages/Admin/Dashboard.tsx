import React, { useEffect } from 'react';
import { useLocation, useRouter } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
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
  CheckCircleIcon
} from 'lucide-react';
import DraftManagement from './DraftManagement';
import PublishedContent from './PublishedContent';

function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch all advertisements to count pending ones
  const { data: advertisements = [] } = useQuery({
    queryKey: ['/api/advertisements/all'],
    retry: false,
    enabled: !!isAdmin
  });
  
  // Count pending advertisements that need review
  const pendingAdsCount = Array.isArray(advertisements) 
    ? advertisements.filter((ad: any) => !ad.isApproved).length 
    : 0;
  
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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="advertisements" className="flex items-center">
            <DollarSignIcon className="h-4 w-4 mr-1 text-green-600" />
            Advertisements
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
            <Tabs defaultValue="published" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="published">Published Content</TabsTrigger>
                <TabsTrigger value="drafts">Draft Management</TabsTrigger>
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
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => navigate('/admin/content-status')}
                  >
                    <FileEditIcon className="h-5 w-5 mb-2" />
                    <span>Content Status</span>
                  </Button>
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
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p>User management tab content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advertisements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSignIcon className="h-5 w-5 mr-2 text-green-600" />
                Advertisement Management
              </CardTitle>
              <CardDescription>Review, approve, and manage advertisements</CardDescription>
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
                        ? advertisements.filter((ad: any) => ad.isApproved && new Date(ad.startDate) <= new Date() && new Date(ad.endDate) >= new Date()).length 
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
                        ? advertisements.filter((ad: any) => ad.isApproved).reduce((sum: number, ad: any) => sum + (ad.price / (ad.price ? 100 : 1) || 0), 0).toFixed(2)
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
                    Manage All Advertisements
                  </Button>
                  
                  {pendingAdsCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                      onClick={() => navigate('/admin/advertisements')}
                    >
                      <BellIcon className="mr-2 h-5 w-5" />
                      Review Pending Ads ({pendingAdsCount})
                    </Button>
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