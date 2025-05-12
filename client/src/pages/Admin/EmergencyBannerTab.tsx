import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  AlertTriangleIcon, 
  InfoIcon, 
  AlertOctagonIcon,
  X as XIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Define types for the emergency banner
interface EmergencyBanner {
  id: number;
  message: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  createdBy: number;
}

function EmergencyBannerTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for the form
  const [message, setMessage] = useState('');
  const [bannerType, setBannerType] = useState('info');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  
  // Query for active banners
  const { data: activeBanner, isLoading: isLoadingBanner } = useQuery({
    queryKey: ['/api/emergency-banner'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/emergency-banner');
        return response.json();
      } catch (error) {
        console.error("Failed to fetch emergency banner:", error);
        return null;
      }
    }
  });
  
  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (data: { message: string; type: string; expiresAt?: string }) => {
      const response = await apiRequest('POST', '/api/emergency-banner', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Banner Created",
        description: "Emergency banner has been successfully created.",
      });
      
      // Reset form
      setMessage('');
      setBannerType('info');
      setExpiresAt(null);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-banner'] });
    },
    onError: (error) => {
      console.error("Error creating banner:", error);
      toast({
        title: "Error",
        description: "Failed to create emergency banner. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Deactivate banner mutation
  const deactivateBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/emergency-banner/${id}/deactivate`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Banner Deactivated",
        description: "Emergency banner has been successfully deactivated.",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-banner'] });
    },
    onError: (error) => {
      console.error("Error deactivating banner:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate emergency banner. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message) {
      toast({
        title: "Validation Error",
        description: "Banner message is required.",
        variant: "destructive"
      });
      return;
    }
    
    createBannerMutation.mutate({
      message,
      type: bannerType,
      expiresAt: expiresAt ? expiresAt.toISOString() : undefined
    });
  };
  
  // Get Icon based on banner type
  const getBannerIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <AlertOctagonIcon className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get banner background color based on type
  const getBannerBackground = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/50';
      case 'critical':
        return 'bg-red-500/10 border-red-500/50';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/50';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertOctagonIcon className="h-5 w-5 mr-2 text-red-500" />
            Emergency Banner Management
          </CardTitle>
          <CardDescription>
            Create and manage site-wide emergency banners for important announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Active Banner Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Active Banner</h3>
            
            {isLoadingBanner ? (
              <div className="flex items-center justify-center p-6 border rounded-md">
                <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full"></div>
              </div>
            ) : activeBanner ? (
              <div className={`p-4 rounded-md border ${getBannerBackground(activeBanner.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      {getBannerIcon(activeBanner.type)}
                    </div>
                    <div>
                      <p className="font-medium">{activeBanner.message}</p>
                      <div className="mt-2 text-sm text-gray-400 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          Created: {format(new Date(activeBanner.createdAt), 'MMM d, yyyy')}
                        </Badge>
                        {activeBanner.expiresAt && (
                          <Badge variant="outline">
                            Expires: {format(new Date(activeBanner.expiresAt), 'MMM d, yyyy')}
                          </Badge>
                        )}
                        <Badge variant={
                          activeBanner.type === "info" ? "default" : 
                          activeBanner.type === "warning" ? "secondary" : 
                          activeBanner.type === "critical" ? "destructive" : 
                          "outline"
                        }>
                          {activeBanner.type.charAt(0).toUpperCase() + activeBanner.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deactivateBannerMutation.mutate(activeBanner.id)}
                    disabled={deactivateBannerMutation.isPending}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded-md p-6 text-center text-gray-500">
                No active emergency banner
              </div>
            )}
          </div>
          
          {/* Create Banner Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-medium">Create New Banner</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Banner Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Enter the emergency message to display site-wide" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="h-24"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Banner Type</Label>
                  <Select 
                    value={bannerType} 
                    onValueChange={setBannerType}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select banner type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="warning">Warning (Orange)</SelectItem>
                      <SelectItem value="critical">Critical (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="expiration"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {expiresAt ? format(expiresAt, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiresAt}
                        onSelect={(date: Date | undefined) => {
                          setExpiresAt(date || null);
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Preview toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="preview" 
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                />
                <Label htmlFor="preview">Show Preview</Label>
              </div>
              
              {/* Banner Preview */}
              {showPreview && message && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Preview:</h4>
                  <div className={`p-4 rounded-md border ${getBannerBackground(bannerType)}`}>
                    <div className="flex items-start space-x-3">
                      <div className="pt-0.5">
                        {getBannerIcon(bannerType)}
                      </div>
                      <div>
                        <p className="font-medium">{message}</p>
                        <div className="mt-2 text-sm text-gray-400 flex gap-2">
                          {expiresAt && (
                            <Badge variant="outline">
                              Expires: {format(expiresAt, 'MMM d, yyyy')}
                            </Badge>
                          )}
                          <Badge variant={
                            bannerType === "info" ? "default" : 
                            bannerType === "warning" ? "secondary" : 
                            bannerType === "critical" ? "destructive" : 
                            "outline"
                          }>
                            {bannerType.charAt(0).toUpperCase() + bannerType.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createBannerMutation.isPending || !message}
              >
                {createBannerMutation.isPending ? "Creating..." : "Create Banner"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmergencyBannerTab;