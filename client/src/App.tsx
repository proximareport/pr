import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
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

import MissionControl from "@/pages/MissionControl";
import Astronomy from "@/pages/Astronomy";
import Jobs from "@/pages/Jobs";
import Subscribe from "@/pages/Subscribe";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import SubscriptionCancel from "@/pages/SubscriptionCancel";
import Pricing from "@/pages/Pricing";
import TagView from "@/pages/TagView";
import ProxiHub from "@/pages/ProxiHub";
import WordGenerator from "@/pages/tools/WordGenerator";
import DistanceCalculator from "@/pages/tools/DistanceCalculator";
import FactGenerator from "@/pages/tools/FactGenerator";
import ColorPalette from "@/pages/tools/ColorPalette";
import PlanetGenerator from "@/pages/tools/PlanetGenerator";
import MissionGenerator from "@/pages/tools/MissionGenerator";
import QuizGenerator from "@/pages/tools/QuizGenerator";
import DeltaVCalculator from "@/pages/tools/DeltaVCalculator";
import AstrophysicsPlayground from "@/pages/tools/AstrophysicsPlayground";
import Launches from "@/pages/Launches";
import Benefits from "@/pages/Benefits";
import Gift from "@/pages/Gift";
import Careers from "@/pages/Careers";
// SearchResults page removed as it's now integrated into the search bar
import NewsletterVerify from "@/pages/NewsletterVerify";
import NewsletterUnsubscribe from "@/pages/NewsletterUnsubscribe";
import SecurityPolicy from "@/pages/SecurityPolicy";
import EthicsPolicy from "@/pages/EthicsPolicy";
import DiversityPolicy from "@/pages/DiversityPolicy";

import SiteBlock from "@/components/SiteBlock";
import AdminDashboard from "@/pages/Admin/NewDashboard";
import { useAuth, AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MissionControlSidebar } from "@/components/theme/MissionControlSidebar";
import { StardateDisplay } from "@/components/theme/StardateDisplay";
import AnimatedBackground from "@/components/ui/animated-background";
import Gallery from './pages/Gallery';
import Staff from './pages/Staff';
import Topics from './pages/Topics';
import { GoogleAdsProvider, CookieConsentBanner } from '@/components/GoogleAdsProvider';
import { analyticsTracker } from "@/lib/analytics";

