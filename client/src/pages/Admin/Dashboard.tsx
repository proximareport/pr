import React, { useEffect } from 'react';
import { useLocation, useRouter } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  FileEditIcon
} from 'lucide-react';
import DraftManagement from './DraftManagement';

function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <DraftManagement />
            
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage all content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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