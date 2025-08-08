import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldIcon, 
  EyeIcon, 
  EyeOffIcon, 
  SaveIcon, 
  PaletteIcon,
  ImageIcon,
  CodeIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SiteBlockData {
  id: number;
  isEnabled: boolean;
  title: string;
  subtitle: string;
  message: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  showLoginForm: boolean;
  loginFormTitle: string;
  loginFormSubtitle: string;
  customCss?: string;
}

export default function SiteBlockTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState<SiteBlockData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch current site block settings
  const { data: siteBlock, isLoading, error } = useQuery<SiteBlockData>({
    queryKey: ['site-block'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/site-block');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching site block settings:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update site block settings
  const updateSiteBlock = useMutation({
    mutationFn: async (data: Partial<SiteBlockData>) => {
      try {
        const response = await apiRequest('PUT', '/api/site-block', data);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error updating site block settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-block'] });
      toast({
        title: "Settings updated",
        description: "Site block settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update site block settings.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when siteBlock loads
  React.useEffect(() => {
    if (siteBlock && !formData) {
      setFormData(siteBlock);
    }
  }, [siteBlock, formData]);

  const handleFieldChange = (field: keyof SiteBlockData, value: any) => {
    if (!formData) return;
    
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!formData) {
      toast({
        title: "Error",
        description: "Site block settings not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    updateSiteBlock.mutate(formData);
    setHasUnsavedChanges(false);
  };

  const handleToggle = (enabled: boolean) => {
    handleFieldChange('isEnabled', enabled);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading site block settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-900 border-red-700">
        <AlertTriangleIcon className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-200">
          Failed to load site block settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!siteBlock) {
    return (
      <Alert className="bg-yellow-900 border-yellow-700">
        <AlertTriangleIcon className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          No site block settings found. Please check the database configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Block Management</h2>
          <p className="text-gray-400 mt-1">
            Control site access and customize the block screen
          </p>
        </div>
                 <div className="flex items-center gap-3">
           <Badge variant={formData?.isEnabled ? "destructive" : "secondary"}>
             {formData?.isEnabled ? "Site Blocked" : "Site Active"}
           </Badge>
           <Button
             variant="outline"
             onClick={() => setPreviewMode(!previewMode)}
             className="border-gray-600 text-gray-300 hover:bg-gray-800"
           >
             {previewMode ? <EyeOffIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
             {previewMode ? "Hide Preview" : "Preview"}
           </Button>
           <Button
             onClick={handleSave}
             disabled={!hasUnsavedChanges || updateSiteBlock.isPending}
             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
           >
             <SaveIcon className="h-4 w-4 mr-2" />
             {updateSiteBlock.isPending ? "Saving..." : "Save Changes"}
           </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Enable/Disable */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldIcon className="h-5 w-5" />
                Site Block Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enable or disable the site block screen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Block Site Access</p>
                  <p className="text-sm text-gray-400">
                    When enabled, only admins can access the site
                  </p>
                </div>
                                 <Switch
                   checked={formData?.isEnabled || false}
                   onCheckedChange={handleToggle}
                 />
              </div>
            </CardContent>
          </Card>

          {/* Content Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Content Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Customize the text and messaging shown on the block screen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                                 <Input
                   id="title"
                   value={formData?.title || ''}
                   onChange={(e) => handleFieldChange('title', e.target.value)}
                   placeholder="Site Temporarily Unavailable"
                   className="bg-gray-800 border-gray-700 text-white"
                 />
              </div>
              
              <div>
                <Label htmlFor="subtitle" className="text-white">Subtitle</Label>
                                 <Input
                   id="subtitle"
                   value={formData?.subtitle || ''}
                   onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                   placeholder="We are currently performing maintenance or updates."
                   className="bg-gray-800 border-gray-700 text-white"
                 />
              </div>
              
              <div>
                <Label htmlFor="message" className="text-white">Message</Label>
                                 <Textarea
                   id="message"
                   value={formData?.message || ''}
                   onChange={(e) => handleFieldChange('message', e.target.value)}
                   placeholder="Our team is working to bring the site back online..."
                   rows={3}
                   className="bg-gray-800 border-gray-700 text-white"
                 />
              </div>
            </CardContent>
          </Card>

          {/* Login Form Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Login Form Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure the admin login form appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Show Login Form</p>
                  <p className="text-sm text-gray-400">
                    Allow admins to login from the block screen
                  </p>
                </div>
                                 <Switch
                   checked={formData?.showLoginForm || false}
                   onCheckedChange={(checked) => handleFieldChange('showLoginForm', checked)}
                 />
              </div>
              
                             {formData?.showLoginForm && (
                <>
                  <div>
                    <Label htmlFor="loginFormTitle" className="text-white">Login Form Title</Label>
                                         <Input
                       id="loginFormTitle"
                       value={formData?.loginFormTitle || ''}
                       onChange={(e) => handleFieldChange('loginFormTitle', e.target.value)}
                       placeholder="Admin Access"
                       className="bg-gray-800 border-gray-700 text-white"
                     />
                  </div>
                  
                  <div>
                    <Label htmlFor="loginFormSubtitle" className="text-white">Login Form Subtitle</Label>
                                         <Input
                       id="loginFormSubtitle"
                       value={siteBlock?.loginFormSubtitle || ''}
                       onChange={(e) => siteBlock && handleSave({ ...siteBlock, loginFormSubtitle: e.target.value })}
                       placeholder="Enter your credentials to access the site"
                       className="bg-gray-800 border-gray-700 text-white"
                     />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visual Settings */}
        <div className="space-y-6">
          {/* Media Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ImageIcon className="h-5 w-5" />
                Media Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload or set URLs for background and logo images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="backgroundImage" className="text-white">Background Image URL</Label>
                                 <Input
                   id="backgroundImage"
                   value={siteBlock?.backgroundImageUrl || ''}
                   onChange={(e) => siteBlock && handleSave({ ...siteBlock, backgroundImageUrl: e.target.value })}
                   placeholder="https://example.com/background.jpg"
                   className="bg-gray-800 border-gray-700 text-white"
                 />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to use gradient background
                </p>
              </div>
              
              <div>
                <Label htmlFor="logoUrl" className="text-white">Logo URL</Label>
                                 <Input
                   id="logoUrl"
                   value={siteBlock?.logoUrl || ''}
                   onChange={(e) => siteBlock && handleSave({ ...siteBlock, logoUrl: e.target.value })}
                   placeholder="https://example.com/logo.png"
                   className="bg-gray-800 border-gray-700 text-white"
                 />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to hide logo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Color Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <PaletteIcon className="h-5 w-5" />
                Color Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize the color scheme of the block screen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryColor" className="text-white">Primary Color</Label>
                <div className="flex gap-2">
                                     <Input
                     id="primaryColor"
                     value={siteBlock?.primaryColor || '#4f46e5'}
                     onChange={(e) => siteBlock && handleSave({ ...siteBlock, primaryColor: e.target.value })}
                     placeholder="#4f46e5"
                     className="bg-gray-800 border-gray-700 text-white"
                   />
                   <div 
                     className="w-10 h-10 rounded border border-gray-600"
                     style={{ backgroundColor: siteBlock?.primaryColor || '#4f46e5' }}
                   />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor" className="text-white">Secondary Color</Label>
                <div className="flex gap-2">
                                     <Input
                     id="secondaryColor"
                     value={siteBlock?.secondaryColor || '#0f172a'}
                     onChange={(e) => siteBlock && handleSave({ ...siteBlock, secondaryColor: e.target.value })}
                     placeholder="#0f172a"
                     className="bg-gray-800 border-gray-700 text-white"
                   />
                   <div 
                     className="w-10 h-10 rounded border border-gray-600"
                     style={{ backgroundColor: siteBlock?.secondaryColor || '#0f172a' }}
                   />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom CSS */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CodeIcon className="h-5 w-5" />
                Custom CSS
              </CardTitle>
              <CardDescription className="text-gray-400">
                Add custom CSS styles to further customize the appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
                             <Textarea
                 value={siteBlock?.customCss || ''}
                 onChange={(e) => siteBlock && handleSave({ ...siteBlock, customCss: e.target.value })}
                 placeholder="/* Add your custom CSS here */"
                 rows={6}
                 className="font-mono text-sm bg-gray-800 border-gray-700 text-white"
               />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview */}
      {previewMode && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Preview</CardTitle>
            <CardDescription className="text-gray-400">
              Preview how the block screen will appear to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                src="/site-block-preview"
                className="w-full h-full"
                title="Site Block Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
