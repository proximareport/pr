import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
import MaintenanceMode from "@/components/MaintenanceMode";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminArticleEditor from "@/pages/Admin/NewArticleEditor";
import AdminUserManagement from "@/pages/Admin/UserManagement";
import { AuthProvider } from "@/lib/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articles/new" component={AdminArticleEditor} />
      <Route path="/admin/articles/edit/:id" component={AdminArticleEditor} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/drafts" component={() => {
        const DraftManagementPage = React.lazy(() => import('./pages/Admin/DraftManagement'));
        return (
          <React.Suspense fallback={<div>Loading...</div>}>
            <DraftManagementPage />
          </React.Suspense>
        );
      }} />
      <Route path="/admin/categories-tags" component={() => {
        const CategoriesAndTagsPage = React.lazy(() => import('./pages/Admin/CategoriesAndTags'));
        return (
          <React.Suspense fallback={<div>Loading...</div>}>
            <CategoriesAndTagsPage />
          </React.Suspense>
        );
      }} />
      <Route path="/admin/content-status" component={() => {
        // Redirect to dashboard with content tab pre-selected
        const [, navigate] = useLocation();
        React.useEffect(() => {
          navigate('/admin?tab=content&subtab=content_status');
        }, [navigate]);
        return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
      }} />
      <Route path="/admin/api-keys" component={() => {
        const ApiKeyManagementPage = React.lazy(() => import('./pages/Admin/ApiKeyManagement'));
        return (
          <React.Suspense fallback={<div>Loading...</div>}>
            <ApiKeyManagementPage />
          </React.Suspense>
        );
      }} />
      <Route path="/admin/advertisements" component={() => {
        const AdvertisementManagementPage = React.lazy(() => import('./pages/Admin/AdvertisementManagement'));
        return (
          <React.Suspense fallback={<div>Loading...</div>}>
            <AdvertisementManagementPage />
          </React.Suspense>
        );
      }} />
      <Route path="/admin/media-library" component={() => {
        const MediaLibraryPage = React.lazy(() => import('./pages/Admin/MediaLibrary'));
        return (
          <React.Suspense fallback={<div>Loading...</div>}>
            <MediaLibraryPage />
          </React.Suspense>
        );
      }} />
      <Route path="/advertise" component={() => {
        const AdvertisePage = React.lazy(() => import('./pages/Advertise-new'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div></div>}>
            <AdvertisePage />
          </React.Suspense>
        );
      }} />
      <Route path="/advertise-success" component={() => {
        const AdvertiseSuccessPage = React.lazy(() => import('./pages/AdvertiseSuccess'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div></div>}>
            <AdvertiseSuccessPage />
          </React.Suspense>
        );
      }} />
      <Route path="/advertiser-dashboard" component={() => {
        const AdvertiserDashboardPage = React.lazy(() => import('./pages/AdvertiserDashboard'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div></div>}>
            <AdvertiserDashboardPage />
          </React.Suspense>
        );
      }} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { useSiteSettings } from "./hooks/useSiteSettings";

function MainApp() {
  const { isMaintenanceMode } = useSiteSettings();
  const [location] = useLocation();
  
  // Don't show maintenance mode for admin pages
  const isAdminPage = location.startsWith('/admin');
  const showMaintenanceMode = isMaintenanceMode && !isAdminPage;
  
  return (
    <div className="min-h-screen flex flex-col">
      {showMaintenanceMode && <MaintenanceMode />}
      <Header />
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
