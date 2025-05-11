import React, { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated or not an admin/editor
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'editor'))) {
      navigate('/login?returnTo=/admin');
    }
  }, [user, isLoading, navigate]);

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

  const isActive = (path: string) => {
    return location === path
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-gray-600 hover:bg-gray-100 hover:text-primary';
  };

  const menuItems = [
    { label: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/admin' },
    { label: 'Content Status', icon: <BookOpenCheck className="h-5 w-5" />, path: '/admin/content-status' },
    { label: 'Draft Management', icon: <FileText className="h-5 w-5" />, path: '/admin/drafts' },
    { label: 'Advertisements', icon: <BarChart3 className="h-5 w-5" />, path: '/admin/advertisements' },
    { label: 'Users', icon: <Users className="h-5 w-5" />, path: '/admin/users' },
    { label: 'Tags & Categories', icon: <Tag className="h-5 w-5" />, path: '/admin/categories-tags' },
    { label: 'Comments', icon: <MessageSquare className="h-5 w-5" />, path: '/admin/comments' },
    { label: 'Astronomy Photos', icon: <Image className="h-5 w-5" />, path: '/admin/astronomy-photos' },
    { label: 'Job Listings', icon: <Briefcase className="h-5 w-5" />, path: '/admin/job-listings' },
    { label: 'Archives', icon: <Archive className="h-5 w-5" />, path: '/admin/archives' },
    { label: 'Emergency Banner', icon: <AlertTriangle className="h-5 w-5" />, path: '/admin/emergency-banner' },
    { label: 'API Keys', icon: <Settings className="h-5 w-5" />, path: '/admin/api-keys' },
    { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link href="/">
                  <div className="cursor-pointer">
                    <span className="text-xl font-bold text-primary">Proxima Report</span>
                  </div>
                </Link>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`${isActive(
                        item.path
                      )} group flex items-center px-2 py-2 text-sm rounded-md cursor-pointer transition-colors`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block h-9 w-9 rounded-full"
                      src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user.username}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;