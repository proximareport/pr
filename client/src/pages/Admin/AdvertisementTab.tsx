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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistance, addDays } from 'date-fns';
import { AlertTriangle, CheckCircle, Eye, Trash2, XCircle, PlusCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  isTest?: boolean; // Added this field for test advertisements
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
  const [testAdDialogOpen, setTestAdDialogOpen] = useState(false);
  const [testAdForm, setTestAdForm] = useState({
    title: '',
    linkUrl: 'https://proximareport.com',
    placement: 'sidebar',
    imageUrl: 'https://placehold.co/300x250/png',
    startDate: new Date().toISOString().split('T')[0],
    endDate: addDays(new Date(), 30).toISOString().split('T')[0]
  });
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
      const testAdsCount = advertisements.filter(ad => ad.isTest === true || 
                                                  (ad.adminNotes && ad.adminNotes.toLowerCase().includes('test'))).length;
      
      console.log(`Advertisement counts - Total: ${advertisements.length}, Pending: ${pendingCount}, Approved: ${approvedCount}, Test: ${testAdsCount}`);
      
      // Log the first advertisement as an example
      if (advertisements[0]) {
        console.log('First advertisement:', {
          id: advertisements[0].id,
          title: advertisements[0].title,
          status: advertisements[0].status,
          isApproved: advertisements[0].isApproved,
          isTest: advertisements[0].isTest
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
    onError: (error: any) => {
      console.error('Error approving advertisement:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to approve advertisement',
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
    onError: (error: any) => {
      console.error('Error rejecting advertisement:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to reject advertisement',
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
    onError: (error: any) => {
      console.error('Error deleting advertisement:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete advertisement',
        variant: 'destructive',
      });
    },
  });
  
  // Test Ad creation mutation
  const createTestAdMutation = useMutation({
    mutationFn: async (adData: any) => {
      // Prepare the data for the API request with proper formatting
      const formattedData = {
        ...adData,
        // We already have ISO string dates from the form, so we don't need to convert them
        // Just pass them through directly
        // Add admin notes to indicate this is a test advertisement
        adminNotes: 'Test advertisement created for internal testing'
      };
      
      console.log('Sending formatted data to API:', formattedData);
      return await apiRequest('POST', '/api/admin/test-advertisement', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
      setTestAdDialogOpen(false);
      setTestAdForm({
        title: '',
        linkUrl: 'https://proximareport.com',
        placement: 'sidebar',
        imageUrl: 'https://placehold.co/300x250/png',
        startDate: new Date().toISOString().split('T')[0],
        endDate: addDays(new Date(), 30).toISOString().split('T')[0]
      });
      toast({
        title: 'Success',
        description: 'Test advertisement created successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error creating test advertisement:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create test advertisement. Please check all fields.',
        variant: 'destructive',
      });
    },
  });
  
  // Improved pending ads filter that uses both status and isApproved fields
  const getPendingAds = () => {
    console.log('Getting pending ads. Ads array length:', Array.isArray(advertisements) ? advertisements.length : 'not an array');
    
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array:', advertisements);
      return [];
    }
    
    // Debug what advertisements we have
    if (advertisements.length > 0) {
      console.log('Checking ad types:');
      advertisements.forEach((ad, index) => {
        if (index < 5) { // To avoid excessive logging
          console.log(`Ad ${index}:`, {
            id: ad.id,
            title: ad.title,
            isApproved: ad.isApproved,
            status: ad.status,
            isTest: ad.isTest
          });
        }
      });
    }
    
    const pendingAds = advertisements.filter((ad: Advertisement) => 
      // Check for pending status or use isApproved flag as fallback
      // Exclude test ads from pending tab
      !ad.isTest && (ad.status === 'pending' || (!ad.isApproved && ad.status !== 'rejected'))
    );
    
    console.log(`Found ${pendingAds.length} pending ads`);
    return pendingAds;
  };
  
  const getActiveAds = () => {
    const now = new Date();
    
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array:', advertisements);
      return [];
    }
    
    const activeAds = advertisements.filter((ad: Advertisement) => 
      // Don't show test ads in regular active tab
      !ad.isTest && 
      ad.isApproved && 
      new Date(ad.startDate) <= now && 
      new Date(ad.endDate) >= now
    );
    
    console.log(`Found ${activeAds.length} active ads`);
    return activeAds;
  };

  const getInactiveAds = () => {
    const now = new Date();
    
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array in getInactiveAds:', advertisements);
      return [];
    }
    
    const inactiveAds = advertisements.filter((ad: Advertisement) => 
      // Don't show test ads in regular inactive tab
      !ad.isTest && 
      ad.isApproved && 
      (new Date(ad.startDate) > now || new Date(ad.endDate) < now)
    );
    
    console.log(`Found ${inactiveAds.length} inactive ads`);
    return inactiveAds;
  };
  
  // New filter for test advertisements
  const getTestAds = () => {
    if (!Array.isArray(advertisements)) {
      console.warn('advertisements is not an array in getTestAds:', advertisements);
      return [];
    }
    
    const testAds = advertisements.filter((ad: Advertisement) => {
      // Enhanced test detection logic - check both isTest flag and admin notes
      const isTestAd = ad.isTest === true || 
                      (ad.adminNotes && ad.adminNotes.toLowerCase().includes('test'));
      
      return isTestAd;
    });
    
    console.log(`Found ${testAds.length} test ads`);
    return testAds;
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
  
  // Helper methods for the test ad form
  const handleTestAdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTestAdForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTestAdSelectChange = (name: string, value: string) => {
    setTestAdForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateTestAd = () => {
    // Basic validation
    if (!testAdForm.title || !testAdForm.linkUrl || !testAdForm.imageUrl || 
        !testAdForm.placement || !testAdForm.startDate || !testAdForm.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Create the complete ad data, ensuring all required fields are present
    const completeAdData = {
      ...testAdForm,
      // Send the ISO string instead of Date object to ensure compatibility
      startDate: testAdForm.startDate, 
      endDate: testAdForm.endDate,
      // Explicitly add userId - this will be overwritten by the server but is required for schema validation
      userId: 1 // Temporary value, will be replaced by server with actual session userId
    };
    
    console.log('Submitting test ad data:', completeAdData);
    createTestAdMutation.mutate(completeAdData);
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
            <TableRow 
              key={ad.id} 
              className={ad.isTest ? 'bg-purple-50 dark:bg-purple-900/10' : ''}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {ad.title}
                  {ad.isTest && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                      TEST
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{getPlacementLabel(ad.placement)}</TableCell>
              <TableCell>
                {ad.user?.username || 'Unknown'} 
                {ad.user?.email && <div className="text-xs text-gray-500">{ad.user.email}</div>}
              </TableCell>
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
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    {ad.isApproved ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
                    )}
                    
                    {/* Add badge for test advertisements */}
                    {ad.isTest && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Test</Badge>
                    )}
                    
                    {ad.adminNotes && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="ml-2 h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{ad.adminNotes}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {ad.isTest && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Test Advertisement</Badge>
                  )}
                </div>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Advertisement Management</h2>
              
              {/* Test Ad Creation Button */}
              <Dialog open={testAdDialogOpen} onOpenChange={setTestAdDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Test Ad
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Test Advertisement</DialogTitle>
                    <DialogDescription>
                      Create a test advertisement that will be automatically approved and bypasses payment.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        name="title" 
                        placeholder="Test Advertisement Title" 
                        value={testAdForm.title} 
                        onChange={handleTestAdInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="linkUrl">Link URL</Label>
                      <Input 
                        id="linkUrl" 
                        name="linkUrl" 
                        placeholder="https://example.com" 
                        value={testAdForm.linkUrl} 
                        onChange={handleTestAdInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input 
                        id="imageUrl" 
                        name="imageUrl" 
                        placeholder="https://example.com/image.png" 
                        value={testAdForm.imageUrl} 
                        onChange={handleTestAdInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="placement">Placement</Label>
                      <Select 
                        value={testAdForm.placement} 
                        onValueChange={(value) => handleTestAdSelectChange('placement', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a placement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage">Homepage Banner</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="article">In-Article</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate" 
                          name="startDate" 
                          type="date" 
                          value={testAdForm.startDate} 
                          onChange={handleTestAdInputChange}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate" 
                          name="endDate" 
                          type="date" 
                          value={testAdForm.endDate} 
                          onChange={handleTestAdInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      onClick={handleCreateTestAd}
                      disabled={createTestAdMutation.isPending}
                    >
                      {createTestAdMutation.isPending ? 'Creating...' : 'Create Test Ad'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <TabsList className="grid grid-cols-4 max-w-lg mx-auto">
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
              <TabsTrigger value="test" className="flex gap-2 items-center">
                <PlusCircle className="h-4 w-4" /> 
                Test ({getTestAds().length})
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
              <TabsContent value="test">
                {renderAdTable(getTestAds())}
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
              Submitted by {previewAd?.user?.username || 'Unknown'} 
              {previewAd?.user?.email && (
                <span className="block text-sm text-gray-500 mt-1">
                  {previewAd.user.email}
                </span>
              )}
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

            <div className="grid grid-cols-[80px_1fr] gap-2">
              <div className="font-medium">User ID:</div>
              <div>{previewAd?.userId || 'Unknown'}</div>
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