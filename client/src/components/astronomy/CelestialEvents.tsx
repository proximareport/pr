import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Star, Orbit, Moon, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CelestialEvent {
  date: string;
  title: string;
  description: string;
  url: string;
  type: "planet" | "moon" | "meteor" | "conjunction" | "eclipse" | "other";
}

export default function CelestialEvents() {
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This function fetches events from In-The-Sky.org
    // In a real implementation, you'd create a backend API to scrape or access their data
    async function fetchCelestialEvents() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Here we would normally fetch data from our backend API
        // For this demonstration, we'll use some sample data that mimics what we'd get
        // from scraping In-The-Sky.org
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Sample data based on typical In-The-Sky.org events
        const sampleEvents: CelestialEvent[] = [
          {
            date: "2025-05-12",
            title: "Eta Aquariid Meteor Shower",
            description: "The Eta Aquariids is an above average shower, capable of producing up to 60 meteors per hour at its peak. Best viewed in the early morning hours.",
            url: "https://in-the-sky.org/news.php?id=20250505_08_100",
            type: "meteor"
          },
          {
            date: "2025-05-15",
            title: "New Moon",
            description: "The Moon will be located on the same side of the Earth as the Sun and will not be visible in the night sky. Best time for observing faint objects.",
            url: "https://in-the-sky.org/news.php?id=20250515_08_100",
            type: "moon"
          },
          {
            date: "2025-05-17",
            title: "Mercury at Greatest Western Elongation",
            description: "The planet Mercury reaches greatest western elongation of 25.8 degrees from the Sun. Best time to view Mercury since it will be at its highest point above the horizon in the morning sky.",
            url: "https://in-the-sky.org/news.php?id=20250517_11_100",
            type: "planet"
          },
          {
            date: "2025-05-23",
            title: "Venus and Jupiter Conjunction",
            description: "Venus and Jupiter will make a close approach, passing within 0°31' of each other in the morning sky. Best viewed just before sunrise.",
            url: "https://in-the-sky.org/news.php?id=20250523_16_100",
            type: "conjunction"
          },
          {
            date: "2025-05-29",
            title: "Full Moon",
            description: "The Moon will be located on the opposite side of the Earth as the Sun and its face will be fully illuminated. This full moon was known as the Flower Moon by early Native American tribes.",
            url: "https://in-the-sky.org/news.php?id=20250529_08_100",
            type: "moon"
          },
          {
            date: "2025-06-10",
            title: "Partial Solar Eclipse",
            description: "A partial solar eclipse occurs when the Moon covers only a part of the Sun. This eclipse will be visible in parts of Northern Europe and Asia.",
            url: "https://in-the-sky.org/news.php?id=20250610_10_100",
            type: "eclipse"
          }
        ];
        
        setEvents(sampleEvents);
      } catch (err) {
        console.error("Error fetching celestial events:", err);
        setError("Unable to load upcoming celestial events. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCelestialEvents();
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get icon based on event type
  const getEventIcon = (type: CelestialEvent["type"]) => {
    switch (type) {
      case "meteor":
        return <Star className="h-5 w-5 text-purple-400" />;
      case "moon":
        return <Moon className="h-5 w-5 text-purple-400" />;
      case "planet":
        return <Orbit className="h-5 w-5 text-purple-400" />;
      case "conjunction":
        return <Search className="h-5 w-5 text-purple-400" />;
      case "eclipse":
        return <Sun className="h-5 w-5 text-purple-400" />;
      default:
        return <Calendar className="h-5 w-5 text-purple-400" />;
    }
  };
  
  return (
    <Card className="bg-[#14141E] border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-lg">Upcoming Celestial Events</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-full h-5 bg-white/10" />
                  <Skeleton className="w-4/5 h-4 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-400">{error}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-900/30 flex-shrink-0">
                    {getEventIcon(event.type)}
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <h3 className="font-medium">{event.title}</h3>
                      <span className="text-white/60 text-sm">{formatDate(event.date)}</span>
                    </div>
                    <p className="text-sm text-white/70 mt-1">
                      {event.description.length > 100 
                        ? `${event.description.substring(0, 100)}...` 
                        : event.description}
                    </p>
                    <a 
                      href={event.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 inline-block mt-1"
                    >
                      View on In-The-Sky.org
                    </a>
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => window.open("https://in-the-sky.org/newscal.php", "_blank")}
            >
              View Full Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}