import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple form schema
const adFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  linkUrl: z.string().url("Please enter a valid URL").min(1, "Destination URL is required"),
  imageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  placement: z.string().min(1, "Please select a placement"),
  startDate: z.date({
    required_error: "A start date is required",
  }),
  endDate: z.date({
    required_error: "An end date is required",
  }),
}).refine(data => {
  return data.endDate > data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type AdFormValues = z.infer<typeof adFormSchema>;

function Advertise() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Track authentication state manually to avoid suspension
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const isAuthenticated = !!user;
  
  // Default form values
  const defaultValues: Partial<AdFormValues> = {
    title: '',
    imageUrl: '',
    linkUrl: '',
    placement: '',
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
  };
  
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues,
  });
  
  const advertisementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/advertisements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create advertisement');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your advertisement has been submitted for review.",
      });
      navigate("/advertise-success");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "There was an error submitting your advertisement. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating advertisement:", error);
    },
  });
  
  const onSubmit = async (data: AdFormValues) => {
    console.log("Form submitted with data:", data);
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit an advertisement",
        variant: "destructive",
      });
      navigate("/login?returnTo=/advertise");
      return;
    }
    
    // Format the data for submission
    const formattedData = {
      title: data.title,
      linkUrl: data.linkUrl,
      placement: data.placement,
      imageUrl: data.imageUrl || null,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      userId: (user as any).id
    };
    
    console.log("Submitting formatted data:", formattedData);
    advertisementMutation.mutate(formattedData);
  };
  
  // Loading indicator component
  const LoadingSpinner = () => (
    <div className="flex justify-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
    </div>
  );

  // Rendering with error handling and fallbacks to prevent suspense errors
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Advertise on Proxima Report</h1>
          <p className="text-lg text-gray-600">
            Reach a targeted audience of space and science enthusiasts
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Advertisement</CardTitle>
                <CardDescription>
                  Fill out the form below to submit your advertisement for review. 
                  All ads are subject to approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authLoading ? (
                  <LoadingSpinner />
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advertisement Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a title for your advertisement" {...field} />
                            </FormControl>
                            <FormDescription>
                              This will not be displayed to users but helps us identify your ad.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="linkUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://your-website.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Where should users go when they click on your ad?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/your-image.jpg" 
                                {...field} 
                                value={field.value || ''} 
                              />
                            </FormControl>
                            <FormDescription>
                              A direct link to your advertisement image. Leave blank for text-only ads.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="placement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placement</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ad placement" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="homepage">Homepage Banner</SelectItem>
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                                <SelectItem value="article">In-Article</SelectItem>
                                <SelectItem value="newsletter">Newsletter</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Where would you like your advertisement to appear?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date()
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                When should the ad campaign start?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date <= (form.getValues().startDate || new Date())
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                When should the ad campaign end?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={advertisementMutation.isPending}
                      >
                        {advertisementMutation.isPending ? "Submitting..." : "Submit Advertisement"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Advertising Guidelines</CardTitle>
                <CardDescription>
                  What you need to know before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium mb-1">Review Process</h3>
                  <p className="text-gray-600">All advertisements are subject to review and approval before going live. This process typically takes 1-2 business days.</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Content Restrictions</h3>
                  <p className="text-gray-600">We do not accept advertisements for prohibited products/services including but not limited to illegal goods, weapons, tobacco, or adult content.</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Technical Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>Banner ads: 728×90px, max 150KB</li>
                    <li>Sidebar ads: 300×250px, max 100KB</li>
                    <li>Supported formats: JPG, PNG, GIF (non-animated)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Pricing</h3>
                  <p className="text-gray-600">Contact our team at ads@proximareport.com for current pricing information based on placement and duration.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Advertise;