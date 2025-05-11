import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

function AdvertisementManagement() {
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: advertisements = [], isLoading } = useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements/all'],
    retry: false,
  });
  
  const approveMutation = useMutation({
    mutationFn: async (adId: number) => {
      return await apiRequest('POST', `/api/advertisements/${adId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
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
  
  const getPendingAds = () => (advertisements || []).filter((ad: Advertisement) => !ad.isApproved);
  const getActiveAds = () => {
    const now = new Date();
    return (advertisements || []).filter((ad: Advertisement) => 
      ad.isApproved && 
      new Date(ad.startDate) <= now && 
      new Date(ad.endDate) >= now
    );
  };
  const getInactiveAds = () => {
    const now = new Date();
    return (advertisements || []).filter((ad: Advertisement) => 
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
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Advertisement Management</h1>
          <div className="flex space-x-4">
            <Button asChild>
              <a href="/advertise" target="_blank" rel="noopener noreferrer">
                Create New Advertisement
              </a>
            </Button>
          </div>
        </div>
        
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
              <CardHeader>
                <CardTitle>
                  {(() => {
                    switch (window.location.hash.substring(1)) {
                      case 'pending': return 'Pending Advertisements';
                      case 'active': return 'Active Advertisements';
                      case 'inactive': return 'Inactive Advertisements';
                      default: return 'Pending Advertisements';
                    }
                  })()}
                </CardTitle>
                <CardDescription>
                  {(() => {
                    switch (window.location.hash.substring(1)) {
                      case 'pending': return 'Review and approve advertisement submissions';
                      case 'active': return 'Currently running advertisements';
                      case 'inactive': return 'Scheduled or expired advertisements';
                      default: return 'Review and approve advertisement submissions';
                    }
                  })()}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
        
        {/* Reject Advertisement Dialog */}
        <Dialog open={!!adToReject} onOpenChange={(open) => !open && setAdToReject(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reject Advertisement</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. This will be shown to the advertiser.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium mb-2">
                Rejection Reason
              </label>
              <textarea 
                id="reject-reason"
                className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none"
                placeholder="Please explain why this advertisement was rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Be specific and provide guidance on what needs to be changed for approval.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdToReject(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={submitRejection} 
                disabled={!rejectReason.trim()}
              >
                Reject Advertisement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default AdvertisementManagement;