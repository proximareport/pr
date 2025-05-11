import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, ExternalLink, Check, X, EyeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  user?: {
    username: string;
    email: string;
  };
}

function AdvertisementManagement() {
  const { toast } = useToast();
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  
  // Fetch all advertisements
  const { data: advertisements, isLoading, isError } = useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements/all'],
    retry: false,
  });
  
  // Approve advertisement mutation
  const approveAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/advertisements/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve advertisement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
      toast({
        title: 'Advertisement approved',
        description: 'The advertisement has been approved and is now live.',
      });
    },
    onError: (error) => {
      console.error('Error approving advertisement:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve advertisement. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Reject advertisement mutation
  const rejectAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/advertisements/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject advertisement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
      toast({
        title: 'Advertisement rejected',
        description: 'The advertisement has been rejected.',
      });
    },
    onError: (error) => {
      console.error('Error rejecting advertisement:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject advertisement. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Delete advertisement mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/advertisements/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete advertisement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/all'] });
      toast({
        title: 'Advertisement deleted',
        description: 'The advertisement has been permanently deleted.',
      });
    },
    onError: (error) => {
      console.error('Error deleting advertisement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete advertisement. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Filter advertisements by approval status
  const pendingAds = advertisements?.filter(ad => !ad.isApproved) || [];
  const approvedAds = advertisements?.filter(ad => ad.isApproved) || [];
  
  // Format placement label
  const formatPlacement = (placement: string) => {
    switch (placement) {
      case 'homepage':
        return 'Homepage';
      case 'sidebar':
        return 'Sidebar';
      case 'inline':
        return 'Inline Article';
      default:
        return placement;
    }
  };
  
  // Handle approve action
  const handleApprove = (id: number) => {
    approveAdMutation.mutate(id);
  };
  
  // Handle reject action
  const handleReject = (id: number) => {
    rejectAdMutation.mutate(id);
  };
  
  // Handle delete action
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this advertisement? This action cannot be undone.')) {
      deleteAdMutation.mutate(id);
    }
  };
  
  // Handle preview action
  const handlePreview = (ad: Advertisement) => {
    setPreviewAd(ad);
  };
  
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Advertisement Management</h1>
          <Button onClick={() => window.location.href = '/advertise'}>Create New Ad</Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading advertisements...</span>
          </div>
        ) : isError ? (
          <div className="bg-red-100 p-4 rounded-md text-red-700">
            Failed to load advertisements. Please refresh the page or try again later.
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="relative">
                Pending Approval
                {pendingAds.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-white">{pendingAds.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved Ads</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              <div className="bg-white rounded-md shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Title</TableHead>
                      <TableHead>Placement</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAds.length > 0 ? (
                      pendingAds.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium">{ad.title}</TableCell>
                          <TableCell>{formatPlacement(ad.placement)}</TableCell>
                          <TableCell>{ad.user?.username || 'Unknown user'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Start: {format(new Date(ad.startDate), 'MMM d, yyyy')}</div>
                              <div>End: {format(new Date(ad.endDate), 'MMM d, yyyy')}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePreview(ad)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(ad.id)}
                              disabled={approveAdMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(ad.id)}
                              disabled={rejectAdMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No pending advertisements. All ads have been reviewed.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              <div className="bg-white rounded-md shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Title</TableHead>
                      <TableHead>Placement</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Run Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedAds.length > 0 ? (
                      approvedAds.map((ad) => {
                        const now = new Date();
                        const startDate = new Date(ad.startDate);
                        const endDate = new Date(ad.endDate);
                        
                        let status = "Scheduled";
                        if (now >= startDate && now <= endDate) {
                          status = "Active";
                        } else if (now > endDate) {
                          status = "Ended";
                        }
                        
                        return (
                          <TableRow key={ad.id}>
                            <TableCell className="font-medium">{ad.title}</TableCell>
                            <TableCell>{formatPlacement(ad.placement)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Impressions: {ad.impressions.toLocaleString()}</div>
                                <div>Clicks: {ad.clicks.toLocaleString()}</div>
                                <div>CTR: {ad.impressions > 0 
                                  ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' 
                                  : '0%'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Start: {format(new Date(ad.startDate), 'MMM d, yyyy')}</div>
                                <div>End: {format(new Date(ad.endDate), 'MMM d, yyyy')}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                status === 'Active' ? 'bg-green-500' : 
                                status === 'Scheduled' ? 'bg-blue-500' : 
                                'bg-gray-500'
                              }>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePreview(ad)}
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDelete(ad.id)}
                                disabled={deleteAdMutation.isPending}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No approved advertisements found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ad Preview: {previewAd?.title}</DialogTitle>
            <DialogDescription>
              Advertisement preview for {formatPlacement(previewAd?.placement || '')} placement
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 mt-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="font-semibold mb-2">URL:</div>
              <a 
                href={previewAd?.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                {previewAd?.linkUrl}
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
            
            {previewAd?.imageUrl && (
              <div className="border rounded-md p-1">
                <div className="font-semibold mb-2">Ad Image:</div>
                <img 
                  src={previewAd.imageUrl} 
                  alt={previewAd.title} 
                  className="max-h-96 max-w-full object-contain mx-auto rounded" 
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <h3 className="font-medium mb-2">Campaign Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span>{format(new Date(previewAd?.startDate || ''), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span>{format(new Date(previewAd?.endDate || ''), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Placement:</span>
                    <span>{formatPlacement(previewAd?.placement || '')}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-md">
                <h3 className="font-medium mb-2">Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impressions:</span>
                    <span>{previewAd?.impressions.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clicks:</span>
                    <span>{previewAd?.clicks.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CTR:</span>
                    <span>
                      {previewAd && previewAd.impressions > 0 
                        ? ((previewAd.clicks / previewAd.impressions) * 100).toFixed(2) + '%' 
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {!previewAd?.isApproved && (
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline"
                  onClick={() => setPreviewAd(null)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (previewAd) {
                      handleApprove(previewAd.id);
                      setPreviewAd(null);
                    }
                  }}
                  disabled={approveAdMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve Advertisement
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (previewAd) {
                      handleReject(previewAd.id);
                      setPreviewAd(null);
                    }
                  }}
                  disabled={rejectAdMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject Advertisement
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default AdvertisementManagement;