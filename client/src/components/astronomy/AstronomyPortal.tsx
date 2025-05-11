import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Calendar, Map, Star, Upload } from "lucide-react";
import StellariumSkyMap from "./StellariumSkyMap";

interface AstronomyPhoto {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  equipmentUsed: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
}

// Celestial events interface moved to CelestialEvents.tsx

function AstronomyPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoDescription, setPhotoDescription] = useState("");
  const [photoLocation, setPhotoLocation] = useState("");
  const [photoEquipment, setPhotoEquipment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<AstronomyPhoto | null>(null);

  // Fetch astronomy photos
  const { data: photos, isLoading: isLoadingPhotos } = useQuery<AstronomyPhoto[]>({
    queryKey: ["/api/astronomy-photos"],
  });

  // We've moved the celestial events to their own component

  // Handle photo submission
  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to submit a photo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!photoFile) {
      toast({
        title: "Missing Photo",
        description: "Please select a photo to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!photoTitle.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your photo.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", photoFile);
      formData.append("title", photoTitle);
      
      if (photoDescription) formData.append("description", photoDescription);
      if (photoLocation) formData.append("location", photoLocation);
      if (photoEquipment) formData.append("equipmentUsed", photoEquipment);
      
      // Make the API request
      const response = await fetch("/api/astronomy-photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
      
      // Reset form
      setPhotoFile(null);
      setPhotoTitle("");
      setPhotoDescription("");
      setPhotoLocation("");
      setPhotoEquipment("");
      
      toast({
        title: "Photo Submitted",
        description: "Your astronomy photo has been submitted for approval.",
      });
      
      // Close the dialog if it's open
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  // Open photo detail dialog
  const openPhotoDetail = (photo: AstronomyPhoto) => {
    setSelectedPhoto(photo);
    setIsDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <section className="py-12 bg-gradient-to-b from-[#0D0D17] to-[#14141E]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-space text-3xl md:text-4xl font-bold mb-3">Astronomy Portal</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Explore the night sky, discover celestial events, and share your astronomy photography with the community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <Card className="bg-[#0D0D17] hover:shadow-[0_0_15px_rgba(157,78,221,0.5)] transition-shadow duration-300 border-white/10 hover:border-purple-500/30">
            <div className="h-64 relative bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800')` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="font-space text-2xl font-bold mb-2 text-shadow-[0_0_8px_rgba(157,78,221,0.7)]">
                  Tonight's Sky
                </h3>
                <p className="text-white/90 mb-4">
                  Interactive star map showing celestial objects visible from your location
                </p>
                <Button className="bg-purple-800 hover:bg-purple-700">
                  <Star className="h-4 w-4 mr-2" />
                  Explore Sky Map
                </Button>
              </div>
            </div>
          </Card>
          
          <Card className="bg-[#0D0D17] hover:shadow-[0_0_15px_rgba(157,78,221,0.5)] transition-shadow duration-300 border-white/10 hover:border-purple-500/30">
            <div className="h-64 relative bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800')` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D17] via-[#0D0D17]/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="font-space text-2xl font-bold mb-2 text-shadow-[0_0_8px_rgba(157,78,221,0.7)]">
                  Celestial Events
                </h3>
                <p className="text-white/90 mb-4">
                  Upcoming meteor showers, eclipses, planet alignments and more
                </p>
                <Button className="bg-purple-800 hover:bg-purple-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        <Card className="bg-[#0D0D17] border-white/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-space text-xl">Community Gallery</CardTitle>
                <CardDescription>
                  Stunning astronomy photographs captured by our community members
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-800 hover:bg-purple-700">
                    <Upload className="h-4 w-4 mr-2" /> Submit Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#14141E] border-white/10 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Astronomy Photo</DialogTitle>
                    <DialogDescription>
                      Share your best astronomy photos with the community
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitPhoto} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Photo</label>
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          {photoFile ? (
                            <div>
                              <p className="text-white/90 mb-2">{photoFile.name}</p>
                              <p className="text-xs text-white/60">Click to change</p>
                            </div>
                          ) : (
                            <div className="py-4">
                              <Camera className="h-12 w-12 mx-auto mb-2 text-white/40" />
                              <p className="text-white/70">Click to select a photo</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <Input
                        value={photoTitle}
                        onChange={(e) => setPhotoTitle(e.target.value)}
                        placeholder="e.g., Andromeda Galaxy"
                        required
                        className="bg-[#1E1E2D] border-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        placeholder="Tell us about your image..."
                        className="bg-[#1E1E2D] border-white/10"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <Input
                          value={photoLocation}
                          onChange={(e) => setPhotoLocation(e.target.value)}
                          placeholder="Where was this taken?"
                          className="bg-[#1E1E2D] border-white/10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Equipment Used</label>
                        <Input
                          value={photoEquipment}
                          onChange={(e) => setPhotoEquipment(e.target.value)}
                          placeholder="Telescope, camera, etc."
                          className="bg-[#1E1E2D] border-white/10"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-purple-800 hover:bg-purple-700"
                        disabled={isSubmitting || !photoFile || !photoTitle.trim()}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Photo"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="gallery" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="map">Sky Map</TabsTrigger>
              </TabsList>
              <TabsContent value="gallery">
                {isLoadingPhotos ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/70">Loading gallery...</p>
                  </div>
                ) : photos && photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group cursor-pointer"
                        onClick={() => openPhotoDetail(photo)}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <h4 className="text-white text-sm font-medium truncate">{photo.title}</h4>
                          <p className="text-white/70 text-xs truncate">by {photo.user.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[#14141E] rounded-lg border border-white/10">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-white/30" />
                    <p className="text-white/70 mb-2">No photos available yet</p>
                    <p className="text-sm text-white/50 mb-4">Be the first to submit your astronomy photo!</p>
                    <Button
                      className="bg-purple-800 hover:bg-purple-700"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      Submit a Photo
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="map">
                <div className="bg-[#14141E] rounded-lg border border-white/10 overflow-hidden">
                  <StellariumSkyMap height="500px" onToggleFullScreen={() => {
                    // Create a fullscreen version in the main component
                    // This is handled in the Astronomy.tsx component
                  }} />
                  <div className="p-4 text-center">
                    <h3 className="font-space font-bold text-lg mb-2">Stellarium Web Sky Map</h3>
                    <p className="text-white/70 mb-0 max-w-md mx-auto text-sm">
                      Interactive map powered by Stellarium Web. Use mouse to pan, scroll to zoom.
                      Click on celestial objects to learn more about them.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-white/60 mb-2 sm:mb-0">
                Top Contributors
              </p>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500">
                  <img src="https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Contributor" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500">
                  <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Contributor" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Contributor" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" alt="Contributor" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1E1E2D] text-white flex items-center justify-center text-xs">+18</div>
              </div>
            </div>
            <Button variant="outline">
              View All Photos
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Photo Detail Dialog */}
      {selectedPhoto && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-[#14141E] border-white/10 sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPhoto.title}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white/60">Description</h4>
                  <p className="text-white/90">{selectedPhoto.description || "No description provided."}</p>
                </div>
                {selectedPhoto.location && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60">Location</h4>
                    <p className="text-white/90">{selectedPhoto.location}</p>
                  </div>
                )}
                {selectedPhoto.equipmentUsed && (
                  <div>
                    <h4 className="text-sm font-medium text-white/60">Equipment Used</h4>
                    <p className="text-white/90">{selectedPhoto.equipmentUsed}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-white/60">Captured by</h4>
                  <div className="flex items-center mt-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 mr-2">
                      <img
                        src={selectedPhoto.user.profilePicture || `https://ui-avatars.com/api/?name=${selectedPhoto.user.username}&background=8B5CF6&color=fff`}
                        alt={selectedPhoto.user.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white/90">{selectedPhoto.user.username}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white/60">Date</h4>
                  <p className="text-white/90">{formatDate(selectedPhoto.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

export default AstronomyPortal;
