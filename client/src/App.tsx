import { Switch, Route } from "wouter";
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
import Launches from "@/pages/Launches";
import Astronomy from "@/pages/Astronomy";
import Subscribe from "@/pages/Subscribe";
import TagView from "@/pages/TagView";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminArticleEditor from "@/pages/Admin/ArticleEditor";
import AdminUserManagement from "@/pages/Admin/UserManagement";
import { AuthProvider } from "@/lib/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/article/:slug" component={Article} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile/:username?" component={Profile} />
      <Route path="/launches" component={Launches} />
      <Route path="/astronomy" component={Astronomy} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/tag/:tagName" component={TagView} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articles/new" component={AdminArticleEditor} />
      <Route path="/admin/articles/edit/:id" component={AdminArticleEditor} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/categories-tags" component={import('./pages/Admin/CategoriesAndTags').then(m => m.default)} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
