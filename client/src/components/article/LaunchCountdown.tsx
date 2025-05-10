import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { RocketIcon, BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LaunchCountdownProps {
  compact?: boolean;
}

interface Launch {
  id: string;
  name: string;
  details: string;
  date_utc: string;
  links: {
    patch: {
      small: string;
    };
    webcast: string;
    article: string;
    wikipedia: string;
  };
  success?: boolean;
  upcoming: boolean;
}

function LaunchCountdown({ compact = false }: LaunchCountdownProps) {
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Fetch next launch
  const { data: nextLaunch, isLoading, error } = useQuery<Launch>({
    queryKey: ['/api/spacex/upcoming'],
    select: (data: Launch[]) => {
      if (!data || data.length === 0) return null;
      // Sort by date and get the soonest
      return data.sort((a, b) => 
        new Date(a.date_utc).getTime() - new Date(b.date_utc).getTime()
      )[0];
    }
  });
  
  // Set reminder handler
  const setReminder = () => {
    toast({
      title: "Reminder Set",
      description: `We'll remind you before the launch of ${nextLaunch?.name}`,
      duration: 5000,
    });
  };
  
  // Calculate time remaining
  useEffect(() => {
    if (!nextLaunch) return;
    
    const launchDate = new Date(nextLaunch.date_utc);
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        clearInterval(timer);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nextLaunch]);
  
  if (isLoading) {
    return (
      <div className="bg-[#14141E] py-8 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="bg-[#0D0D17] rounded-xl overflow-hidden border border-white/10 p-6 text-center">
            <p className="text-white/70">Loading next launch data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !nextLaunch) {
    return (
      <div className="bg-[#14141E] py-8 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="bg-[#0D0D17] rounded-xl overflow-hidden border border-white/10 p-6 text-center">
            <p className="text-white/70">Unable to load launch data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className="bg-[#0D0D17] rounded-lg p-4 border border-white/10">
        <div className="flex items-center mb-2">
          <RocketIcon className="h-4 w-4 text-purple-500 mr-2" />
          <h3 className="font-space font-bold text-sm">Next: {nextLaunch.name}</h3>
        </div>
        <div className="flex space-x-2 text-xs">
          <div className="px-2 py-1 bg-[#1E1E2D] rounded">
            <span className="font-bold text-purple-500">{timeRemaining.days}d</span>
          </div>
          <div className="px-2 py-1 bg-[#1E1E2D] rounded">
            <span className="font-bold text-purple-500">{timeRemaining.hours}h</span>
          </div>
          <div className="px-2 py-1 bg-[#1E1E2D] rounded">
            <span className="font-bold text-purple-500">{timeRemaining.minutes}m</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#14141E] border-b border-white/10 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-[#0D0D17] rounded-xl overflow-hidden border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="h-60 md:h-auto col-span-1 bg-cover bg-center" style={{ 
              backgroundImage: nextLaunch.links.patch.small 
                ? `url(${nextLaunch.links.patch.small})` 
                : 'url(https://images.unsplash.com/photo-1518364538800-6bae3c2ea0f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600)' 
            }}></div>
            
            <div className="col-span-2 p-6 md:p-8">
              <div className="flex items-center mb-4">
                <div className="mr-3 w-10 h-10 rounded-full bg-purple-700/20 flex items-center justify-center">
                  <RocketIcon className="h-5 w-5 text-purple-500" />
                </div>
                <h2 className="font-space text-xl font-bold">Next Launch: {nextLaunch.name}</h2>
              </div>
              
              <p className="text-white/80 mb-6">
                {nextLaunch.details || 'No details available for this mission yet.'}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="text-center px-4 py-2 bg-[#1E1E2D] rounded-lg">
                  <p className="text-2xl font-space font-bold text-purple-500">
                    {String(timeRemaining.days).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-white/70 uppercase">Days</p>
                </div>
                
                <div className="text-center px-4 py-2 bg-[#1E1E2D] rounded-lg">
                  <p className="text-2xl font-space font-bold text-purple-500">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-white/70 uppercase">Hours</p>
                </div>
                
                <div className="text-center px-4 py-2 bg-[#1E1E2D] rounded-lg">
                  <p className="text-2xl font-space font-bold text-purple-500">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-white/70 uppercase">Minutes</p>
                </div>
                
                <div className="text-center px-4 py-2 bg-[#1E1E2D] rounded-lg">
                  <p className="text-2xl font-space font-bold text-purple-500">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-white/70 uppercase">Seconds</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button className="bg-purple-800 hover:bg-purple-700" onClick={setReminder}>
                  <BellIcon className="h-4 w-4 mr-2" /> Set Reminder
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/launches/${nextLaunch.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaunchCountdown;
