import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Info,
  LineChart,
  PieChart,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface Advertisement {
  id: number;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  placement: string;
  startDate: string;
  endDate: string;
  userId: number;
  isApproved: boolean;
  status: string;
  createdAt: string;
  impressions: number;
  clicks: number;
  price: number | null;
  paymentStatus: string | null;
  paymentId: string | null;
  adminNotes: string | null;
}

function AdvertiserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  
  // Fetch user's advertisements
  const { data: advertisements, isLoading, isError } = useQuery({
    queryKey: ['/api/advertisements/user'],
    enabled: !!user,
  });
  
  // Function to create a checkout session for an ad
  const checkoutMutation = useMutation({
    mutationFn: async (adId: number) => {
      return await apiRequest('POST', `/api/advertisements/${adId}/checkout`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create checkout session',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive',
      });
    },
  });
  
  const handleCheckout = (adId: number) => {
    checkoutMutation.mutate(adId);
  };
  
  // Get ads by status
  const getPendingAds = () => {
    if (!advertisements) return [];
    return (advertisements as Advertisement[]).filter(ad => 
      ad.status === 'pending' || ad.status === 'approved_pending_payment'
    );
  };
  
  const getActiveAds = () => {
    if (!advertisements) return [];
    return (advertisements as Advertisement[]).filter(ad => 
      ad.status === 'active'
    );
  };
  
  const getRejectedAds = () => {
    if (!advertisements) return [];
    return (advertisements as Advertisement[]).filter(ad => 
      ad.status === 'rejected'
    );
  };
  
  const getCompletedAds = () => {
    if (!advertisements) return [];
    return (advertisements as Advertisement[]).filter(ad => 
      ad.status === 'completed' || ad.status === 'expired'
    );
  };
  
  // Format price from cents to dollars
  const formatPrice = (priceInCents: number | null) => {
    if (priceInCents === null) return 'N/A';
    return `$${(priceInCents / 100).toFixed(2)}`;
  };
  
  // Get status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
      case 'approved_pending_payment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CreditCard className="h-3 w-3 mr-1" /> Payment Required</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get placement name for display
  const getPlacementName = (placement: string) => {
    switch (placement) {
      case 'homepage':
        return 'Homepage';
      case 'sidebar':
        return 'Sidebar';
      case 'article':
        return 'In-Article';
      case 'newsletter':
        return 'Newsletter';
      default:
        return placement;
    }
  };
  
  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Advertiser Dashboard</h1>
          <p className="mb-6">Please log in to manage your advertisements.</p>
          <Button onClick={() => setLocation('/login')}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Advertiser Dashboard</h1>
          <p className="text-muted-foreground">Manage your advertisements and track performance</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/advertisements/user'] })} className="gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button className="gap-1" onClick={() => setLocation('/advertise')}>
            <Plus className="h-4 w-4" /> New Advertisement
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : isError ? (
        <div className="text-center p-12">
          <AlertTriangle className="h-10 w-10 mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Advertisements</h3>
          <p className="mb-4 text-gray-600">There was a problem loading your advertisements. Please try again.</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/advertisements/my'] })}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Dashboard Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{advertisements?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{getActiveAds().length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {advertisements?.reduce((sum: number, ad: Advertisement) => sum + (ad.impressions || 0), 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {advertisements?.reduce((sum: number, ad: Advertisement) => sum + (ad.clicks || 0), 0)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Advertisements Tab View */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Advertisements</CardTitle>
                  <CardDescription>View all your advertisements in one place</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdTable 
                    advertisements={advertisements || []} 
                    formatPrice={formatPrice}
                    getStatusBadge={getStatusBadge}
                    getPlacementName={getPlacementName}
                    onPreview={setPreviewAd}
                    onCheckout={handleCheckout}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Advertisements</CardTitle>
                  <CardDescription>Ads waiting for approval or payment</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdTable 
                    advertisements={getPendingAds()} 
                    formatPrice={formatPrice}
                    getStatusBadge={getStatusBadge}
                    getPlacementName={getPlacementName}
                    onPreview={setPreviewAd}
                    onCheckout={handleCheckout}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Active Advertisements</CardTitle>
                  <CardDescription>Currently running advertisements</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdTable 
                    advertisements={getActiveAds()} 
                    formatPrice={formatPrice}
                    getStatusBadge={getStatusBadge}
                    getPlacementName={getPlacementName}
                    onPreview={setPreviewAd}
                    onCheckout={handleCheckout}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rejected">
              <Card>
                <CardHeader>
                  <CardTitle>Rejected Advertisements</CardTitle>
                  <CardDescription>Advertisements that were rejected by admins</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdTable 
                    advertisements={getRejectedAds()} 
                    formatPrice={formatPrice}
                    getStatusBadge={getStatusBadge}
                    getPlacementName={getPlacementName}
                    onPreview={setPreviewAd}
                    onCheckout={handleCheckout}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Advertisements</CardTitle>
                  <CardDescription>Past advertisements that have completed their run</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdTable 
                    advertisements={getCompletedAds()} 
                    formatPrice={formatPrice}
                    getStatusBadge={getStatusBadge}
                    getPlacementName={getPlacementName}
                    onPreview={setPreviewAd}
                    onCheckout={handleCheckout}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Advertisement Preview Dialog */}
          <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Advertisement Details</DialogTitle>
                <DialogDescription>
                  Created on {previewAd && new Date(previewAd.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Title:</div>
                  <div>{previewAd?.title}</div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Status:</div>
                  <div>{previewAd && getStatusBadge(previewAd.status)}</div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Link URL:</div>
                  <div className="break-all">
                    <a href={previewAd?.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {previewAd?.linkUrl}
                    </a>
                  </div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Placement:</div>
                  <div>{previewAd && getPlacementName(previewAd.placement)}</div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Duration:</div>
                  <div>
                    {previewAd && (
                      <>
                        {new Date(previewAd.startDate).toLocaleDateString()} to {new Date(previewAd.endDate).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Price:</div>
                  <div>{previewAd?.price && formatPrice(previewAd.price)}</div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="font-medium">Performance:</div>
                  <div>
                    <div className="text-sm">
                      <span className="font-medium">{previewAd?.impressions || 0}</span> impressions
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{previewAd?.clicks || 0}</span> clicks
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">
                        {previewAd?.impressions && previewAd?.clicks && previewAd.impressions > 0
                          ? ((previewAd.clicks / previewAd.impressions) * 100).toFixed(2)
                          : '0.00'}%
                      </span> CTR
                    </div>
                  </div>
                </div>
                
                {previewAd?.adminNotes && (
                  <div className="border-t pt-4 mt-4">
                    <div className="font-medium mb-2 text-red-600">Admin Notes:</div>
                    <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-800">
                      {previewAd.adminNotes}
                    </div>
                  </div>
                )}
                
                {previewAd?.imageUrl && (
                  <div className="mt-4">
                    <div className="font-medium mb-2">Image Preview:</div>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={previewAd.imageUrl} 
                        alt={previewAd.title} 
                        className="max-w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Not+Available';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex items-center justify-between">
                {previewAd?.status === 'approved_pending_payment' && (
                  <Button 
                    variant="default"
                    onClick={() => previewAd && handleCheckout(previewAd.id)}
                    disabled={checkoutMutation.isPending}
                    className="gap-1"
                  >
                    <CreditCard className="h-4 w-4" />
                    {checkoutMutation.isPending ? 'Processing...' : 'Complete Payment'}
                  </Button>
                )}
                <Button variant="outline" className="ml-auto" onClick={() => setPreviewAd(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// Sub-component for the Advertisement Table
function AdTable({ 
  advertisements, 
  formatPrice, 
  getStatusBadge, 
  getPlacementName,
  onPreview,
  onCheckout
}: { 
  advertisements: Advertisement[], 
  formatPrice: (price: number | null) => string,
  getStatusBadge: (status: string) => React.ReactNode,
  getPlacementName: (placement: string) => string,
  onPreview: (ad: Advertisement) => void,
  onCheckout: (adId: number) => void
}) {
  if (advertisements.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No advertisements found</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have any advertisements in this category yet.
          </p>
          <div className="mt-6">
            <Link href="/advertise">
              <Button size="sm">Create New Advertisement</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Placement</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Performance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advertisements.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell className="font-medium">{ad.title}</TableCell>
              <TableCell>{getStatusBadge(ad.status)}</TableCell>
              <TableCell>{getPlacementName(ad.placement)}</TableCell>
              <TableCell className="text-right">{formatPrice(ad.price)}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  <span className="text-sm">{ad.impressions} views</span>
                  <span className="text-xs text-gray-500">{ad.clicks} clicks</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => onPreview(ad)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {ad.status === 'approved_pending_payment' && (
                    <Button variant="outline" size="sm" onClick={() => onCheckout(ad.id)}>
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AdvertiserDashboard;