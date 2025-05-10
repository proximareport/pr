import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import UserProfile from "@/components/profile/UserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProfileProps {
  params: {
    username?: string;
  };
}

function Profile({ params }: ProfileProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Check if we're on settings page or viewing user profile
  const isSettings = location.includes("/settings");
  
  useEffect(() => {
    // Set active tab based on URL hash
    const hash = window.location.hash.replace("#", "");
    if (hash && ["privacy", "comments", "notifications", "subscription", "security", "data"].includes(hash)) {
      setActiveTab(hash);
    } else if (isSettings && !window.location.hash) {
      // Set default hash if on settings page without hash
      window.history.replaceState(null, '', '#privacy');
      setActiveTab("privacy");
    }
  }, [location, isSettings]);

  // Only the current user can access settings
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Only check if we're on the settings page and user is not logged in
    if (isSettings && !user) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access settings.",
        variant: "destructive",
      });
      // Redirect to home page
      setLocation("/");
    }
  }, [isSettings, user, toast, setLocation]);

  return (
    <div className="bg-[#0D0D17] min-h-screen pt-8 pb-16">
      {isSettings ? (
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-space font-bold mb-6">Account Settings</h1>
          
          <Tabs defaultValue="privacy" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-[#14141E] p-1 border border-white/10 rounded-lg grid grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="privacy" onClick={() => {
                window.history.replaceState(null, '', '#privacy');
              }}>
                Privacy
              </TabsTrigger>
              <TabsTrigger value="notifications" onClick={() => {
                window.history.replaceState(null, '', '#notifications');
              }}>
                Notifications
              </TabsTrigger>
              <TabsTrigger value="comments" onClick={() => {
                window.history.replaceState(null, '', '#comments');
              }}>
                Comments
              </TabsTrigger>
              <TabsTrigger value="subscription" onClick={() => {
                window.history.replaceState(null, '', '#subscription');
              }}>
                Subscription
              </TabsTrigger>
              <TabsTrigger value="security" onClick={() => {
                window.history.replaceState(null, '', '#security');
              }}>
                Security
              </TabsTrigger>
              <TabsTrigger value="data" onClick={() => {
                window.history.replaceState(null, '', '#data');
              }}>
                Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy">
              <div className="bg-[#14141E] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-space font-bold mb-4">Privacy Settings</h2>
                <p className="text-white/70 mb-6">
                  Control how your information is used and who can see your activity
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <h3 className="font-medium">Profile Visibility</h3>
                      <p className="text-sm text-white/60">Control who can see your profile information</p>
                    </div>
                    <select className="bg-[#1E1E2D] rounded border border-white/10 px-3 py-2">
                      <option value="public">Public</option>
                      <option value="members">Registered Members Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <h3 className="font-medium">Activity Tracking</h3>
                      <p className="text-sm text-white/60">Allow us to track your activity for better recommendations</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <h3 className="font-medium">Personalized Ads</h3>
                      <p className="text-sm text-white/60">Show ads based on your interests and activity</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium">Email Sharing</h3>
                      <p className="text-sm text-white/60">Allow partners to contact you with offers</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="comments">
              <div className="bg-[#14141E] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-space font-bold mb-4">Comment Settings</h2>
                <p className="text-white/70 mb-6">
                  Manage how you interact with comments and discussions
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <h3 className="font-medium">Comment Notifications</h3>
                      <p className="text-sm text-white/60">Get notified when someone replies to your comments</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <h3 className="font-medium">Default Comment Sorting</h3>
                      <p className="text-sm text-white/60">How comments should be displayed by default</p>
                    </div>
                    <select className="bg-[#1E1E2D] rounded border border-white/10 px-3 py-2">
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium">Show Avatar in Comments</h3>
                      <p className="text-sm text-white/60">Display your profile picture next to your comments</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <Button className="mt-4 bg-purple-800 hover:bg-purple-700">
                    Save Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <div className="bg-[#14141E] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-space font-bold mb-4">Data Management</h2>
                <p className="text-white/70 mb-6">
                  Control your personal data and account settings
                </p>
                
                <div className="space-y-8">
                  <div className="border border-white/10 rounded-lg p-5 bg-[#1A1A27]">
                    <h3 className="text-lg font-medium mb-3">Export Your Data</h3>
                    <p className="mb-4 text-sm text-white/70">
                      Download a copy of all your data including profile information, comments, and activity history.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline">Export Profile Data</Button>
                      <Button variant="outline">Export Activity History</Button>
                    </div>
                  </div>
                  
                  <div className="border border-white/10 rounded-lg p-5 bg-[#1A1A27]">
                    <h3 className="text-lg font-medium mb-1 text-red-500">Danger Zone</h3>
                    <p className="mb-4 text-sm text-white/70">
                      These actions are permanent and cannot be undone.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-red-900/30 rounded-md bg-red-950/20">
                        <div>
                          <h4 className="font-medium">Delete All Comments</h4>
                          <p className="text-xs text-white/60">Remove all your comments from articles and discussions</p>
                        </div>
                        <Button variant="destructive" className="mt-2 sm:mt-0">
                          Delete Comments
                        </Button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-red-900/30 rounded-md bg-red-950/20">
                        <div>
                          <h4 className="font-medium">Delete Account</h4>
                          <p className="text-xs text-white/60">Permanently delete your account and all associated data</p>
                        </div>
                        <Button variant="destructive" className="mt-2 sm:mt-0">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <div className="bg-[#14141E] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-space font-bold mb-4">Notification Preferences</h2>
                <p className="text-white/70 mb-4">
                  Configure how and when you receive notifications from Proxima Report.
                </p>
                <div className="text-center py-8 text-white/50">
                  <p>Notification settings coming soon</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="subscription">
              <div className="bg-[#14141E] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-space font-bold mb-4">Subscription Management</h2>
                <p className="text-white/70 mb-4">
                  Review and manage your current subscription plan.
                </p>
                
                <div className="bg-[#1E1E2D] rounded-lg p-4 mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div>
                      <h3 className="font-space font-bold text-lg">
                        {user?.membershipTier === "pro" 
                          ? "Pro Plan" 
                          : user?.membershipTier === "supporter" 
                            ? "Supporter Plan" 
                            : "Free Plan"}
                      </h3>
                      <p className="text-sm text-white/70">
                        {user?.membershipTier === "pro" 
                          ? "$4/month" 
                          : user?.membershipTier === "supporter" 
                            ? "$2/month" 
                            : "Free"}
                      </p>
                    </div>
                    
                    {user?.membershipTier === "free" ? (
                      <Link href="/subscribe">
                        <a className="mt-2 sm:mt-0 px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-md inline-block">
                          Upgrade
                        </a>
                      </Link>
                    ) : (
                      <div className="bg-green-900/20 text-green-500 px-3 py-1 rounded text-sm mt-2 sm:mt-0">
                        Active
                      </div>
                    )}
                  </div>
                  
                  {user?.membershipTier !== "free" && (
                    <>
                      <p className="text-sm text-white/70 mb-4">
                        Your subscription renews on the 1st of each month.
                      </p>
                      <div className="flex gap-2">
                        <button className="text-sm text-purple-400 hover:underline">
                          Update payment method
                        </button>
                        <span className="text-white/30">|</span>
                        <button className="text-sm text-purple-400 hover:underline">
                          Cancel subscription
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {user?.membershipTier === "supporter" && (
                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="font-bold mb-2">Upgrade to Pro</h4>
                    <p className="text-sm text-white/70 mb-3">
                      Get access to full profile customization, ad-free experience, 
                      priority comment placement, and more for just $2 more per month.
                    </p>
                    <Link href="/subscribe?tier=pro">
                      <a className="inline-block px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-md text-sm">
                        Upgrade to Pro
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="bg-[#14141E] border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-space font-bold mb-4">Security Settings</h2>
                <p className="text-white/70 mb-4">
                  Manage your account security and password.
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">Current Password</label>
                        <input 
                          type="password" 
                          className="w-full p-2 rounded bg-[#1E1E2D] border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">New Password</label>
                        <input 
                          type="password" 
                          className="w-full p-2 rounded bg-[#1E1E2D] border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">Confirm New Password</label>
                        <input 
                          type="password" 
                          className="w-full p-2 rounded bg-[#1E1E2D] border border-white/10"
                        />
                      </div>
                      <button className="px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-md">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <UserProfile username={params.username} />
      )}
    </div>
  );
}

export default Profile;
