import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2, CalendarIcon, Info, FileImage } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Schema for advertisement submission
const adFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Title must be at least 5 characters.',
  }).max(50, {
    message: 'Title must not exceed 50 characters.',
  }),
  linkUrl: z.string().url({
    message: 'Please enter a valid URL.',
  }),
  placement: z.enum(['homepage', 'sidebar', 'inline']),
  startDate: z.date({
    required_error: 'Start date is required.',
  }),
  endDate: z.date({
    required_error: 'End date is required.',
  }),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date.',
  path: ['endDate'],
});

type AdFormValues = z.infer<typeof adFormSchema>;

function Advertise() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  // Default form values
  const defaultValues: Partial<AdFormValues> = {
    placement: 'sidebar',
    startDate: addDays(new Date(), 1), // tomorrow
    endDate: addDays(new Date(), 30), // 30 days from now
    imageUrl: '',
  };

  // Form definition
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues,
  });

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('imageFile', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ad creation mutation
  const createAdMutation = useMutation({
    mutationFn: async (data: AdFormValues) => {
      // If there's a file, we need to upload it first
      let imageUrl = data.imageUrl;
      
      if (data.imageFile) {
        const formData = new FormData();
        formData.append('file', data.imageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      }
      
      // Now create the advertisement
      const response = await fetch('/api/advertisements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          linkUrl: data.linkUrl,
          placement: data.placement,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          imageUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create advertisement');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Advertisement submitted',
        description: 'Your advertisement has been submitted for approval.',
      });
      navigate('/advertise/success');
    },
    onError: (error) => {
      console.error('Error creating advertisement:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit advertisement. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: AdFormValues) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to submit an advertisement.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    
    createAdMutation.mutate(data);
  };

  // Pricing information
  const pricingTiers = [
    { placement: 'Homepage', price: '$200', duration: 'per month', features: ['Prime visibility', 'Above the fold position', 'Desktop & mobile exposure'] },
    { placement: 'Sidebar', price: '$100', duration: 'per month', features: ['High visibility', 'Appears on all article pages', 'Desktop & mobile exposure'] },
    { placement: 'Inline Article', price: '$150', duration: 'per month', features: ['Contextual placement', 'Embedded in article content', 'Higher engagement rates'] },
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Advertise on Proxima Report</h1>
            <p className="mt-2 text-gray-600">
              Reach a targeted audience of space and science enthusiasts with your advertisement
            </p>
          </div>
          
          {/* Pricing Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Advertising Options</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pricingTiers.map((tier) => (
                <Card key={tier.placement} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{tier.placement}</CardTitle>
                    <CardDescription className="flex items-end gap-1">
                      <span className="text-2xl font-bold">{tier.price}</span>
                      <span className="text-gray-600">{tier.duration}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          {/* Ad Specifications */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Ad Specifications</h2>
            <Table>
              <TableCaption>Technical requirements for advertisement assets</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Placement</TableHead>
                  <TableHead>Image Size</TableHead>
                  <TableHead>File Format</TableHead>
                  <TableHead>File Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Homepage</TableCell>
                  <TableCell>1200 × 300 pixels</TableCell>
                  <TableCell>JPEG, PNG, SVG</TableCell>
                  <TableCell>Max 250KB</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sidebar</TableCell>
                  <TableCell>300 × 300 pixels</TableCell>
                  <TableCell>JPEG, PNG, SVG</TableCell>
                  <TableCell>Max 150KB</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Inline Article</TableCell>
                  <TableCell>780 × 200 pixels</TableCell>
                  <TableCell>JPEG, PNG, SVG</TableCell>
                  <TableCell>Max 200KB</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>
          
          {/* Submission Form */}
          <section className="mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-4">Submit Your Advertisement</h2>
              
              {!isAuthenticated ? (
                <div className="bg-blue-50 p-4 rounded-md mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Authentication Required</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Please <a href="/login" className="font-medium underline">log in</a> to submit an advertisement.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Advertisement Title */}
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
                            This will be used internally and for tracking purposes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Link URL */}
                    <FormField
                      control={form.control}
                      name="linkUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/your-landing-page" 
                              type="url" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The page users will visit when they click your ad.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Ad Placement */}
                    <FormField
                      control={form.control}
                      name="placement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Placement</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select where to display your ad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="homepage">Homepage</SelectItem>
                              <SelectItem value="sidebar">Sidebar</SelectItem>
                              <SelectItem value="inline">Inline Article</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose where your advertisement will appear on the site.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Start Date */}
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
                                  className="pl-3 text-left font-normal"
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            The date your ad campaign will start.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* End Date */}
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
                                  className="pl-3 text-left font-normal"
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
                                  date < new Date() || 
                                  (form.getValues().startDate && date <= form.getValues().startDate)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            The date your ad campaign will end.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <FormLabel>Advertisement Image</FormLabel>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
                        <div className="space-y-1 text-center">
                          <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 2MB
                          </p>
                        </div>
                      </div>
                      
                      {/* Image preview */}
                      {imagePreview && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Image Preview</h4>
                          <div className="border rounded-md p-2">
                            <img 
                              src={imagePreview} 
                              alt="Ad preview" 
                              className="max-h-48 max-w-full mx-auto"
                            />
                          </div>
                        </div>
                      )}
                      
                      <FormDescription>
                        Upload an image for your advertisement that meets our specifications.
                      </FormDescription>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createAdMutation.isPending}
                      >
                        {createAdMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Advertisement'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </section>
          
          {/* FAQs or Policy Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Advertising Policies</h2>
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
              <div>
                <h3 className="font-bold">Content Guidelines</h3>
                <p className="text-gray-600">All advertisements must comply with our content guidelines. We do not accept ads for prohibited items or services, or ads containing inappropriate content.</p>
              </div>
              <div>
                <h3 className="font-bold">Approval Process</h3>
                <p className="text-gray-600">All advertisements are subject to review and approval before being displayed on our site. The review process typically takes 1-2 business days.</p>
              </div>
              <div>
                <h3 className="font-bold">Performance Reporting</h3>
                <p className="text-gray-600">Advertisers will receive access to real-time performance metrics including impressions, clicks, and click-through rates once the campaign is live.</p>
              </div>
              <div>
                <h3 className="font-bold">Cancellation Policy</h3>
                <p className="text-gray-600">Campaigns can be cancelled at any time, but refunds are only issued for the unused portion of campaigns that have run for less than 25% of their scheduled duration.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Advertise;