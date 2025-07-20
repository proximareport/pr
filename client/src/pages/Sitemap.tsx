import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  MapIcon, 
  FileTextIcon, 
  RocketIcon, 
  StarIcon, 
  BriefcaseIcon, 
  UsersIcon,
  TagIcon,
  ShieldCheckIcon,
  HomeIcon,
  SearchIcon,
  UserIcon,
  SettingsIcon,
  MonitorIcon,
  CalendarIcon,
  ImageIcon,
  Newspaper,
  Globe,
  ChevronRightIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface SitemapData {
  articles: Array<{
    id: number;
    title: string;
    slug: string;
    publishedAt: string;
    category: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    count: number;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    count: number;
  }>;
  jobListings: Array<{
    id: number;
    title: string;
    company: string;
    location: string;
    createdAt: string;
  }>;
  stats: {
    totalArticles: number;
    totalCategories: number;
    totalTags: number;
    totalJobs: number;
    lastUpdated: string;
  };
}

const Sitemap: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: sitemapData, isLoading, error } = useQuery<SitemapData>({
    queryKey: ['sitemap-data'],
    queryFn: async () => {
      const response = await fetch('/api/sitemap-data');
      if (!response.ok) {
        throw new Error('Failed to fetch sitemap data');
      }
      return response.json();
    },
  });

  // Static navigation items
  const mainNavigation = [
    { name: 'Home', href: '/', icon: HomeIcon, description: 'Latest space news and featured articles' },
    { name: 'Articles', href: '/articles', icon: FileTextIcon, description: 'Browse all published articles' },
    { name: 'Launches', href: '/launches', icon: RocketIcon, description: 'Upcoming and past space launches' },
    { name: 'Astronomy', href: '/astronomy', icon: StarIcon, description: 'Astronomical events and sky maps' },
    { name: 'Mission Control', href: '/missioncontrol', icon: MonitorIcon, description: 'Space mission tracking and data' },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon, description: 'Space industry career opportunities' },
    { name: 'Gallery', href: '/gallery', icon: ImageIcon, description: 'Space photography and media gallery' },
  ];

  const userPages = [
    { name: 'Login', href: '/login', icon: UserIcon, description: 'Sign in to your account' },
    { name: 'Register', href: '/register', icon: UsersIcon, description: 'Create a new account' },
    { name: 'Profile', href: '/profile', icon: UserIcon, description: 'View and edit your profile' },
    { name: 'Edit Profile', href: '/edit-profile', icon: SettingsIcon, description: 'Update your profile information' },
    { name: 'Subscribe', href: '/subscribe', icon: Newspaper, description: 'Subscribe to our newsletter' },
  ];

  const businessPages = [
    { name: 'Advertise', href: '/advertise', icon: Globe, description: 'Advertise with Proxima Report' },
    { name: 'Advertiser Dashboard', href: '/advertiser-dashboard', icon: SettingsIcon, description: 'Manage your advertisements' },
  ];

  const supportPages = [
    { name: 'Newsletter Verify', href: '/newsletter/verify', icon: ShieldCheckIcon, description: 'Verify your newsletter subscription' },
    { name: 'Newsletter Unsubscribe', href: '/newsletter/unsubscribe', icon: ShieldCheckIcon, description: 'Unsubscribe from newsletter' },
  ];

  const filteredArticles = sitemapData?.articles?.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = sitemapData?.categories || [];
  const tags = sitemapData?.tags || [];
  const jobListings = sitemapData?.jobListings || [];
  const stats = sitemapData?.stats;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Sitemap</h1>
            <p className="text-red-400">Error loading sitemap data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <MapIcon className="w-12 h-12 text-cyan-400 mr-4" />
            <h1 className="text-4xl font-bold text-white">Sitemap</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore all pages and content on Proxima Report - your gateway to space exploration
          </p>
          {stats && (
            <div className="mt-6 flex justify-center space-x-6 text-sm text-gray-400">
              <span>{stats.totalArticles} Articles</span>
              <span>{stats.totalCategories} Categories</span>
              <span>{stats.totalTags} Tags</span>
              <span>{stats.totalJobs} Jobs</span>
              <span>Updated: {new Date(stats.lastUpdated).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="pages" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
            <TabsTrigger value="pages" className="text-white">Main Pages</TabsTrigger>
            <TabsTrigger value="articles" className="text-white">Articles</TabsTrigger>
            <TabsTrigger value="categories" className="text-white">Categories</TabsTrigger>
            <TabsTrigger value="tags" className="text-white">Tags</TabsTrigger>
            <TabsTrigger value="jobs" className="text-white">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-8">
            {/* Main Navigation */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <HomeIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Main Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mainNavigation.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center p-4 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                        <item.icon className="w-5 h-5 text-cyan-400 mr-3 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto group-hover:text-cyan-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Pages */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  User Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPages.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center p-4 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                        <item.icon className="w-5 h-5 text-cyan-400 mr-3 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto group-hover:text-cyan-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Business Pages */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-cyan-400" />
                  Business Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessPages.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center p-4 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                        <item.icon className="w-5 h-5 text-cyan-400 mr-3 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto group-hover:text-cyan-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Support Pages */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShieldCheckIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Support Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportPages.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center p-4 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                        <item.icon className="w-5 h-5 text-cyan-400 mr-3 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto group-hover:text-cyan-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileTextIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Articles
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4 bg-gray-700" />
                        <Skeleton className="h-4 flex-1 bg-gray-700" />
                        <Skeleton className="h-4 w-24 bg-gray-700" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredArticles.map((article) => (
                      <Link key={article.id} href={`/article/${article.slug}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                          <div className="flex items-center space-x-3">
                            <FileTextIcon className="w-4 h-4 text-cyan-400" />
                            <div>
                              <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                                {article.title}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {article.category} • {new Date(article.publishedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TagIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-16 bg-gray-700" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <Link key={category.id} href={`/category/${category.slug}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                          <div>
                            <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-400">{category.count} articles</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TagIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(20)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-20 bg-gray-700" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link key={tag.id} href={`/tag/${tag.slug}`}>
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-cyan-400 hover:text-gray-900 transition-colors"
                        >
                          {tag.name} ({tag.count})
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-cyan-400" />
                  Job Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4 bg-gray-700" />
                        <Skeleton className="h-4 flex-1 bg-gray-700" />
                        <Skeleton className="h-4 w-24 bg-gray-700" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobListings.map((job) => (
                      <Link key={job.id} href={`/jobs#job-${job.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors cursor-pointer group">
                          <div className="flex items-center space-x-3">
                            <BriefcaseIcon className="w-4 h-4 text-cyan-400" />
                            <div>
                              <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                                {job.title}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {job.company} • {job.location} • {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/sitemap.xml" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center"><ExternalLinkIcon className="w-3 h-3 mr-1" />XML Sitemap</Link></li>
                <li><Link href="/robots.txt" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center"><ExternalLinkIcon className="w-3 h-3 mr-1" />Robots.txt</Link></li>
                <li><Link href="/rss" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center"><ExternalLinkIcon className="w-3 h-3 mr-1" />RSS Feed</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-cyan-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors">About</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap; 