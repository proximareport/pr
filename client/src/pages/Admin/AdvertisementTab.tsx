import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';
import { AlertTriangle, CheckCircle, Eye, Trash2, XCircle } from 'lucide-react';

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
  createdAt: string;
  impressions: number;
  clicks: number;
  price: number | null;
  status: string;
  paymentStatus: string | null;
  paymentId: string | null;
  adminNotes: string | null;
  user?: {
    username: string;
    email: string;
  };
}

function AdvertisementTab() {
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use a completely new and direct endpoint specifically for the admin panel
  const { data: advertisements = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/advertisements'],
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5000, // Refetch data every 5 seconds
    select: (data: any): Advertisement[] => {
      // Handle null response from the API
      if (!data) {
        console.error('API returned null for advertisements');
        return [];
      }
      
      // If it's already an array, return it
      if (Array.isArray(data)) {
        console.log(`Advertisement data is an array with ${data.length} items`);
        return data;
      }
      
      // Handle object response
      if (typeof data === 'object') {
        console.log('Advertisement data is an object, converting to array');
        const adArray = Object.values(data);
        console.log(`Converted object to array with ${adArray.length} items`);
        return adArray;
      }
      
      console.warn(`Unexpected advertisement data format: ${typeof data}`);
      return [];
    }
  });
  
  // Log data on component render for debugging
  React.useEffect(() => {
    if (advertisements && advertisements.length > 0) {
      console.log('Advertisements loaded:', advertisements.length);
      
      // Log specific details about advertisements
      const pendingCount = advertisements.filter(ad => !ad.isApproved || ad.status === 'pending').length;
      const approvedCount = advertisements.filter(ad => ad.isApproved).length;
      
      console.log(`Advertisement counts - Total: ${advertisements.length}, Pending: ${pendingCount}, Approved: ${approvedCount}`);
      
      // Log the first advertisement as an example
      if (advertisements[0]) {
        console.log('First advertisement:', {
          id: advertisements[0].id,
          title: advertisements[0].title,
          status: advertisements[0].status,
          isApproved: advertisements[0].isApproved
        });
      }
    } else {
      console.log('No advertisements loaded yet or empty array returned');
    }
  }, [advertisements]);
  
  const approveMutation = useMutation({
    mutationFn: async (adId: number) => {
      return await apiRequest('POST', `/api/advertisements/${adId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
      toast({
        title: 'Success',
        description: 'Advertisement approved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve advertisement',
        variant: 'destructive',
      });
    },
  });
  
  const [adToReject, setAdToReject] = useState<Advertisement | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const rejectMutation = useMutation({
    mutationFn: async ({ adId, reason }: { adId: number, reason: string }) => {
      return await apiRequest('POST', `/api/advertisements/${adId}/reject`, { adminNotes: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
      toast({
        title: 'Success',
        description: 'Advertisement rejected',
      });
      setAdToReject(null);
      setRejectReason('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject advertisement',
        variant: 'destructive',
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (adId: number) => {
      return await apiRequest('DELETE', `/api/advertisements/${adId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
      toast({
        title: 'Success',
        description: 'Advertisement deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete advertisement',
        variant: 'destructive',
      });
    },
  });
  
  // Improved pending ads filter that uses both status and isApproved fields
  const getPendingAds = () => {
    console.log('Getting pending ads. advertisements type:', typeof advertisements, Array.isArray(advertisements) ? 'is array' : 'not array', advertisements);
    
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array:', advertisements);
      return [];
    }
    
    return advertisements.filter((ad: Advertisement) => 
      // Check for pending status or use isApproved flag as fallback
      ad.status === 'pending' || (!ad.isApproved && ad.status !== 'rejected')
    );
  };
  
  const getActiveAds = () => {
    const now = new Date();
    
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array:', advertisements);
      return [];
    }
    
    return advertisements.filter((ad: Advertisement) => 
      ad.isApproved && 
      new Date(ad.startDate) <= now && 
      new Date(ad.endDate) >= now
    );
  };
  const getInactiveAds = () => {
    const now = new Date();
    
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array in getInactiveAds:', advertisements);
      return [];
    }
    
    return advertisements.filter((ad: Advertisement) => 
      ad.isApproved && 
      (new Date(ad.startDate) > now || new Date(ad.endDate) < now)
    );
  };
  
  const handleApprove = (adId: number) => {
    approveMutation.mutate(adId);
  };
  
  const handleReject = (ad: Advertisement) => {
    setAdToReject(ad);
  };
  
  const submitRejection = () => {
    if (adToReject && rejectReason.trim()) {
      rejectMutation.mutate({ 
        adId: adToReject.id, 
        reason: rejectReason 
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = (adId: number) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this advertisement? This action cannot be undone.');
    if (isConfirmed) {
      deleteMutation.mutate(adId);
    }
  };
  
  const handlePreview = (ad: Advertisement) => {
    setPreviewAd(ad);
  };
  
  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case 'homepage': return 'Homepage Banner';
      case 'sidebar': return 'Sidebar';
      case 'article': return 'In-Article';
      case 'newsletter': return 'Newsletter';
      default: return placement;
    }
  };
  
  const renderAdTable = (ads: Advertisement[]) => {
    if (ads.length === 0) {
      return <div className="text-center py-8 text-gray-500">No advertisements found</div>;
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Placement</TableHead>
            <TableHead>Advertiser</TableHead>
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
              <TableCell>{ad.user?.username || 'Unknown'}</TableCell>
              <TableCell>
                <div className="text-xs">
                  <div>Start: {new Date(ad.startDate).toLocaleDateString()}</div>
                  <div>End: {new Date(ad.endDate).toLocaleDateString()}</div>
                  <div className="text-gray-500 mt-1">
                    {formatDistance(new Date(ad.startDate), new Date(ad.endDate), { addSuffix: false })}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {ad.isApproved ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
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
                  
                  {!ad.isApproved && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleApprove(ad.id)}>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(ad)}>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                  
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(ad.id)}>
                    <Trash2 className="h-4 w-4" />
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
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <TabsList className="grid grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="pending" className="flex gap-2 items-center">
                <AlertTriangle className="h-4 w-4" /> 
                Pending ({getPendingAds().length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex gap-2 items-center">
                <CheckCircle className="h-4 w-4" /> 
                Active ({getActiveAds().length})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex gap-2 items-center">
                <XCircle className="h-4 w-4" /> 
                Inactive ({getInactiveAds().length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <TabsContent value="pending">
                {renderAdTable(getPendingAds())}
              </TabsContent>
              <TabsContent value="active">
                {renderAdTable(getActiveAds())}
              </TabsContent>
              <TabsContent value="inactive">
                {renderAdTable(getInactiveAds())}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}
      
      {/* Ad Preview Dialog */}
      <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Advertisement Preview</DialogTitle>
            <DialogDescription>
              Submitted by {previewAd?.user?.username || 'Unknown'} ({previewAd?.user?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">Title:</div>
              <div>{previewAd?.title}</div>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">Link URL:</div>
              <div className="break-all">
                <a href={previewAd?.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {previewAd?.linkUrl}
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">Placement:</div>
              <div>{previewAd && getPlacementLabel(previewAd.placement)}</div>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">Duration:</div>
              <div>
                {previewAd && (
                  <>
                    {new Date(previewAd.startDate).toLocaleDateString()} to {new Date(previewAd.endDate).toLocaleDateString()}
                    <div className="text-sm text-gray-500">
                      {formatDistance(new Date(previewAd.startDate), new Date(previewAd.endDate), { addSuffix: false })}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">Price:</div>
              <div>{previewAd?.price ? `$${(previewAd.price / 100).toFixed(2)}` : 'No price set'}</div>
            </div>
            
            {previewAd?.adminNotes && (
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <div className="font-medium">Notes:</div>
                <div className="text-red-600">{previewAd.adminNotes}</div>
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
            {!previewAd?.isApproved && (
              <div className="flex gap-2">
                <Button variant="outline" className="border-green-500 text-green-600" 
                        onClick={() => previewAd && handleApprove(previewAd.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button variant="outline" className="border-red-500 text-red-600" 
                        onClick={() => previewAd && handleReject(previewAd)}>
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            )}
            <Button variant="outline" className="ml-auto" onClick={() => setPreviewAd(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={!!adToReject} onOpenChange={(open) => !open && setAdToReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Advertisement</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this advertisement. This will be visible to the advertiser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">Title:</div>
              <div>{adToReject?.title}</div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reject-reason" className="text-sm font-medium">
                Rejection Reason:
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain why this advertisement is being rejected..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdToReject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitRejection}>
              {rejectMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AdvertisementTab;