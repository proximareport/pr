import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';
import SEO from '@/components/SEO';

const NotFound = () => {
  return (
    <>
      <SEO 
        title="404 - Page Not Found | Proxima Report"
        description="The page you're looking for doesn't exist or has been moved. Find the latest space news and STEM content on Proxima Report."
        keywords="404, page not found, space news, STEM education, astronomy, space exploration"
        url="https://proximareport.com/404"
        type="website"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white">404</h1>
            <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
            <p className="text-white/60 text-lg">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
            
            <div className="pt-4">
              <p className="text-white/40 text-sm">
                Need help? Try searching for what you're looking for.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
