import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Check, 
  Globe, 
  Mail, 
  PaintBucket, 
  Settings, 
  DollarSign, 
  FileText,
  Image,
  AlertCircle,
  CalendarClock
} from 'lucide-react';

// Form validation schema
const siteSettingsSchema = z.object({
  siteName: z.string().min(2, { message: "Site name must be at least 2 characters" }),
  siteTagline: z.string().min(2, { message: "Tagline must be at least 2 characters" }),
  siteDescription: z.string().optional(),
  siteKeywords: z.array(z.string()).optional(),
  logoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  faviconUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { message: "Please enter a valid hex color" }),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { message: "Please enter a valid hex color" }),
  googleAnalyticsId: z.string().optional().or(z.literal('')),
  facebookAppId: z.string().optional().or(z.literal('')),
  twitterUsername: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')),
  allowComments: z.boolean().default(true),
  requireCommentApproval: z.boolean().default(false),
  allowUserRegistration: z.boolean().default(true),
  supporterTierPrice: z.coerce.number().min(0).max(10000),
  proTierPrice: z.coerce.number().min(0).max(10000),
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().optional().default("We're currently performing scheduled maintenance on our systems to enhance your experience."),
  maintenanceDetails: z.string().optional().default("Our team is working to complete the scheduled maintenance as quickly as possible. The site will be back online shortly with all services fully operational."),
  maintenanceEndTime: z.string().optional().nullable(),
});

type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

const SiteSettingsForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Define the settings type for TypeScript
  interface SettingsType {
    id: number;
    siteName: string;
    siteTagline: string;
    siteDescription: string;
    siteKeywords: string[] | string;
    logoUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    googleAnalyticsId: string | null;
    facebookAppId: string | null;
    twitterUsername: string | null;
    contactEmail: string | null;
    allowComments: boolean;
    requireCommentApproval: boolean;
    allowUserRegistration: boolean;
    supporterTierPrice: number;
    proTierPrice: number;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maintenanceDetails: string;
    maintenanceEndTime: string | null;
    updatedAt: string;
    updatedBy: number;
  }

  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery<SettingsType>({
    queryKey: ['/api/site-settings'],
    retry: false,
  });
  
  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteName: '',
      siteTagline: '',
      siteDescription: '',
      siteKeywords: [],
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#0f172a',
      secondaryColor: '#4f46e5',
      googleAnalyticsId: '',
      facebookAppId: '',
      twitterUsername: '',
      contactEmail: '',
      allowComments: true,
      requireCommentApproval: false,
      allowUserRegistration: true,
      supporterTierPrice: 200, // $2.00 in cents
      proTierPrice: 400, // $4.00 in cents
      maintenanceMode: false,
    },
  });
  
  // Update form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      console.log("Settings loaded:", settings);
      
      // Ensure siteKeywords is an array
      let formattedKeywords: string[] = [];
      
      if (Array.isArray(settings.siteKeywords)) {
        formattedKeywords = settings.siteKeywords;
      } else if (typeof settings.siteKeywords === 'string') {
        try {
          // Try to parse JSON string
          formattedKeywords = JSON.parse(settings.siteKeywords);
        } catch (e) {
          // If parsing fails, use string as a single keyword
          formattedKeywords = [settings.siteKeywords];
        }
      }
      
      form.reset({
        siteName: settings.siteName || '',
        siteTagline: settings.siteTagline || '',
        siteDescription: settings.siteDescription || '',
        siteKeywords: formattedKeywords,
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        primaryColor: settings.primaryColor || '#0f172a',
        secondaryColor: settings.secondaryColor || '#4f46e5',
        googleAnalyticsId: settings.googleAnalyticsId || '',
        facebookAppId: settings.facebookAppId || '',
        twitterUsername: settings.twitterUsername || '',
        contactEmail: settings.contactEmail || '',
        allowComments: settings.allowComments ?? true,
        requireCommentApproval: settings.requireCommentApproval ?? false,
        allowUserRegistration: settings.allowUserRegistration ?? true,
        supporterTierPrice: settings.supporterTierPrice || 200,
        proTierPrice: settings.proTierPrice || 400,
        maintenanceMode: settings.maintenanceMode ?? false,
        maintenanceMessage: settings.maintenanceMessage || "We're currently performing scheduled maintenance on our systems to enhance your experience.",
        maintenanceDetails: settings.maintenanceDetails || "Our team is working to complete the scheduled maintenance as quickly as possible. The site will be back online shortly with all services fully operational.",
        maintenanceEndTime: settings.maintenanceEndTime || "",
      });
    }
  }, [settings, form]);
  
  // Mutation for updating settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SiteSettingsFormValues) => {
      // We know settings exist with ID 1 from our curl test
      const settingsId = 1; // Hardcode to 1 based on our testing
      console.log("Using settings ID:", settingsId);
      
      // Log the data being sent, particularly siteKeywords
      console.log("Sending data:", {
        ...data,
        siteKeywords: Array.isArray(data.siteKeywords) ? data.siteKeywords : []
      });
      
      console.log("Making API request to:", `/api/site-settings/${settingsId}`);
      
      try {
        const response = await apiRequest('PATCH', `/api/site-settings/${settingsId}`, data);
        
        console.log("API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(e => ({ message: "Unknown server error" }));
          console.error("API error response:", errorData);
          throw new Error(errorData.message || "Failed to update settings");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Request error:", error);
        throw error instanceof Error 
          ? error 
          : new Error(String(error) || "Failed to update settings");
      }
    },
    onSuccess: (data) => {
      console.log("Settings update successful:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      toast({
        title: "Settings updated",
        description: "Your site settings have been successfully updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Update failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SiteSettingsFormValues) => {
    console.log("Form submit handler called");
    console.log("Submitting form data:", data);
    
    // Form validation
    if (!data.siteName.trim()) {
      toast({
        title: "Validation Error",
        description: "Site name is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!data.siteTagline.trim()) {
      toast({
        title: "Validation Error",
        description: "Site tagline is required",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure keywords are properly formatted
    let formattedData = {
      ...data,
      // Ensure keywords is an array
      siteKeywords: Array.isArray(data.siteKeywords) ? data.siteKeywords : []
    };
    
    console.log("Formatted form data:", formattedData);
    
    // Proceed with the mutation
    updateSettingsMutation.mutate(formattedData);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error Loading Settings
          </CardTitle>
          <CardDescription>
            There was a problem loading the site settings. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" /> General
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center">
              <PaintBucket className="mr-2 h-4 w-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" /> Integrations
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Content
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" /> Membership
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" /> Maintenance
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic information about your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="siteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="siteTagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        A short description or slogan for your website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="siteDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>
                        A longer description of your website (used for SEO)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="siteKeywords"
                  render={({ field }) => {
                    // Ensure value is always an array
                    const keywords = field.value || [];
                    
                    return (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {keywords.map((keyword, index) => (
                                <div 
                                  key={index} 
                                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                  {keyword}
                                  <button
                                    type="button"
                                    className="text-secondary-foreground/70 hover:text-secondary-foreground"
                                    onClick={() => {
                                      const newKeywords = [...keywords];
                                      newKeywords.splice(index, 1);
                                      field.onChange(newKeywords);
                                    }}
                                  >
                                    <span className="sr-only">Remove</span>
                                    <span className="ml-1">×</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Add keyword and press Enter"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value && !keywords.includes(value)) {
                                      field.onChange([...keywords, value]);
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                  const value = input.value.trim();
                                  if (value && !keywords.includes(value)) {
                                    field.onChange([...keywords, value]);
                                    input.value = '';
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Keywords for SEO (press Enter after each keyword)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormDescription>
                        Email address for user inquiries
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maintenanceMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Maintenance Mode</FormLabel>
                        <FormDescription>
                          When enabled, the site will be unavailable to non-admin users
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-3">
                            <Input {...field} placeholder="https://example.com/logo.png" />
                            {field.value && (
                              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img 
                                  src={field.value} 
                                  alt="Logo preview" 
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-image.png'}
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          URL to your site logo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-3">
                            <Input {...field} placeholder="https://example.com/favicon.ico" />
                            {field.value && (
                              <div className="h-6 w-6 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img 
                                  src={field.value} 
                                  alt="Favicon preview" 
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => (e.target as HTMLImageElement).src = '/placeholder-image.png'}
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          URL to your site favicon
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-3">
                            <Input {...field} type="text" placeholder="#000000" />
                            <div 
                              className="h-8 w-8 rounded border border-gray-200" 
                              style={{ backgroundColor: field.value || '#000000' }} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Main color for your site (hex code)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-3">
                            <Input {...field} type="text" placeholder="#000000" />
                            <div 
                              className="h-8 w-8 rounded border border-gray-200" 
                              style={{ backgroundColor: field.value || '#000000' }} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Accent color for your site (hex code)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Configure third-party services and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="googleAnalyticsId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Analytics ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X" />
                      </FormControl>
                      <FormDescription>
                        Your Google Analytics tracking ID
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="facebookAppId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook App ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456789012345" />
                      </FormControl>
                      <FormDescription>
                        Used for Facebook sharing and login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="twitterUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="@username" />
                      </FormControl>
                      <FormDescription>
                        Used for Twitter cards and sharing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Settings</CardTitle>
                <CardDescription>
                  Configure content-related settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Comments</FormLabel>
                        <FormDescription>
                          Enable or disable user comments on articles
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requireCommentApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Require Comment Approval</FormLabel>
                        <FormDescription>
                          New comments require admin approval before being published
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allowUserRegistration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow User Registration</FormLabel>
                        <FormDescription>
                          Allow new users to register on the site
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Tab */}
          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>Membership & Pricing</CardTitle>
                <CardDescription>
                  Configure your membership tiers and pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="supporterTierPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supporter Tier Price (in cents)</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                            <Input {...field} type="number" min="0" step="1" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price for the Supporter tier (e.g., 200 = $2.00)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="proTierPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pro Tier Price (in cents)</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-gray-400" />
                            <Input {...field} type="number" min="0" step="1" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price for the Pro tier (e.g., 400 = $4.00)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>
                  Configure maintenance mode settings and messaging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="maintenanceMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md bg-amber-50 dark:bg-amber-950">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-semibold">Enable Maintenance Mode</FormLabel>
                        <FormDescription>
                          When enabled, only administrators can access the site. All other users will see a maintenance page.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mt-4">
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-2">Maintenance Page Content</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize the message shown to users during maintenance
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="maintenanceMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Message</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The main headline displayed on the maintenance page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maintenanceDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Message</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px]" />
                      </FormControl>
                      <FormDescription>
                        Additional details about the maintenance being performed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maintenanceEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected End Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <CalendarClock className="h-5 w-5 mr-2 text-gray-400" />
                          <Input 
                            type="datetime-local" 
                            value={field.value || ''} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={field.disabled}
                            ref={field.ref}
                            name={field.name}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        When maintenance is expected to end (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={updateSettingsMutation.isPending}
          >
            Reset
          </Button>
          <Button 
            type="button" 
            onClick={() => {
              const values = form.getValues();
              console.log("Manually submitting form with values:", values);
              // We always know there are settings with ID 1
              updateSettingsMutation.mutate(values);
            }}
            disabled={updateSettingsMutation.isPending}
            className="flex items-center"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SiteSettingsForm;