// Import theme styles
import '@/styles/themes.css';

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
      {/* /articles/all route is handled by server-side 301 redirect */}
      <Route path="/articles/:slug" component={Article} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile/settings" component={Profile} />
      <Route path="/profile/:username?" component={Profile} />
      <Route path="/edit-profile" component={EditProfile} />
      
      <Route path="/missioncontrol" component={MissionControl} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/astronomy" component={Astronomy} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/subscription/cancel" component={SubscriptionCancel} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/proxihub" component={ProxiHub} />
      <Route path="/tools/word-generator" component={WordGenerator} />
      <Route path="/tools/distance-calculator" component={DistanceCalculator} />
      <Route path="/tools/fact-generator" component={FactGenerator} />
      <Route path="/tools/color-palette" component={ColorPalette} />
      <Route path="/tools/planet-generator" component={PlanetGenerator} />
      <Route path="/tools/mission-generator" component={MissionGenerator} />
      <Route path="/tools/quiz-generator" component={QuizGenerator} />
      <Route path="/tools/delta-v-calculator" component={DeltaVCalculator} />
      <Route path="/tools/astrophysics-playground" component={AstrophysicsPlayground} />
      <Route path="/launches" component={Launches} />
      <Route path="/benefits" component={Benefits} />
      <Route path="/gift" component={Gift} />
      <Route path="/careers" component={Careers} />
      <Route path="/tag/:tagName" component={TagView} />
      {/* Search page removed - now directly integrated into the dropdown */}
      <Route path="/newsletter/verify" component={NewsletterVerify} />
      <Route path="/newsletter/unsubscribe" component={NewsletterUnsubscribe} />
      
      {/* Site Block Preview */}
      <Route path="/site-block-preview" component={() => {
        const SiteBlockPreviewPage = React.lazy(() => import('./pages/SiteBlockPreview'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <SiteBlockPreviewPage />
          </React.Suspense>
        );
      }} />
      
      {/* Main Admin Dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Redirects to main dashboard with appropriate tabs */}
      <Route path="/admin/users" component={() => <RedirectToDashboardTab tab="users" />} />
      <Route path="/admin/drafts" component={() => <RedirectToDashboardTab tab="content" subtab="drafts" />} />
      <Route path="/admin/categories-tags" component={() => <RedirectToDashboardTab tab="content" subtab="categories" />} />
      <Route path="/admin/content-status" component={() => <RedirectToDashboardTab tab="content" subtab="status" />} />
      <Route path="/admin/api-keys" component={() => <RedirectToDashboardTab tab="settings" subtab="api" />} />
      <Route path="/admin/emergency-banner" component={() => <RedirectToDashboardTab tab="settings" subtab="emergency" />} />
      <Route path="/admin/media-library" component={() => <RedirectToDashboardTab tab="media" />} />
      <Route path="/admin/taxonomy" component={() => <RedirectToDashboardTab tab="taxonomy" />} />
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
      
      <Route path="/gallery" component={Gallery} />
      <Route path="/staff" component={Staff} />
      <Route path="/topics" component={Topics} />
      
      <Route path="/sitemap" component={() => {
        const SitemapPage = React.lazy(() => import('./pages/Sitemap'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <SitemapPage />
          </React.Suspense>
        );
      }} />
      
      {/* Legal and Compliance Pages */}
      <Route path="/privacy" component={() => {
        const PrivacyPage = React.lazy(() => import('./pages/PrivacyPolicy'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <PrivacyPage />
          </React.Suspense>
        );
      }} />
      
      <Route path="/terms" component={() => {
        const TermsPage = React.lazy(() => import('./pages/TermsOfService'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <TermsPage />
          </React.Suspense>
        );
      }} />
      
      <Route path="/cookies" component={() => {
        const CookiesPage = React.lazy(() => import('./pages/CookiePolicy'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <CookiesPage />
          </React.Suspense>
        );
      }} />
      
      <Route path="/about" component={() => {
        const AboutPage = React.lazy(() => import('./pages/About'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <AboutPage />
          </React.Suspense>
        );
      }} />
      
      <Route path="/contact" component={() => {
        const ContactPage = React.lazy(() => import('./pages/Contact'));
        return (
          <React.Suspense fallback={<div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
            <ContactPage />
          </React.Suspense>
        );
      }} />
      
      <Route path="/security-policy" component={SecurityPolicy} />
      
      {/* Policy Pages */}
      <Route path="/ethics-policy" component={EthicsPolicy} />
      <Route path="/diversity-policy" component={DiversityPolicy} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";

function MainApp() {
  const { settings } = useSiteSettings();
  const { isAdmin, user, isLoading: authLoading } = useAuth();
  const [location] = useLocation();
  
  // Scroll to top on every route change
  useScrollToTop();
  
  // Fetch site block status
  const { data: siteBlock, isLoading: siteBlockLoading } = useQuery({
    queryKey: ['site-block'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/site-block');
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // For debugging
  
  
  // Don't show maintenance mode for:
  // 1. Admin users (they can see everything)
  // 2. Admin pages (should be accessible during maintenance)
  // 3. Login/auth pages (so people can still log in)
  const isAdminPage = location.startsWith('/admin');
  const isAuthPage = location === '/login' || location === '/register';

  
  // Site block logic - don't show if user is authenticated as admin or on admin pages
  const isSiteBlockPreviewPage = location === '/site-block-preview';
  const showSiteBlock = siteBlock?.isEnabled && !isAdmin && !isAdminPage && !authLoading && !isSiteBlockPreviewPage;
  
  // For debugging
      console.log("MainApp render check:", {
      path: location,
      isAdmin,
      user: user?.username,
      userRole: user?.role,
      isAdminPage,
      isAuthPage,
      showSiteBlock,
      siteBlockEnabled: siteBlock?.isEnabled,
      authLoading,
      siteBlockLoading,
      finalDecision: showSiteBlock && siteBlock && !isAdmin ? 'SHOW_SITE_BLOCK' : 'SHOW_NORMAL_SITE'
    });
  
  // Show loading while fetching site block status or auth status
  if (siteBlockLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  // Show site block if enabled and user is not admin
  if (showSiteBlock && siteBlock && !isAdmin) {
    return <SiteBlock siteBlock={siteBlock} />;
  }
  

  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <EmergencyBanner />
      <main className="flex-grow relative">
        <AnimatedBackground variant="particles" intensity="low" />
        <div className="relative z-10">
          <Router />
        </div>
      </main>
      <Footer />
      
      {/* Theme-specific components */}
      <MissionControlSidebar />
      <StardateDisplay />
      
      {/* Scroll to top button */}
      <ScrollToTopButton />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GoogleAdsProvider>
            <TooltipProvider>
              <ThemeProvider>
                <MainApp />
                <CookieConsentBanner />
              </ThemeProvider>
            </TooltipProvider>
          </GoogleAdsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
