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
}

const Sitemap: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sitemapData, isLoading, error } = useQuery<SitemapData>({
    queryKey: ['sitemap'],
    queryFn: async () => {
      const response = await fetch('/api/sitemap-data');
      if (!response.ok) {
        throw new Error('Failed to fetch sitemap data');
      }
      return response.json();
    }
  });

  // Main navigation pages
  const mainPages = [
    { name: 'Home', path: '/', icon: HomeIcon, description: 'Main landing page with latest articles' },
    { name: 'About', path: '/about', icon: UserIcon, description: 'Learn about our mission and team' },
    { name: 'Contact', path: '/contact', icon: UsersIcon, description: 'Get in touch with our team' },
    { name: 'Subscribe', path: '/subscribe', icon: StarIcon, description: 'Join our newsletter and community' },
    { name: 'Gallery', path: '/gallery', icon: ImageIcon, description: 'Stunning space photography' },
    { name: 'Astronomy Portal', path: '/astronomy', icon: RocketIcon, description: 'Interactive astronomy tools and sky maps' },
    { name: 'Jobs', path: '/jobs', icon: BriefcaseIcon, description: 'Career opportunities in STEM and space' },
    { name: 'Privacy Policy', path: '/privacy', icon: ShieldCheckIcon, description: 'How we protect your privacy' },
    { name: 'Terms of Service', path: '/terms', icon: SettingsIcon, description: 'Terms and conditions' },
    { name: 'Cookie Policy', path: '/cookies', icon: MonitorIcon, description: 'Our cookie usage policy' }
  ];

  // User pages
  const userPages = [
    { name: 'Login', path: '/login', icon: UserIcon, description: 'Sign in to your account' },
    { name: 'Register', path: '/register', icon: UsersIcon, description: 'Create a new account' },
    { name: 'Profile', path: '/profile', icon: UserIcon, description: 'View and edit your profile' },
    { name: 'Edit Profile', path: '/profile/edit', icon: SettingsIcon, description: 'Update your account settings' }
  ];

  // Special pages
  const specialPages = [
    { name: 'Mission Control', path: '/mission-control', icon: RocketIcon, description: 'User dashboard and settings' },
    { name: 'Newsletter Verify', path: '/newsletter/verify', icon: CalendarIcon, description: 'Email verification page' },
    { name: 'Newsletter Unsubscribe', path: '/newsletter/unsubscribe', icon: CalendarIcon, description: 'Unsubscribe from newsletter' },
    { name: 'Advertise', path: '/advertise', icon: Newspaper, description: 'Advertising opportunities' },
    { name: 'Advertiser Dashboard', path: '/advertiser-dashboard', icon: SettingsIcon, description: 'Manage your advertisements' },
    { name: 'Advertise Success', path: '/advertise-success', icon: StarIcon, description: 'Advertisement submission confirmation' },
    { name: 'Subscription Success', path: '/subscription-success', icon: StarIcon, description: 'Subscription confirmation' }
  ];

  // Filter function for search
  const filterItems = (items: any[], searchTerm: string) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Sitemap</h1>
            <p className="text-white/70">Error loading sitemap data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Geometric ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Site <span className="text-purple-400">Map</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
            Navigate through all sections of Proxima Report. Discover articles, features, and resources 
            for your space exploration journey.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                type="text"
                placeholder="Search sitemap..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder-white/50 focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 border border-purple-500/20">
            <TabsTrigger value="main" className="data-[state=active]:bg-purple-600 text-white">Main Pages</TabsTrigger>
            <TabsTrigger value="articles" className="data-[state=active]:bg-purple-600 text-white">Articles</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-purple-600 text-white">Categories</TabsTrigger>
            <TabsTrigger value="user" className="data-[state=active]:bg-purple-600 text-white">User & Special</TabsTrigger>
          </TabsList>

          {/* Main Pages */}
          <TabsContent value="main">
            <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
              <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                <CardTitle className="text-2xl text-white flex items-center">
                  <HomeIcon className="w-6 h-6 mr-2 text-purple-400" />
                  Main Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterItems(mainPages, searchTerm).map((page) => (
                    <Link key={page.path} href={page.path}>
                      <Card className="bg-white/5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <page.icon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold text-white mb-1">{page.name}</h3>
                              <p className="text-sm text-white/70 leading-relaxed">{page.description}</p>
                              <div className="flex items-center mt-2 text-xs text-purple-300">
                                <span>{page.path}</span>
                                <ExternalLinkIcon className="w-3 h-3 ml-1" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles */}
          <TabsContent value="articles">
            <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
              <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                <CardTitle className="text-2xl text-white flex items-center">
                  <FileTextIcon className="w-6 h-6 mr-2 text-purple-400" />
                  Articles
                  {sitemapData && (
                    <Badge variant="outline" className="ml-2 border-purple-500/50 text-purple-300">
                      {sitemapData.articles.length} articles
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-white/10" />
                    ))}
                  </div>
                ) : sitemapData?.articles.length === 0 ? (
                  <p className="text-white/70 text-center py-8">No articles found.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filterItems(sitemapData?.articles || [], searchTerm).map((article) => (
                      <Link key={article.id} href={`/articles/${article.slug}`}>
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-purple-500/20 rounded-lg hover:border-purple-400/40 transition-all duration-300 cursor-pointer">
                          <div className="flex-1">
                            <h3 className="font-medium text-white mb-1">{article.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                              {article.category && (
                                <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                                  {article.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-white/40" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
              <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                <CardTitle className="text-2xl text-white flex items-center">
                  <TagIcon className="w-6 h-6 mr-2 text-purple-400" />
                  Categories & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Skeleton className="h-6 w-24 mb-3 bg-white/10" />
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full bg-white/10" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-6 w-16 mb-3 bg-white/10" />
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full bg-white/10" />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Categories */}
                    <div>
                      <h3 className="text-lg font-semibold text-purple-300 mb-4">Categories</h3>
                      {sitemapData?.categories.length === 0 ? (
                        <p className="text-white/70">No categories found.</p>
                      ) : (
                        <div className="space-y-2">
                          {filterItems(sitemapData?.categories || [], searchTerm).map((category) => (
                            <Link key={category.id} href={`/category/${category.slug}`}>
                              <div className="flex items-center justify-between p-3 bg-white/5 border border-purple-500/20 rounded-lg hover:border-purple-400/40 transition-all duration-300 cursor-pointer">
                                <span className="text-white">{category.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                                    {category.count} articles
                                  </Badge>
                                  <ChevronRightIcon className="w-4 h-4 text-white/40" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <h3 className="text-lg font-semibold text-purple-300 mb-4">Tags</h3>
                      {sitemapData?.tags.length === 0 ? (
                        <p className="text-white/70">No tags found.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {filterItems(sitemapData?.tags || [], searchTerm).map((tag) => (
                            <Link key={tag.id} href={`/tag/${tag.slug}`}>
                              <div className="flex items-center justify-between p-2 bg-white/5 border border-purple-500/20 rounded-lg hover:border-purple-400/40 transition-all duration-300 cursor-pointer">
                                <span className="text-white text-sm">{tag.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                                    {tag.count}
                                  </Badge>
                                  <ChevronRightIcon className="w-3 h-3 text-white/40" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User & Special Pages */}
          <TabsContent value="user">
            <div className="grid gap-6">
              
              {/* User Pages */}
              <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
                <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                  <CardTitle className="text-xl text-white flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-purple-400" />
                    User Account Pages
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    {filterItems(userPages, searchTerm).map((page) => (
                      <Link key={page.path} href={page.path}>
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-purple-500/20 rounded-lg hover:border-purple-400/40 transition-all duration-300 cursor-pointer">
                          <page.icon className="w-4 h-4 text-purple-400" />
                          <div className="flex-1">
                            <span className="text-white font-medium">{page.name}</span>
                            <p className="text-xs text-white/60 mt-1">{page.description}</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-white/40" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Special Pages */}
              <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20">
                <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
                  <CardTitle className="text-xl text-white flex items-center">
                    <RocketIcon className="w-5 h-5 mr-2 text-purple-400" />
                    Special Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    {filterItems(specialPages, searchTerm).map((page) => (
                      <Link key={page.path} href={page.path}>
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-purple-500/20 rounded-lg hover:border-purple-400/40 transition-all duration-300 cursor-pointer">
                          <page.icon className="w-4 h-4 text-purple-400" />
                          <div className="flex-1">
                            <span className="text-white font-medium">{page.name}</span>
                            <p className="text-xs text-white/60 mt-1">{page.description}</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-white/40" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        {sitemapData && (
          <Card className="bg-white/5 backdrop-blur-sm border border-purple-500/20 mt-8">
            <CardHeader className="border-b border-purple-500/20 bg-purple-900/10">
              <CardTitle className="text-xl text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-400" />
                Site Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-300">{sitemapData.articles.length}</div>
                  <div className="text-sm text-white/70">Published Articles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-300">{sitemapData.categories.length}</div>
                  <div className="text-sm text-white/70">Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-300">{sitemapData.tags.length}</div>
                  <div className="text-sm text-white/70">Tags</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-300">{mainPages.length + userPages.length + specialPages.length}</div>
                  <div className="text-sm text-white/70">Total Pages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* XML Sitemap */}
        <div className="text-center mt-8">
          <p className="text-white/60 mb-4">
            For search engines and automated tools, access our XML sitemap:
          </p>
          <Button asChild variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-900/20">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              View XML Sitemap
              <ExternalLinkIcon className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Sitemap; 