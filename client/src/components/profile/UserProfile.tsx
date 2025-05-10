import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ShieldIcon, CrownIcon, UserIcon, BookmarkIcon, MessageSquareIcon } from "lucide-react";

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
  
  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (username) {
          const response = await fetch(`/api/users/profile/${username}`);
          if (!response.ok) throw new Error("Failed to fetch profile");
          const userData = await response.json();
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
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      }
    };
    
    fetchUser();
  }, [currentUser, username, toast]);
  
  if (!user && !currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70">Loading profile...</p>
      </div>
    );
  }
  
  // Save profile changes
  const saveProfile = async () => {
    if (!isCurrentUser) return;
    
    setIsLoading(true);
    try {
      // Build profile customization object based on membership tier
      const profileCustomization: any = {
        color: customColor
      };
      
      // Add pro features if user is pro
      if (currentUser?.membershipTier === "pro") {
        profileCustomization.backgroundColor = customBgColor;
        profileCustomization.animatedBackground = isAnimatedBg;
      }
      
      const response = await apiRequest("PUT", "/api/me", {
        bio,
        profilePicture,
        themePreference: selectedTheme,
        profileCustomization
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
  
  // Get membership badge elements
  const getMembershipBadge = () => {
    const tier = user?.membershipTier || "free";
    
    if (tier === "pro") {
      return (
        <Badge className="bg-purple-500 text-white border-none">
          <CrownIcon className="h-3 w-3 mr-1" /> PRO
        </Badge>
      );
    } else if (tier === "supporter") {
      return (
        <Badge className="bg-purple-700 text-white border-none">
          <span className="mr-1">✦</span> SUPPORTER
        </Badge>
      );
    }
    return null;
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
              {user?.membershipTier !== "free" && (
                <div className="absolute -bottom-1 -right-1">
                  {getMembershipBadge()}
                </div>
              )}
            </div>
            
            <div className="md:flex-1 text-center md:text-left">
              <h1 className="text-2xl font-space font-bold">{user?.username}</h1>
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
                <Link href="/profile/settings">Edit Profile</Link>
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
              <Button variant="outline" asChild>
                <Link href="/subscribe">Upgrade for More Options</Link>
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
                {/* Saved articles would be fetched and shown here */}
                <div className="text-center py-12 text-white/60">
                  <BookmarkIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No saved articles</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/">Browse Articles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4">
            <Card className="border-white/10 bg-[#14141E]">
              <CardHeader>
                <CardTitle className="font-space">Recent Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {/* User comments would be fetched and shown here */}
                <div className="text-center py-12 text-white/60">
                  <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No comments yet</p>
                </div>
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
                  {user?.membershipTier === "pro" 
                    ? "Pro Subscription" 
                    : user?.membershipTier === "supporter" 
                      ? "Supporter Subscription" 
                      : "Free Account"}
                </h3>
                <p className="text-sm text-white/70">
                  {user?.membershipTier === "pro" 
                    ? "Full access to all premium features" 
                    : user?.membershipTier === "supporter" 
                      ? "Enhanced features and customization" 
                      : "Basic features and community access"}
                </p>
              </div>
              
              {user?.membershipTier === "free" ? (
                <Button asChild className="bg-purple-800 hover:bg-purple-700">
                  <Link href="/subscribe">Upgrade Now</Link>
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
