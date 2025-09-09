import { useState } from "react";
import AstronomyPortal from "@/components/astronomy/AstronomyPortal";
import CelestialSkyMap from "@/components/astronomy/CelestialSkyMap";
import CelestialEvents from "@/components/astronomy/CelestialEvents";
import Advertisement from "@/components/Advertisement";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ImageModal from "@/components/ui/ImageModal";
import { Star, Info, Calendar, Compass, X } from "lucide-react";

function Astronomy() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [apodModalOpen, setApodModalOpen] = useState(false);
  
  // Fetch NASA Astronomy Picture of the Day
  const { data: apodData, isLoading: isLoadingApod } = useQuery<{
    url: string;
    title: string;
    explanation: string;
    date: string;
  }>({
    queryKey: ["/api/nasa/apod"],
  });

  return (
    <div className="bg-[#0D0D17] min-h-screen">
      {/* Fullscreen D3 Celestial Sky Map */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black z-50">
          <CelestialSkyMap 
            fullScreen={true} 
            onToggleFullScreen={() => setIsFullScreen(false)} 
          />
          <Button 
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFullScreen(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      )}
      
      {/* Hero banner with APOD */}
      <section className="relative">
        <div 
          className="h-[60vh] relative bg-cover bg-center"
          style={{ 
            backgroundImage: apodData && apodData.url 
              ? `url(${apodData.url})` 
              : `url(https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800)` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/80 to-transparent"></div>
          <div className="container mx-auto px-4 h-full flex items-end pb-12 relative z-10">
            <div className="max-w-2xl">
              <div className="bg-[#0D0D17]/80 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                <div className="flex items-center mb-3">
                  <Star className="h-5 w-5 text-purple-500 mr-2" />
                  <h3 className="font-space font-bold text-lg">NASA Astronomy Picture of the Day</h3>
                </div>
                <h2 className="font-space font-bold text-2xl mb-2">
                  {isLoadingApod ? "Loading..." : (apodData && apodData.title) || "Wonders of the Universe"}
                </h2>
                <p className="text-white/80 line-clamp-3 mb-4">
                  {isLoadingApod ? "Loading description..." : (apodData && apodData.explanation) || "Explore the breathtaking phenomena of our cosmos."}
                </p>
                <div className="flex gap-2">
                  <Button 
                    className="bg-purple-800 hover:bg-purple-700"
                    onClick={() => setApodModalOpen(true)}
                  >
                    View Full Size
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-purple-600 text-purple-300 hover:bg-purple-800"
                    onClick={() => apodData && apodData.url && window.open(apodData.url, '_blank')}
                  >
                    View on NASA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Navigation for astronomy sections */}
      <section className="py-8 bg-[#14141E] border-y border-white/10">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="explore" className="w-full">
            <TabsList className="w-full max-w-xl mx-auto grid grid-cols-3 bg-[#1E1E2D]">
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>
      
      {/* Main content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Featured card - D3 Celestial Sky Map */}
              <Card className="mb-8 bg-[#14141E] border-white/10 hover:border-purple-500/30 overflow-hidden transition-all">
                <div className="relative">
                  <CelestialSkyMap 
                    height="300px" 
                    onToggleFullScreen={() => setIsFullScreen(true)} 
                  />
                  <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-[#14141E] to-transparent/0 w-full">
                    <h3 className="font-space text-2xl font-bold mb-2 text-shadow-[0_0_8px_rgba(157,78,221,0.7)]">
                      Interactive Sky Map with d3-celestial
                    </h3>
                    <p className="text-white/90 mb-4">
                      Explore stars, planets, constellations and more in real-time based on your location
                    </p>
                    <Button 
                      className="bg-purple-800 hover:bg-purple-700"
                      onClick={() => setIsFullScreen(true)}
                    >
                      <Compass className="h-4 w-4 mr-2" />
                      Fullscreen Mode
                    </Button>
                  </div>
                </div>
              </Card>
              
              {/* Main portal content */}
              <AstronomyPortal />
            </div>
            
            <div className="lg:col-span-1 space-y-8">
              {/* Upcoming Celestial Events from In-The-Sky.org */}
              <CelestialEvents />
              
              {/* Advertisement */}
              <div className="bg-[#14141E] rounded-lg border border-white/10 p-5">
                <h3 className="text-lg font-bold mb-4">Sponsored</h3>
                <Advertisement placement="astronomy_sidebar" />
              </div>
              
              <Card className="bg-[#14141E] border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">Learning Resources</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      className="block p-3 bg-[#1E1E2D] rounded-lg hover:bg-purple-900/20 transition-colors"
                    >
                      <h3 className="font-medium mb-1">Beginner's Guide to Stargazing</h3>
                      <p className="text-sm text-white/70">
                        Essential tips for your first night under the stars
                      </p>
                    </a>
                    
                    <a 
                      href="#" 
                      className="block p-3 bg-[#1E1E2D] rounded-lg hover:bg-purple-900/20 transition-colors"
                    >
                      <h3 className="font-medium mb-1">Astrophotography Basics</h3>
                      <p className="text-sm text-white/70">
                        How to capture stunning night sky images
                      </p>
                    </a>
                    
                    <a 
                      href="#" 
                      className="block p-3 bg-[#1E1E2D] rounded-lg hover:bg-purple-900/20 transition-colors"
                    >
                      <h3 className="font-medium mb-1">Telescope Buying Guide</h3>
                      <p className="text-sm text-white/70">
                        Find the right equipment for your astronomy journey
                      </p>
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#14141E] border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Join the Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 mb-4">
                    Connect with fellow astronomy enthusiasts, share your observations, and learn from the community.
                  </p>
                  <Button className="w-full bg-purple-800 hover:bg-purple-700">
                    Join Discord Channel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* APOD Image Modal */}
      {apodData && (
        <ImageModal
          isOpen={apodModalOpen}
          onClose={() => setApodModalOpen(false)}
          imageUrl={apodData.url}
          title={apodData.title}
          description={apodData.explanation}
          date={apodData.date}
          copyright="NASA"
          externalUrl="https://apod.nasa.gov/apod/"
        />
      )}
    </div>
  );
}

export default Astronomy;
