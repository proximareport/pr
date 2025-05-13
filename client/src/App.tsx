import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EmergencyBanner from "@/components/layout/EmergencyBanner";
import Home from "@/pages/Home";
import Article from "@/pages/Article";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Launches from "@/pages/Launches";
import Astronomy from "@/pages/Astronomy";
import Subscribe from "@/pages/Subscribe";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import TagView from "@/pages/TagView";
// SearchResults page removed as it's now integrated into the search bar
import NewsletterVerify from "@/pages/NewsletterVerify";
import NewsletterUnsubscribe from "@/pages/NewsletterUnsubscribe";
import MaintenanceMode from "@/components/MaintenanceMode";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminArticleEditor from "@/pages/Admin/NewArticleEditor";
import { useAuth, AuthProvider } from "@/lib/AuthContext";

// Redirect component to navigate to the main admin dashboard with a specific tab
const RedirectToDashboardTab = ({ tab, subtab }: { tab: string, subtab?: string }) => {
  const [, navigate] = useLocation();
  
  React.useEffect(() => {
    const url = new URL(window.location.origin + '/admin');
    url.searchParams.set('tab', tab);
    if (subtab) {
      url.searchParams.set('subtab', subtab);
    }
    navigate(url.pathname + url.search);
  }, [navigate, tab, subtab]);
  
  return <div className="flex justify-center items-center h-screen">
    <div className="flex flex-col items-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <div>Redirecting to admin dashboard...</div>
    </div>
  </div>;
};

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      {/* Special route for "all" category that redirects to home */}
      <Route path="/article/all" component={() => {
        const [, navigate] = useLocation();
        
        React.useEffect(() => {
          navigate('/');
        }, [navigate]);
        
        return <div className="flex justify-center items-center h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <div>Redirecting to home page...</div>
          </div>
        </div>;
      }} />
      <Route path="/article/:slug" component={Article} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile/settings" component={Profile} />
      <Route path="/profile/:username?" component={Profile} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/launches" component={Launches} />
      <Route path="/astronomy" component={Astronomy} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/tag/:tagName" component={TagView} />
      {/* Search page removed - now directly integrated into the dropdown */}
      <Route path="/newsletter/verify" component={NewsletterVerify} />
      <Route path="/newsletter/unsubscribe" component={NewsletterUnsubscribe} />
      
      {/* Main Admin Dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articles/new" component={AdminArticleEditor} />
      <Route path="/admin/articles/:id/edit" component={AdminArticleEditor} />
      {/* Keep old route format for backward compatibility */}
      <Route path="/admin/articles/edit/:id" component={AdminArticleEditor} />
      
      {/* Redirects to main dashboard with appropriate tabs */}
      <Route path="/admin/users" component={() => <RedirectToDashboardTab tab="users" />} />
      <Route path="/admin/drafts" component={() => <RedirectToDashboardTab tab="content" subtab="drafts" />} />
      <Route path="/admin/categories-tags" component={() => <RedirectToDashboardTab tab="content" subtab="categories" />} />
      <Route path="/admin/content-status" component={() => <RedirectToDashboardTab tab="content" subtab="status" />} />
      <Route path="/admin/api-keys" component={() => <RedirectToDashboardTab tab="settings" subtab="api" />} />
      <Route path="/admin/emergency-banner" component={() => <RedirectToDashboardTab tab="settings" subtab="emergency" />} />
      <Route path="/admin/media-library" component={() => <RedirectToDashboardTab tab="media" />} />
      <Route path="/admin/advertisements" component={() => <RedirectToDashboardTab tab="advertisements" />} />
      <Route path="/admin/settings" component={() => <RedirectToDashboardTab tab="settings" />} />
      
      {/* Advertiser pages */}
      <Route path="/advertise" component={() => {
        const AdvertisePage = React.lazy(() => import('./pages/Advertise-new'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdvertisePage />
          </React.Suspense>
        );
      }} />
      <Route path="/advertise-success" component={() => {
        const AdvertiseSuccessPage = React.lazy(() => import('./pages/AdvertiseSuccess'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdvertiseSuccessPage />
          </React.Suspense>
        );
      }} />
      
      {/* Redirect advertiser dashboard to admin dashboard for admins */}
      <Route path="/advertiser-dashboard" component={() => {
        const { user, isLoading } = useAuth();
        
        // If the user is an admin or editor, redirect them to the admin dashboard
        if (!isLoading && user && (user.role === 'admin' || user.role === 'editor')) {
          return <RedirectToDashboardTab tab="advertisements" />;
        }
        
        // Otherwise load the advertiser dashboard
        const AdvertiserDashboardPage = React.lazy(() => import('./pages/AdvertiserDashboard'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AdvertiserDashboardPage />
          </React.Suspense>
        );
      }} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

import { useSiteSettings } from "@/hooks/useSiteSettings";

function MainApp() {
  const { isMaintenanceMode, settings } = useSiteSettings();
  const { isAdmin } = useAuth();
  const [location] = useLocation();
  
  // For debugging
  console.log("Maintenance check:", { 
    isMaintenanceMode, 
    isAdmin, 
    maintenanceEnabled: settings?.maintenanceMode 
  });
  
  // Don't show maintenance mode for:
  // 1. Admin users (they can see everything)
  // 2. Admin pages (should be accessible during maintenance)
  // 3. Login/auth pages (so people can still log in)
  const isAdminPage = location.startsWith('/admin');
  const isAuthPage = location === '/login' || location === '/register';
  const showMaintenanceMode = isMaintenanceMode && !isAdmin && !isAdminPage && !isAuthPage;
  
  // For debugging
  console.log("MainApp render check:", {
    path: location,
    isMaintenanceMode,
    isAdmin,
    isAdminPage,
    isAuthPage,
    showMaintenanceMode
  });
  
  if (showMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <EmergencyBanner />
      <main className="flex-grow">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MainApp />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
