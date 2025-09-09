import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsTracker } from '@/lib/analytics';
import { BannerAd, InContentAd } from '@/components/AdPlacement';
import SEO from '@/components/SEO';
import { generateTopicsSEO } from '@/lib/seoUtils';

import { 
  Search, 
  Tag, 
  TrendingUp,
  BookOpen,
  Users,
  Calendar,
  ArrowRight,
  Grid3X3,
  List,
  Filter,
  Star,
  Zap,
  Globe,
  Rocket,
  Telescope,
  Atom,
  Microscope,
  Cpu,
  Database,
  Network
} from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
}

interface TopicsResponse {
  topics: Topic[];
  total: number;
}

const Topics: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'popularity'>('name');
  const queryClient = useQueryClient();

  // Utility function to safely render values
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      console.error('Attempted to render object as string:', value);
      return '[Object]';
    }
    return String(value);
  };

  // Clear only specific topic-related caches on mount (no infinite loop)
  useEffect(() => {
    // Clear only the old topic caches, not all caches
    queryClient.removeQueries({ queryKey: ['topics'] });
    queryClient.removeQueries({ queryKey: ['topics-v'] });
    queryClient.removeQueries({ queryKey: ['topics-v6'] });
    queryClient.removeQueries({ queryKey: ['topics-v7'] });
    queryClient.removeQueries({ queryKey: ['/api/ghost/tags'] });
    queryClient.removeQueries({ queryKey: ['/api/ghost/tags/clean'] });
    queryClient.removeQueries({ queryKey: ['/api/tags'] });
    queryClient.removeQueries({ queryKey: ['/api/tags/published'] });
  }, []); // Empty dependency array to run only once

  // Fetch topics from Ghost API - NOW USING REAL TAGS
  const { data: topicsData, isLoading, error } = useQuery<Topic[]>({
    queryKey: ['topics-real-ghost'], // Changed to force fresh fetch
    queryFn: async () => {
      console.log('Fetching real tags from Ghost API');
      
      try {
        const response = await fetch('/api/ghost/tags');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        const data = await response.json();
        console.log('Real Ghost tags response:', data);
        
        // Transform Ghost tags to Topic format
        const topics = data.map((tag: any) => ({
          id: String(tag.id),
          name: String(tag.name),
          slug: String(tag.slug),
          description: tag.description ? String(tag.description) : '',
          articleCount: typeof tag.articleCount === 'number' ? tag.articleCount : 0
        }));
        
        console.log('Transformed topics:', topics);
        return topics;
      } catch (error) {
        console.error('Error fetching real tags, using fallback:', error);
        
        // Fallback to a few key topics that we know exist
        const fallbackTopics = [
          {
            id: '1',
            name: 'Astronomy',
            slug: 'astronomy',
            description: 'Stellar observations, planetary science, and cosmic phenomena',
            articleCount: 11
          },
          {
            id: '2',
            name: 'Aerospace',
            slug: 'aerospace',
            description: 'Aerospace engineering and space vehicle technology',
            articleCount: 113
          },
          {
            id: '3',
            name: 'Space Exploration',
            slug: 'space-exploration',
            description: 'Manned spaceflight, missions to celestial bodies, and planetary research',
            articleCount: 47
          },
          {
            id: '4',
            name: 'NASA',
            slug: 'nasa',
            description: 'Articles related to NASA, the space agency of the United States',
            articleCount: 43
          },
          {
            id: '5',
            name: 'SpaceX',
            slug: 'spacex',
            description: 'Articles about the American aerospace company SpaceX',
            articleCount: 66
          },
          {
            id: '6',
            name: 'Launches',
            slug: 'launches',
            description: 'Rocket launches and space missions',
            articleCount: 71
          }
        ];
        
        console.log('Returning fallback topics data:', fallbackTopics);
        return fallbackTopics;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Allow one retry
  });

  // Filter and sort topics
  const filteredAndSortedTopics = React.useMemo(() => {
    if (!topicsData || !Array.isArray(topicsData)) {
      console.log('No valid topics data available');
      return [];
    }
    
    console.log('=== FILTERING TOPICS ===');
    console.log('Topics data length:', topicsData.length);
    console.log('First topic before filtering:', topicsData[0]);
    
    // Check for any objects in the data that shouldn't be there
    const hasInvalidObjects = topicsData.some(topic => {
      if (!topic || typeof topic !== 'object') return true;
      const keys = Object.keys(topic);
      return keys.length > 10 || keys.some(key => 
        topic[key] !== null && topic[key] !== undefined && typeof topic[key] === 'object'
      );
    });
    
    if (hasInvalidObjects) {
      console.error('Detected invalid objects in topics data, returning empty array');
      return [];
    }
    
    let filtered = topicsData.filter(topic => {
      if (!topic || typeof topic !== 'object' || !topic.name) {
        console.warn('Filtering out invalid topic:', topic);
        return false;
      }
      return topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()));
    });
    
    console.log('Filtered topics length:', filtered.length);
    console.log('First filtered topic:', filtered[0]);
    
    // Sort topics
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by article count (if available) or alphabetically
        const aCount = a.articleCount || 0;
        const bCount = b.articleCount || 0;
        if (aCount !== bCount) {
          return bCount - aCount;
        }
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [topicsData, searchQuery, sortBy]);

  // Get topic icon based on name
  const getTopicIcon = (topicName: string) => {
    const name = topicName.toLowerCase();
    if (name.includes('space') || name.includes('astronomy') || name.includes('cosmos')) return <Telescope className="h-5 w-5" />;
    if (name.includes('rocket') || name.includes('launch') || name.includes('mission')) return <Rocket className="h-5 w-5" />;
    if (name.includes('technology') || name.includes('tech') || name.includes('ai')) return <Cpu className="h-5 w-5" />;
    if (name.includes('science') || name.includes('research') || name.includes('physics')) return <Atom className="h-5 w-5" />;
    if (name.includes('biology') || name.includes('life') || name.includes('medical')) return <Microscope className="h-5 w-5" />;
    if (name.includes('data') || name.includes('analysis') || name.includes('computing')) return <Database className="h-5 w-5" />;
    if (name.includes('network') || name.includes('communication') || name.includes('satellite')) return <Network className="h-5 w-5" />;
    if (name.includes('education') || name.includes('learning') || name.includes('stem')) return <BookOpen className="h-5 w-5" />;
    if (name.includes('trending') || name.includes('popular') || name.includes('news')) return <TrendingUp className="h-5 w-5" />;
    return <Tag className="h-5 w-5" />;
  };

  // Get topic color based on name
  const getTopicColor = (topicName: string) => {
    const name = topicName.toLowerCase();
    if (name.includes('space') || name.includes('astronomy')) return 'from-purple-500 to-indigo-600';
    if (name.includes('rocket') || name.includes('launch')) return 'from-orange-500 to-red-600';
    if (name.includes('technology') || name.includes('tech')) return 'from-blue-500 to-cyan-600';
    if (name.includes('science') || name.includes('research')) return 'from-green-500 to-emerald-600';
    if (name.includes('education') || name.includes('learning')) return 'from-yellow-500 to-orange-600';
    if (name.includes('trending') || name.includes('news')) return 'from-pink-500 to-rose-600';
    return 'from-gray-500 to-slate-600';
  };

  // Track page view for analytics
  useEffect(() => {
    analyticsTracker.trackPageView('/topics');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-800">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <Skeleton className="h-12 w-64 mx-auto mb-4 bg-gray-800" />
              <Skeleton className="h-6 w-96 mx-auto bg-gray-800" />
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <Skeleton className="h-10 w-80 bg-gray-800" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20 bg-gray-800" />
                <Skeleton className="h-10 w-20 bg-gray-800" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Tag className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Unable to Load Topics</h2>
          <p className="text-gray-400 mb-6">
            We're having trouble connecting to our content system. This might be due to:
          </p>
          <ul className="text-gray-500 text-sm mb-6 text-left space-y-2">
            <li>• Ghost CMS connection issues</li>
            <li>• Network connectivity problems</li>
            <li>• Server configuration issues</li>
          </ul>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER WITH REAL GHOST TAGS
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Topics & Categories</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedTopics.map((topic, index) => {
            // Ultra-safe rendering - only render if topic is completely clean
            if (!topic || typeof topic !== 'object' || !topic.id || !topic.name || !topic.slug) {
              console.error(`Invalid topic at index ${index}:`, topic);
              return null;
            }
            
            // Check for any Ghost properties
            const hasGhostProperties = topic.feature_image || topic.visibility || topic.og_image || 
              topic.og_title || topic.og_description || topic.twitter_image || topic.twitter_title || 
              topic.twitter_description || topic.meta_title || topic.meta_description || 
              topic.codeinjection_head || topic.codeinjection_foot || topic.canonical_url || 
              topic.accent_color;
            
            if (hasGhostProperties) {
              console.error(`Topic at index ${index} contains Ghost properties:`, topic);
              return null;
            }
            
            // Ultra-safe topic object
            const safeTopic = {
              id: String(topic.id),
              name: String(topic.name),
              slug: String(topic.slug),
              description: topic.description ? String(topic.description) : '',
              articleCount: typeof topic.articleCount === 'number' ? topic.articleCount : 0
            };
            
            return (
              <div key={safeTopic.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {safeTopic.name}
                </h3>
                {safeTopic.description && (
                  <p className="text-gray-400 text-sm mb-4">
                    {safeTopic.description}
                  </p>
                )}
                <Link href={`/tag/${safeTopic.slug}`}>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors">
                    Explore Topic
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Topics;
