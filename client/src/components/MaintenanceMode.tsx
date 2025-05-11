import React, { useState, useEffect } from 'react';
import { AlertCircle, Wrench, Shield, Clock, RefreshCw, LogIn, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';

interface SiteSettings {
  maintenanceMessage: string;
  maintenanceDetails: string;
  maintenanceEndTime: string | null;
}

const MaintenanceMode: React.FC = () => {
  // Get site settings to display custom maintenance messages
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
    retry: false,
  });

  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // State for countdown timer if maintenance end time is provided
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  
  // Calculate time remaining until maintenance end
  useEffect(() => {
    if (settings?.maintenanceEndTime) {
      const endTime = new Date(settings.maintenanceEndTime);
      const now = new Date();
      
      if (endTime > now) {
        const totalDuration = endTime.getTime() - now.getTime();
        const updateTimer = () => {
          const currentTime = new Date();
          const remaining = endTime.getTime() - currentTime.getTime();
          
          if (remaining <= 0) {
            setTimeRemaining('Maintenance should be complete. Please refresh.');
            setProgressValue(100);
            clearInterval(timerInterval);
            return;
          }
          
          // Calculate remaining time
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          
          // Format time remaining
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          
          // Calculate progress percentage
          const elapsed = totalDuration - remaining;
          const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
          setProgressValue(progress);
        };
        
        // Initial update
        updateTimer();
        
        // Update every second
        const timerInterval = setInterval(updateTimer, 1000);
        
        // Cleanup
        return () => clearInterval(timerInterval);
      } else {
        setTimeRemaining('Maintenance should be complete. Please refresh.');
        setProgressValue(100);
      }
    }
  }, [settings?.maintenanceEndTime]);

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
          <CardTitle className="text-2xl text-center">
            {settings?.maintenanceMessage || "Site Under Maintenance"}
          </CardTitle>
          <CardDescription className="text-center">
            <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-400 border-amber-400/30">
              <Clock className="mr-1 h-3 w-3" /> Scheduled Maintenance
            </Badge>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Thank you for your patience while we improve our services.
          </p>
          
          <div className="border border-primary/10 bg-primary/5 p-4 rounded-md w-full">
            <div className="flex items-center space-x-2 text-primary mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Maintenance Details</span>
            </div>
            <p className="text-sm">
              {settings?.maintenanceDetails || 
               "Our team is working to complete the scheduled maintenance as quickly as possible. The site will be back online shortly with all services fully operational."}
            </p>
            
            {timeRemaining && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <CalendarClock className="h-4 w-4 mr-1" />
                    <span>Estimated completion</span>
                  </div>
                  <span className="font-medium text-primary">{timeRemaining}</span>
                </div>
                <Progress value={progressValue} className="h-1" />
              </div>
            )}
            
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
          
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="w-full text-primary" 
            >
              <LogIn className="mr-2 h-4 w-4" />
              Administrator Login
            </Button>
          </Link>
          
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