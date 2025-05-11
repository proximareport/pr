import React from 'react';
import { AlertCircle, Wrench, Shield, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MaintenanceMode: React.FC = () => {
  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card/95 border-primary/20 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-0">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Wrench className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Site Under Maintenance</CardTitle>
          <CardDescription className="text-center">
            <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-400 border-amber-400/30">
              <Clock className="mr-1 h-3 w-3" /> Scheduled Maintenance
            </Badge>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            We're currently upgrading our systems to bring you an improved experience.
            Thank you for your patience.
          </p>
          
          <div className="border border-primary/10 bg-primary/5 p-4 rounded-md w-full">
            <div className="flex items-center space-x-2 text-primary mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Maintenance Details</span>
            </div>
            <p className="text-sm">
              Our team is working to complete the scheduled maintenance as quickly as possible.
              The site will be back online shortly with all services fully operational.
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              {currentDate}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={refreshPage}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Again
          </Button>
          
          <div className="flex items-center justify-center space-x-2 text-muted-foreground text-xs">
            <Shield className="h-3 w-3" />
            <span>Administrators have full access during maintenance</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MaintenanceMode;