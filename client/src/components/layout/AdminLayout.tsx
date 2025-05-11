import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Key, 
  Tag, 
  ClipboardCheck,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not admin or editor
  if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'editor'))) {
    toast({
      title: "Access Denied",
      description: "You need to be an administrator or editor to access this page.",
      variant: "destructive",
    });
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You need to be an administrator or editor to access this page.
          </p>
          <Link href="/">
            <Button className="w-full">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <a className={`flex items-center space-x-2 p-3 rounded-md transition-colors ${
          isActive ? 'bg-primary text-white' : 'hover:bg-gray-100'
        }`}>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </a>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/admin/drafts" icon={FileText} label="Draft Management" />
            <NavItem href="/admin/content-status" icon={ClipboardCheck} label="Content Status" />
            <NavItem href="/admin/users" icon={Users} label="User Management" />
            <NavItem href="/admin/categories-tags" icon={Tag} label="Categories & Tags" />
            <NavItem href="/admin/api-keys" icon={Key} label="API Keys" />
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Link href="/api/logout">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;