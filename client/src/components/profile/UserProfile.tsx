import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mapDatabaseTierToFrontend, getTierDisplayName, getTierDescription, isPaidTier } from "@/lib/tierMapping";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RoleBadges } from "@/components/ui/role-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ChromePicker } from "react-color";
import { ShieldIcon, CrownIcon, UserIcon, BookmarkIcon, MessageSquareIcon, ClockIcon } from "lucide-react";

interface ProfileProps {
  username?: string;
  isEditable?: boolean;
}

const UserProfile = ({ username, isEditable = false }: ProfileProps) => {
  const { user: currentUser, setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUserData] = useState<any>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  // Profile edits
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("dark");
  const [customColor, setCustomColor] = useState("#5A189A"); // Default purple
  
  // Pro user customizations
  const [customBgColor, setCustomBgColor] = useState("");
  const [isAnimatedBg, setIsAnimatedBg] = useState(false);

  // User activity data
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Fetch user's saved articles
  const fetchSavedArticles = async (userId: number) => {
    try {
      setLoadingSaved(true);
      const response = await fetch(`/api/users/${userId}/saved-articles`);
      if (response.ok) {
        const data = await response.json();
        setSavedArticles(data);
      }
    } catch (error) {
      console.error("Error fetching saved articles:", error);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Fetch user's comments
  const fetchUserComments = async (userId: number) => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/users/${userId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setUserComments(data);
      }
    } catch (error) {
      console.error("Error fetching user comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (username) {
          setIsLoading(true);
          console.log("Fetching profile for:", username);
          const response = await fetch(`/api/users/username/${username}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              toast({
                title: "Profile Not Found",
                description: `The user profile for "${username}" does not exist.`,
                variant: "destructive",
              });
              return;
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const userData = await response.json();
          console.log("Profile data:", userData);
          setUserData(userData);
          setIsCurrentUser(currentUser?.username === username);
          
          // Initialize form with user data
          if (userData) {
            setBio(userData.bio || "");
            setProfilePicture(userData.profilePicture || "");
            setSelectedTheme(userData.themePreference || "dark");
            
            // Get custom settings from profileCustomization JSON
            if (userData.profileCustomization) {
              if (userData.profileCustomization.color) {
                setCustomColor(userData.profileCustomization.color);
              }
              if (userData.profileCustomization.backgroundColor) {
                setCustomBgColor(userData.profileCustomization.backgroundColor);
              }
              setIsAnimatedBg(userData.profileCustomization.animatedBackground || false);
            }

            // Fetch user's activity data
            fetchSavedArticles(userData.id);
            fetchUserComments(userData.id);
          }
        } else if (currentUser) {
          // Use current logged in user
          setUserData(currentUser);
          setIsCurrentUser(true);
          
          // Initialize form with user data
          setBio(currentUser.bio || "");
          setProfilePicture(currentUser.profilePicture || "");
          setSelectedTheme(currentUser.themePreference || "dark");
          
          // Get custom settings from profileCustomization JSON
          if (currentUser.profileCustomization) {
            if (currentUser.profileCustomization.color) {
              setCustomColor(currentUser.profileCustomization.color);
            }
            if (currentUser.profileCustomization.backgroundColor) {
              setCustomBgColor(currentUser.profileCustomization.backgroundColor);
            }
            setIsAnimatedBg(currentUser.profileCustomization.animatedBackground || false);
          }

          // Fetch user's activity data
          fetchSavedArticles(currentUser.id);
          fetchUserComments(currentUser.id);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast({
          title: "Error Loading Profile",
          description: error instanceof Error ? error.message : "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [currentUser, username, toast]);
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/70">Loading profile...</p>
      </div>
    );
  }
  
  // Return error state if we couldn't load the profile
  if (!user && !currentUser) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-white/70">
            {username 
              ? `We couldn't find a user profile for "${username}".` 
              : "No profile information is available."}
          </p>
        </div>
        <Button asChild className="bg-purple-800 hover:bg-purple-700">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }
  
  // Save profile changes
  const saveProfile = async () => {
    if (!isCurrentUser) return;
    
    setIsLoading(true);
    try {
      // Build profile customization object based on membership tier
      const profileCustomizationObj: any = {
        color: customColor
      };
      
      // Add pro features if user is pro
      if (currentUser?.membershipTier === "pro") {
        profileCustomizationObj.backgroundColor = customBgColor;
        profileCustomizationObj.animatedBackground = isAnimatedBg;
      }
      
      console.log("Sending profile update:", {
        bio,
        profilePicture,
        themePreference: selectedTheme,
        profileCustomization: profileCustomizationObj
      });
      
      const response = await apiRequest("PUT", "/api/me", {
        bio,
        profilePicture,
        themePreference: selectedTheme,
        profileCustomization: profileCustomizationObj
      });
      
      // Update current user in auth context
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  


  // Background style for profile based on membership
  const getProfileBackgroundStyle = () => {
    const tier = user?.membershipTier || "free";
    
    if (tier === "pro" && isAnimatedBg) {
      return {
        background: `linear-gradient(45deg, ${customBgColor || "#0D0D17"}, #0D0D17)`,
        animation: "gradient 15s ease infinite",
      };
    } else if (tier === "pro" && customBgColor) {
      return {
        background: `linear-gradient(45deg, ${customBgColor}, #0D0D17)`,
      };
    } else if (tier === "supporter") {
      return {
        background: "#0D0D17",
        borderColor: "rgba(157, 78, 221, 0.3)",
      };
    }
    
    return {
      background: "#0D0D17",
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card 
        className="mb-8 border border-white/10 overflow-hidden"
        style={getProfileBackgroundStyle()}
      >
        <div className="h-24 bg-gradient-to-r from-purple-900/20 to-black/0"></div>
        <CardContent className="pt-0 -mt-12">
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-end">
            {/* Avatar with badge for supporter/pro */}
            <div className="relative">
              <div className={`h-24 w-24 rounded-full overflow-hidden border-4 ${
                user?.membershipTier === "pro" 
                  ? "border-purple-500 membership-badge" 
                  : user?.membershipTier === "supporter"
                    ? "border-purple-700"
                    : "border-white/20"
              }`}>
                <Avatar className="h-full w-full">
                  <AvatarImage 
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username}&background=8B5CF6&color=fff`} 
                    alt={user?.username || "User"} 
                  />
                  <AvatarFallback className="text-2xl bg-purple-900 text-white">
                    {user?.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

            </div>
            
            <div className="md:flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-2xl font-space font-bold">{user?.username}</h1>
                <RoleBadges 
                  role={user?.role} 
                  membershipTier={user?.membershipTier}
                  size="md"
                  showAll={true}
                />
              </div>
              <p className="text-white/70 mt-1 max-w-md">
                {user?.bio || "No bio provided"}
              </p>
            </div>
            
            {isCurrentUser && isEditable && (
              <Button onClick={saveProfile} className="bg-purple-800 hover:bg-purple-700">
                Save Changes
              </Button>
            )}
            
            {isCurrentUser && !isEditable && (
              <Button asChild className="bg-purple-800 hover:bg-purple-700">
                <Link href="/edit-profile">Edit Profile</Link>
              </Button>
            )}
            
            {!isCurrentUser && (
              <Button variant="outline">Follow</Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isEditable ? (
        <Card className="border-white/10 bg-[#14141E]">
          <CardHeader>
            <CardTitle className="font-space">Edit Profile</CardTitle>
            <CardDescription>Customize how others see you on Proxima Report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Profile Picture URL</label>
              <Input
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="https://example.com/your-image.jpg"
                className="bg-[#1E1E2D] border-white/10"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself"
                maxLength={user?.membershipTier === "free" ? 150 : 500}
                className="bg-[#1E1E2D] border-white/10"
              />
              <p className="text-xs text-white/50 mt-1">
                {user?.membershipTier === "free" 
                  ? `${bio.length}/150 characters (Free tier limit)` 
                  : ""}
              </p>
            </div>
            
            {/* Theme selection available to all users */}
            <div>
              <label className="text-sm font-medium mb-1 block">Theme Preference</label>
              <Select
                value={selectedTheme}
                onValueChange={setSelectedTheme}
              >
                <SelectTrigger className="bg-[#1E1E2D] border-white/10">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark (Default)</SelectItem>
                  <SelectItem value="system">System Preference</SelectItem>
                  {(user?.membershipTier === "supporter" || user?.membershipTier === "pro") && (
                    <>
                      <SelectItem value="cosmic">Cosmic Purple</SelectItem>
                      <SelectItem value="deepspace">Deep Space</SelectItem>
                      <SelectItem value="mars">Mars Red</SelectItem>
                      <SelectItem value="nebula">Nebula Blue</SelectItem>
                      <SelectItem value="eclipse">Eclipse</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {user?.membershipTier === "free" && (
                <p className="text-xs text-white/50 mt-1">
                  Upgrade to Supporter for 5 additional theme options
                </p>
              )}
            </div>
            
            {/* Supporter & Pro color options */}
            {(user?.membershipTier === "supporter" || user?.membershipTier === "pro") && (
              <div>
                <label className="text-sm font-medium mb-1 block">Accent Color</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer"
                    style={{ backgroundColor: customColor }}
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  ></div>
                  <span className="text-sm">{customColor}</span>
                </div>
                {isColorPickerOpen && (
                  <div className="mt-2">
                    <ChromePicker 
                      color={customColor}
                      onChange={(color) => setCustomColor(color.hex)}
                      disableAlpha
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Pro-only customizations */}
            {user?.membershipTier === "pro" && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="font-medium">Pro Customizations</h3>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Profile Background</label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer"
                      style={{ background: customBgColor || "#14141E" }}
                      onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    ></div>
                    <Input
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      placeholder="#000000"
                      className="bg-[#1E1E2D] border-white/10 w-32"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="animated-bg"
                    checked={isAnimatedBg}
                    onChange={(e) => setIsAnimatedBg(e.target.checked)}
                    className="rounded border-white/20 bg-transparent"
                  />
                  <label htmlFor="animated-bg" className="text-sm font-medium">
                    Animated background gradient
                  </label>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-white/10 pt-4">
            {user?.membershipTier === "free" && (
              <Button variant="outline" disabled className="cursor-not-allowed">
                <ClockIcon className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            )}
            <Button 
              onClick={saveProfile} 
              className="bg-purple-800 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="activity">
          <TabsList className="bg-[#14141E]">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-4">
            <Card className="border-white/10 bg-[#14141E]">
              <CardHeader>
                <CardTitle className="font-space">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {/* User activity would be fetched and shown here */}
                <div className="text-center py-12 text-white/60">
                  <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No recent activity to show</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            <Card className="border-white/10 bg-[#14141E]">
              <CardHeader>
                <CardTitle className="font-space">Saved Articles</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSaved ? (
                  <div className="text-center py-12 text-white/60">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading saved articles...</p>
                  </div>
                ) : savedArticles.length > 0 ? (
                  <div className="space-y-4">
                    {savedArticles.map((saved, index) => (
                      <div key={index} className="p-4 bg-[#1A1A27] rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          {saved.article?.featuredImage && (
                            <img 
                              src={saved.article.featuredImage} 
                              alt={saved.article.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium text-white mb-1">
                              {saved.article?.title || 'Ghost Article'}
                            </h3>
                            <p className="text-sm text-white/60 mb-2">
                              Saved {new Date(saved.savedAt).toLocaleDateString()}
                            </p>
                            <Link 
                              to={`/articles/${saved.ghostPostId}`}
                              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              Read Article →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/60">
                    <BookmarkIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No saved articles</p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/">Browse Articles</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4">
            <Card className="border-white/10 bg-[#14141E]">
              <CardHeader>
                <CardTitle className="font-space">Recent Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingComments ? (
                  <div className="text-center py-12 text-white/60">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading comments...</p>
                  </div>
                ) : userComments.length > 0 ? (
                  <div className="space-y-4">
                    {userComments.map((comment, index) => (
                      <div key={index} className="p-4 bg-[#1A1A27] rounded-lg border border-white/10">
                        <div className="mb-3">
                          <p className="text-white/90 text-sm mb-2">{comment.content}</p>
                          <div className="flex items-center gap-4 text-xs text-white/60">
                            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            <span>↑ {comment.upvotes}</span>
                            <span>↓ {comment.downvotes}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-white/10">
                          <Link 
                            to={`/articles/${comment.ghostPostId}`}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            View Article →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/60">
                    <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No comments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Membership Status for current user */}
      {isCurrentUser && !isEditable && (
        <Card className="mt-6 border-white/10 bg-[#14141E]">
          <CardHeader>
            <CardTitle className="font-space">Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-[#1E1E2D] rounded-lg">
              <div>
                <h3 className="font-space font-bold">
                  {getTierDisplayName(user?.membershipTier || 'free')} Subscription
                </h3>
                <p className="text-sm text-white/70">
                  {getTierDescription(user?.membershipTier || 'free')}
                </p>
              </div>
              
              {!isPaidTier(user?.membershipTier || 'free') ? (
                <Button className="bg-gray-600 hover:bg-gray-700 cursor-not-allowed" disabled>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/profile/settings#subscription">Manage Subscription</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
