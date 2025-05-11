import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  CheckCircle, 
  CreditCard, 
  Eye, 
  LineChart, 
  Settings, 
  XCircle,
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  paymentStatus: string;
  paymentId: string | null;
  price: number | null;
  adminNotes: string | null;
  createdAt: string;
  impressions: number;
  clicks: number;
}

function AdvertiserDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?returnTo=/advertiser-dashboard');
    }
  }, [authLoading, isAuthenticated, navigate]);
  
  // Get user's advertisements
  const { data: advertisements = [], isLoading: adsLoading } = useQuery({
    queryKey: ['/api/advertisements/user'],
    enabled: isAuthenticated,
  });
  
  // Cancel advertisement
  const cancelMutation = useMutation({
    mutationFn: async (adId: number) => {
      return await apiRequest('POST', `/api/advertisements/${adId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/user'] });
      toast({
        title: 'Success',
        description: 'Advertisement cancelled successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel advertisement',
        variant: 'destructive',
      });
    },
  });
  
  // Pay for advertisement mutation
  const payMutation = useMutation({
    mutationFn: async (adId: number) => {
      return await apiRequest('POST', `/api/advertisements/${adId}/pay`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/user'] });
      // Redirect to payment page if needed
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: 'Success',
          description: 'Payment processed successfully',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Payment failed. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Filter advertisements by status
  const getPendingAds = () => advertisements.filter((ad: Advertisement) => 
    ad.status === 'pending' || (!ad.isApproved && ad.status !== 'rejected')
  );
  
  const getActiveAds = () => {
    const now = new Date();
    return advertisements.filter((ad: Advertisement) => 
      (ad.isApproved || ad.status === 'approved') && 
      new Date(ad.startDate) <= now && 
      new Date(ad.endDate) >= now
    );
  };
  
  const getCompletedAds = () => {
    const now = new Date();
    return advertisements.filter((ad: Advertisement) => 
      (ad.status === 'completed' || new Date(ad.endDate) < now)
    );
  };
  
  const getRejectedAds = () => advertisements.filter((ad: Advertisement) => 
    ad.status === 'rejected' || (ad.isApproved === false && ad.adminNotes)
  );
  
  // Helper functions
  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case 'homepage': return 'Homepage Banner';
      case 'sidebar': return 'Sidebar';
      case 'article': return 'In-Article';
      case 'newsletter': return 'Newsletter';
      default: return placement;
    }
  };
  
  const getStatusBadge = (ad: Advertisement) => {
    // Determine status based on all ad properties
    if (ad.status === 'rejected' || (!ad.isApproved && ad.adminNotes)) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    } else if (ad.isApproved || ad.status === 'approved') {
      const now = new Date();
      if (new Date(ad.endDate) < now) {
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      } else if (new Date(ad.startDate) > now) {
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
      } else {
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      }
    } else if (ad.paymentStatus === 'pending') {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Payment Needed</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Approval</Badge>;
    }
  };
  
  const canPay = (ad: Advertisement) => {
    return ad.paymentStatus === 'pending' && ad.price && ad.price > 0;
  };
  
  const canCancel = (ad: Advertisement) => {
    return ad.status !== 'completed' && ad.status !== 'rejected' && 
           new Date(ad.endDate) > new Date();
  };
  
  const handlePreview = (ad: Advertisement) => {
    setPreviewAd(ad);
  };
  
  const handleCancel = (adId: number) => {
    const isConfirmed = window.confirm('Are you sure you want to cancel this advertisement? This action cannot be undone.');
    if (isConfirmed) {
      cancelMutation.mutate(adId);
    }
  };
  
  const handlePay = (adId: number) => {
    payMutation.mutate(adId);
  };
  
  const renderAdTable = (ads: Advertisement[]) => {
    if (adsLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    
    if (ads.length === 0) {
      return <div className="text-center py-8 text-gray-500">No advertisements found</div>;
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Placement</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Metrics</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell className="font-medium">{ad.title}</TableCell>
              <TableCell>{getPlacementLabel(ad.placement)}</TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>Start: {new Date(ad.startDate).toLocaleDateString()}</div>
                  <div>End: {new Date(ad.endDate).toLocaleDateString()}</div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(ad)}
                {ad.paymentStatus && ad.paymentStatus !== 'paid' && (
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-100">
                      {ad.paymentStatus === 'pending' ? 'Payment Needed' : ad.paymentStatus}
                    </Badge>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>Impressions: {ad.impressions.toLocaleString()}</div>
                  <div>Clicks: {ad.clicks.toLocaleString()}</div>
                  <div className="text-gray-500 mt-1">
                    CTR: {ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}%
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handlePreview(ad)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {canPay(ad) && (
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => handlePay(ad.id)}>
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {canCancel(ad) && (
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleCancel(ad.id)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline" asChild>
                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  const renderSpendingStats = () => {
    // Calculate total spending
    const totalSpent = advertisements.reduce((sum: number, ad: Advertisement) => {
      if (ad.paymentStatus === 'paid' && ad.price) {
        return sum + ad.price;
      }
      return sum;
    }, 0);
    
    // Calculate total impressions and clicks
    const totalImpressions = advertisements.reduce((sum: number, ad: Advertisement) => sum + ad.impressions, 0);
    const totalClicks = advertisements.reduce((sum: number, ad: Advertisement) => sum + ad.clicks, 0);
    
    // Calculate CTR and CPM
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpm = totalImpressions > 0 && totalSpent > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalSpent / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ctr.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Main content
  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertiser Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your advertisements and view performance metrics</p>
        </div>
        <Button asChild>
          <Link href="/advertise">
            <PlusCircle className="h-4 w-4 mr-2" /> New Advertisement
          </Link>
        </Button>
      </div>
      
      {/* Spending & Performance Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4">Performance Overview</h2>
        {renderSpendingStats()}
      </div>
      
      {/* Advertisement Management */}
      <div>
        <Tabs defaultValue="active">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <TabsList className="grid grid-cols-4 max-w-md mx-auto">
              <TabsTrigger value="active" className="flex gap-2 items-center">
                <CheckCircle className="h-4 w-4" /> 
                Active ({getActiveAds().length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex gap-2 items-center">
                <AlertTriangle className="h-4 w-4" /> 
                Pending ({getPendingAds().length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex gap-2 items-center">
                <CheckCircle className="h-4 w-4" /> 
                Completed ({getCompletedAds().length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex gap-2 items-center">
                <XCircle className="h-4 w-4" /> 
                Rejected ({getRejectedAds().length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {(() => {
                  switch (window.location.hash.substring(1)) {
                    case 'active': return 'Active Advertisements';
                    case 'pending': return 'Pending Advertisements';
                    case 'completed': return 'Completed Advertisements';
                    case 'rejected': return 'Rejected Advertisements';
                    default: return 'Active Advertisements';
                  }
                })()}
              </CardTitle>
              <CardDescription>
                {(() => {
                  switch (window.location.hash.substring(1)) {
                    case 'active': return 'Currently running advertisements';
                    case 'pending': return 'Advertisements awaiting approval or payment';
                    case 'completed': return 'Past advertisements that have completed their run';
                    case 'rejected': return 'Advertisements that were not approved';
                    default: return 'Currently running advertisements';
                  }
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="active">
                {renderAdTable(getActiveAds())}
              </TabsContent>
              <TabsContent value="pending">
                {renderAdTable(getPendingAds())}
              </TabsContent>
              <TabsContent value="completed">
                {renderAdTable(getCompletedAds())}
              </TabsContent>
              <TabsContent value="rejected">
                {renderAdTable(getRejectedAds())}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
      
      {/* Ad Preview Dialog */}
      <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Advertisement Details</DialogTitle>
            <DialogDescription>
              Created on {previewAd && new Date(previewAd.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Title:</div>
              <div>{previewAd?.title}</div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Link URL:</div>
              <div className="break-all">
                <a href={previewAd?.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {previewAd?.linkUrl}
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Placement:</div>
              <div>{previewAd && getPlacementLabel(previewAd.placement)}</div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Duration:</div>
              <div>
                {previewAd && (
                  <>
                    {new Date(previewAd.startDate).toLocaleDateString()} to {new Date(previewAd.endDate).toLocaleDateString()}
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Status:</div>
              <div>{previewAd && getStatusBadge(previewAd)}</div>
            </div>
            
            {previewAd?.adminNotes && (
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <div className="font-medium">Admin Notes:</div>
                <div className="text-red-600">{previewAd.adminNotes}</div>
              </div>
            )}
            
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Payment:</div>
              <div>
                {previewAd?.price ? (
                  <span>${(previewAd.price / 100).toFixed(2)} - {previewAd.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}</span>
                ) : (
                  <span>No payment required</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="font-medium">Performance:</div>
              <div>
                <div>Impressions: {previewAd?.impressions.toLocaleString()}</div>
                <div>Clicks: {previewAd?.clicks.toLocaleString()}</div>
                <div>
                  CTR: {previewAd?.impressions ? ((previewAd.clicks / previewAd.impressions) * 100).toFixed(2) : 0}%
                </div>
              </div>
            </div>
            
            {previewAd?.imageUrl && (
              <div className="mt-4">
                <div className="font-medium mb-2">Image Preview:</div>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={previewAd.imageUrl} 
                    alt={previewAd.title} 
                    className="max-w-full h-auto" 
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Unavailable';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            {canPay(previewAd!) && (
              <Button variant="default" onClick={() => previewAd && handlePay(previewAd.id)}>
                <CreditCard className="h-4 w-4 mr-2" /> Make Payment
              </Button>
            )}
            
            {canCancel(previewAd!) && (
              <Button variant="outline" className="border-red-500 text-red-600" 
                      onClick={() => previewAd && handleCancel(previewAd.id)}>
                <XCircle className="h-4 w-4 mr-2" /> Cancel Ad
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setPreviewAd(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdvertiserDashboard;