import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  FileText,
  Home,
  Settings,
  Users,
  Archive,
  AlertTriangle,
  Tag,
  BookOpenCheck,
  Image,
  Briefcase,
  MessageSquare,
  DollarSign,
  BellRing,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Always call useQuery before any conditional returns
  // This ensures hooks are called in the same order every render
  const { data: advertisements = [] } = useQuery({
    queryKey: ['/api/advertisements/all'],
    retry: false,
    // Only fetch if the user is admin or editor
    enabled: !!user && (['admin', 'editor'].includes(String(user.role))),
    // Add a staleTime to prevent unnecessary refetches
    staleTime: 60 * 1000 // 1 minute
  });
  
  // Redirect to login if not authenticated or not an admin/editor
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'editor'))) {
      navigate('/login?returnTo=/admin');
    }
  }, [user, isLoading, navigate]);

  // Count pending advertisements that need review - must be calculated after hooks but before conditionals
  const pendingAdsCount = (Array.isArray(advertisements) && user && ['admin', 'editor'].includes(String(user.role)))
    ? advertisements.filter((ad: any) => ad && !ad.isApproved).length 
    : 0;

  // Helper function for active menu items - needs to be defined before it's used but after all hooks
  const isActive = (path: string) => {
    // For dashboard links with query parameters, we need to match just the path part
    // or match the exact path with query parameters
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const queryParams = new URLSearchParams(queryString);
      const currentParams = new URLSearchParams(window.location.search);
      
      // Check if the base URL matches and any query parameters match
      const baseMatches = location === basePath;
      const tabMatches = queryParams.get('tab') === currentParams.get('tab');
      const subtabMatches = 
        !queryParams.has('subtab') || 
        queryParams.get('subtab') === currentParams.get('subtab');
        
      return (baseMatches && tabMatches && subtabMatches)
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-gray-600 hover:bg-gray-100 hover:text-primary';
    }
    
    // For regular paths, just do an exact match
    return location === path
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-gray-600 hover:bg-gray-100 hover:text-primary';
  };

  // Conditional returns must come after all hooks
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }
  
  // The new menu structure uses URL parameters to select tabs in the main dashboard
  const menuItems = [
    { label: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/admin' },
    { 
      label: 'Ad Management', 
      icon: <DollarSign className="h-5 w-5 text-green-600" />, 
      path: '/admin?tab=ads',
      badge: pendingAdsCount > 0 ? (
        <span className="ml-auto bg-orange-100 text-orange-800 text-xs font-medium mr-2 px-2 py-0.5 rounded flex items-center">
          <BellRing className="h-3 w-3 mr-1" /> {pendingAdsCount}
        </span>
      ) : null
    },
    { label: 'Content Management', icon: <BookOpenCheck className="h-5 w-5" />, path: '/admin?tab=content' },
    { label: 'Draft Management', icon: <FileText className="h-5 w-5" />, path: '/admin?tab=content&subtab=drafts' },
    { label: 'Media Library', icon: <Image className="h-5 w-5 text-purple-600" />, path: '/admin?tab=media' },
    { label: 'Users', icon: <Users className="h-5 w-5" />, path: '/admin?tab=users' },
    { label: 'Tags & Categories', icon: <Tag className="h-5 w-5" />, path: '/admin?tab=content&subtab=categories' },
    { label: 'API Keys', icon: <Settings className="h-5 w-5" />, path: '/admin?tab=settings&subtab=api' },
    { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/admin?tab=settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-full border-r border-gray-200 bg-gray-900 text-white shadow-xl">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-center flex-shrink-0 px-4 mb-4">
                <Link href="/">
                  <div className="cursor-pointer bg-gray-800 px-4 py-3 rounded-lg">
                    <span className="text-xl font-bold text-white">Proxima <span className="text-primary">Report</span></span>
                  </div>
                </Link>
              </div>
              
              <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-400 tracking-wider">
                Main
              </div>
              
              <nav className="mt-1 flex-1 px-2 space-y-1">
                {menuItems.slice(0, 4).map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`${
                        location === item.path
                          ? 'bg-gray-800 text-white border-l-4 border-primary pl-3'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      } group flex items-center px-4 py-2.5 text-sm rounded-md cursor-pointer transition-all duration-150 ease-in-out`}
                    >
                      {item.icon}
                      <span className="ml-3 font-medium">{item.label}</span>
                      {item.badge}
                    </div>
                  </Link>
                ))}
              </nav>
              
              <div className="px-3 py-2 mt-6 text-xs font-semibold uppercase text-gray-400 tracking-wider">
                Content Management
              </div>
              
              <nav className="mt-1 flex-1 px-2 space-y-1">
                {menuItems.slice(4, 9).map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`${
                        location === item.path
                          ? 'bg-gray-800 text-white border-l-4 border-primary pl-3'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      } group flex items-center px-4 py-2.5 text-sm rounded-md cursor-pointer transition-all duration-150 ease-in-out`}
                    >
                      {item.icon}
                      <span className="ml-3 font-medium">{item.label}</span>
                      {item.badge}
                    </div>
                  </Link>
                ))}
              </nav>
              
              <div className="px-3 py-2 mt-6 text-xs font-semibold uppercase text-gray-400 tracking-wider">
                System
              </div>
              
              <nav className="mt-1 flex-1 px-2 space-y-1">
                {menuItems.slice(9).map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`${
                        location === item.path
                          ? 'bg-gray-800 text-white border-l-4 border-primary pl-3'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      } group flex items-center px-4 py-2.5 text-sm rounded-md cursor-pointer transition-all duration-150 ease-in-out`}
                    >
                      {item.icon}
                      <span className="ml-3 font-medium">{item.label}</span>
                      {item.badge}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 border-t border-gray-700 p-4 bg-gray-800 rounded-md mx-3 mb-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full border-2 border-primary"
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                    alt={user.username}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user.username}
                  </p>
                  <p className="text-xs font-medium text-gray-300">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
                <Link href="/profile" className="ml-auto p-1 rounded-full hover:bg-gray-700 transition-colors">
                  <Settings className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="flex-shrink-0 bg-white shadow z-10">
          <div className="flex justify-between items-center px-4 py-3">
            <h1 className="text-lg font-semibold">Admin Console</h1>
            <div className="flex items-center space-x-3">
              {pendingAdsCount > 0 && (
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <BellRing className="h-3 w-3 mr-1" /> 
                  {pendingAdsCount} pending ad{pendingAdsCount !== 1 ? 's' : ''}
                </div>
              )}
              <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;