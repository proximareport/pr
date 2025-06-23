import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';
import { AlertTriangle, CheckCircle, Eye, Trash2, XCircle, Building2, MapPin, DollarSign, ExternalLink, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobListing {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
  applicationUrl?: string;
  createdAt: string;
  expiresAt?: string;
  userId: number;
  isApproved: boolean;
  category: string;
  user?: {
    username: string;
    email: string;
  };
}

const JOB_CATEGORIES = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'science', label: 'Science & Research' },
  { value: 'management', label: 'Management' },
  { value: 'operations', label: 'Operations' },
  { value: 'internship', label: 'Internships' },
  { value: 'remote', label: 'Remote' },
  { value: 'other', label: 'Other' }
];

function JobListingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewJob, setPreviewJob] = useState<JobListing | null>(null);
  const [jobToReject, setJobToReject] = useState<JobListing | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  
  // Form state for posting new job (admin only)
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    applicationUrl: '',
    category: 'engineering',
    expiresAt: ''
  });

  // Fetch all job listings including unapproved ones
  const { data: jobs = [], isLoading } = useQuery<JobListing[]>({
    queryKey: ['/api/admin/job-listings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/job-listings?includeUnapproved=true');
      return await response.json();
    },
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return await apiRequest('POST', `/api/job-listings/${jobId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-listings'] });
      toast({
        title: 'Success',
        description: 'Job listing approved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to approve job listing',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return await apiRequest('DELETE', `/api/job-listings/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-listings'] });
      toast({
        title: 'Success',
        description: 'Job listing deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete job listing',
        variant: 'destructive',
      });
    },
  });

  // Post new job mutation (admin only - auto-approved)
  const postJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      // Add company as "Proxima Report" since all jobs are for Proxima Report
      const jobWithCompany = {
        ...jobData,
        company: 'Proxima Report'
      };
      const response = await apiRequest('POST', '/api/job-listings', jobWithCompany);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-listings'] });
      setIsPostJobOpen(false);
      setJobForm({
        title: '',
        description: '',
        location: '',
        salary: '',
        applicationUrl: '',
        category: 'engineering',
        expiresAt: ''
      });
      toast({
        title: 'Success',
        description: 'Job posted successfully for Proxima Report!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to post job',
        variant: 'destructive',
      });
    },
  });

  const getPendingJobs = () => Array.isArray(jobs) ? jobs.filter((job: JobListing) => !job.isApproved) : [];
  const getApprovedJobs = () => Array.isArray(jobs) ? jobs.filter((job: JobListing) => job.isApproved) : [];
  const getExpiredJobs = () => {
    if (!Array.isArray(jobs)) return [];
    const now = new Date();
    return jobs.filter((job: JobListing) => 
      job.expiresAt && new Date(job.expiresAt) < now
    );
  };

  const handleApprove = (jobId: number) => {
    approveMutation.mutate(jobId);
  };

  const handleDelete = (jobId: number) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this job listing? This action cannot be undone.');
    if (isConfirmed) {
      deleteMutation.mutate(jobId);
    }
  };

  const handlePreview = (job: JobListing) => {
    setPreviewJob(job);
  };

  const handlePostJob = () => {
    // Validate required fields
    if (!jobForm.title || !jobForm.description || !jobForm.location) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields (title, description, location)',
        variant: 'destructive',
      });
      return;
    }

    // Clean up the form data - convert empty strings to null/undefined for optional fields
    const cleanedJobForm = {
      ...jobForm,
      salary: jobForm.salary || undefined,
      applicationUrl: jobForm.applicationUrl || undefined,
      expiresAt: jobForm.expiresAt || undefined,
    };

    postJobMutation.mutate(cleanedJobForm);
  };

  const getCategoryLabel = (category: string) => {
    return JOB_CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  const isJobExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const renderJobTable = (jobList: JobListing[], showApprovalActions = false) => {
    if (jobList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No job listings found in this category.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Details</TableHead>
            <TableHead>Company & Location</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobList.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{job.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {job.description.substring(0, 100)}...
                  </div>
                  {job.salary && (
                    <div className="text-sm text-green-600 mt-1">
                      <DollarSign className="h-3 w-3 inline mr-1" />
                      {job.salary}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{job.location}</span>
                  </div>
                  {job.user && (
                    <div className="text-xs text-muted-foreground mt-1">
                      by {job.user.username}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getCategoryLabel(job.category)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDistance(new Date(job.createdAt), new Date(), { addSuffix: true })}
                </div>
                {job.expiresAt && (
                  <div className="text-xs text-muted-foreground">
                    Expires: {formatDistance(new Date(job.expiresAt), new Date(), { addSuffix: true })}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {job.isApproved ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Pending
                    </Badge>
                  )}
                  {isJobExpired(job.expiresAt) && (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      Expired
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(job)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {showApprovalActions && !job.isApproved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleApprove(job.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(job.id)}
                    disabled={deleteMutation.isPending}
                  >
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Listings Management</CardTitle>
              <CardDescription>
                Review and manage job listings. Post new jobs for Proxima Report.
              </CardDescription>
            </div>
            <Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post New Job for Proxima Report</DialogTitle>
                  <DialogDescription>
                    Create a new job listing for Proxima Report. This will be automatically approved.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                      className="mt-1"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={jobForm.location}
                        onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                        className="mt-1"
                        placeholder="e.g. New York, NY or Remote"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary">Salary Range</Label>
                      <Input
                        id="salary"
                        value={jobForm.salary}
                        onChange={(e) => setJobForm({...jobForm, salary: e.target.value})}
                        className="mt-1"
                        placeholder="e.g. $120k - $180k"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={jobForm.category} onValueChange={(value) => setJobForm({...jobForm, category: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiresAt">Expires (Optional)</Label>
                      <Input
                        id="expiresAt"
                        type="date"
                        value={jobForm.expiresAt}
                        onChange={(e) => setJobForm({...jobForm, expiresAt: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="applicationUrl">Application URL</Label>
                    <Input
                      id="applicationUrl"
                      value={jobForm.applicationUrl}
                      onChange={(e) => setJobForm({...jobForm, applicationUrl: e.target.value})}
                      className="mt-1"
                      placeholder="https://proximareport.com/careers/job-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                      className="mt-1 min-h-32"
                      placeholder="Describe the role, responsibilities, requirements, and benefits..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPostJobOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePostJob} 
                    disabled={postJobMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {postJobMutation.isPending ? 'Posting...' : 'Post Job'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex gap-2 items-center">
                <AlertTriangle className="h-4 w-4" />
                Pending ({getPendingJobs().length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex gap-2 items-center">
                <CheckCircle className="h-4 w-4" />
                Approved ({getApprovedJobs().length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex gap-2 items-center">
                <XCircle className="h-4 w-4" />
                Expired ({getExpiredJobs().length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
              {renderJobTable(getPendingJobs(), true)}
            </TabsContent>
            
            <TabsContent value="approved" className="mt-6">
              {renderJobTable(getApprovedJobs())}
            </TabsContent>
            
            <TabsContent value="expired" className="mt-6">
              {renderJobTable(getExpiredJobs())}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Job Preview Dialog */}
      <Dialog open={!!previewJob} onOpenChange={() => setPreviewJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Listing Preview</DialogTitle>
            <DialogDescription>
              Review the complete job listing details
            </DialogDescription>
          </DialogHeader>
          {previewJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{previewJob.title}</h3>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Building2 className="h-4 w-4 mr-1" />
                    {previewJob.company}
                  </div>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {previewJob.location}
                  </div>
                  {previewJob.salary && (
                    <div className="flex items-center text-green-600 mt-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {previewJob.salary}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {getCategoryLabel(previewJob.category)}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Posted {formatDistance(new Date(previewJob.createdAt), new Date(), { addSuffix: true })}
                  </div>
                  {previewJob.expiresAt && (
                    <div className="text-sm text-muted-foreground">
                      Expires {formatDistance(new Date(previewJob.expiresAt), new Date(), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Job Description</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="whitespace-pre-wrap">{previewJob.description}</p>
                </div>
              </div>
              
              {previewJob.applicationUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Application URL</h4>
                  <a 
                    href={previewJob.applicationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {previewJob.applicationUrl}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              
              {previewJob.user && (
                <div>
                  <h4 className="font-semibold mb-2">Posted by</h4>
                  <p>{previewJob.user.username} ({previewJob.user.email})</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex items-center justify-between">
            {previewJob && !previewJob.isApproved && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-green-500 text-green-600" 
                  onClick={() => previewJob && handleApprove(previewJob.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> 
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            )}
            <Button variant="outline" className="ml-auto" onClick={() => setPreviewJob(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JobListingsTab; 