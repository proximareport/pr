import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed job posting imports - handled in admin dashboard
import { Link } from 'wouter';
import { MapPin, Building2, DollarSign, Calendar, ExternalLink, Briefcase } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface JobListing {
  id: number;
  title: string;
  company: string; // Always "Proxima Report" - set by admin
  description: string;
  location: string;
  salary?: string;
  applicationUrl?: string;
  createdAt: string;
  expiresAt?: string;
  userId: number;
  isApproved: boolean;
  category: string;
}

const JOB_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'science', label: 'Science & Research' },
  { value: 'management', label: 'Management' },
  { value: 'operations', label: 'Operations' },
  { value: 'internship', label: 'Internships' },
  { value: 'remote', label: 'Remote' },
  { value: 'other', label: 'Other' }
];

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch job listings
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['/api/job-listings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/job-listings');
      return await response.json();
    },
  });

  // Job posting mutation removed - handled in admin dashboard

  // Filter jobs based on search and category
  const filteredJobs = Array.isArray(jobs) ? jobs.filter((job: JobListing) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  // Job posting function removed - handled in admin dashboard

  const formatSalary = (salary?: string) => {
    if (!salary) return null;
    return salary;
  };

  const isJobExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join Proxima Report</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover exciting career opportunities in aerospace, space technology, and scientific research
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search jobs by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="lg:w-64 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {JOB_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-white">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-slate-300">Loading jobs...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error loading jobs</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No jobs found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Check back soon for exciting opportunities at Proxima Report!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job: JobListing) => (
              <Card key={job.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">{job.title}</CardTitle>
                      <div className="flex items-center text-slate-300 mb-2">
                        <Building2 className="h-4 w-4 mr-2" />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center text-slate-300 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{job.location}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center text-slate-300">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{formatSalary(job.salary)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        {JOB_CATEGORIES.find(cat => cat.value === job.category)?.label || job.category}
                      </Badge>
                      {isJobExpired(job.expiresAt) && (
                        <Badge variant="outline" className="border-red-500 text-red-400">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300 line-clamp-3">
                    {job.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Posted {formatDistance(new Date(job.createdAt), new Date(), { addSuffix: true })}</span>
                  </div>
                  {!isJobExpired(job.expiresAt) && (
                    job.applicationUrl ? (
                      <Button 
                        asChild 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                          Apply <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="border-slate-600 text-slate-200">
                        <Link href="/careers">Apply</Link>
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {filteredJobs.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-slate-400">
              Showing {filteredJobs.length} of {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` in ${JOB_CATEGORIES.find(cat => cat.value === selectedCategory)?.label}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 