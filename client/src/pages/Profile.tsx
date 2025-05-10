import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import UserProfile from "@/components/profile/UserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    if (hash && ["profile", "notifications", "subscription", "security"].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  // Only the current user can access settings
  if (isSettings && (!user || (params.username && params.username !== user.username))) {
    toast({
      title: "Unauthorized",
      description: "You don't have permission to access these settings.",
      variant: "destructive",
    });
    // Redirect would happen here
  }

  return (
    <div className="bg-[#0D0D17] min-h-screen pt-8 pb-16">
      {isSettings ? (
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-space font-bold mb-6">Account Settings</h1>
          
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-[#14141E] p-1 border border-white/10 rounded-lg grid grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="profile" onClick={() => window.location.hash = "profile"}>
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" onClick={() => window.location.hash = "notifications"}>
                Notifications
              </TabsTrigger>
              <TabsTrigger value="subscription" onClick={() => window.location.hash = "subscription"}>
                Subscription
              </TabsTrigger>
              <TabsTrigger value="security" onClick={() => window.location.hash = "security"}>
                Security
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <UserProfile isEditable={true} />
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
                      <a 
                        href="/subscribe" 
                        className="mt-2 sm:mt-0 px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-md"
                      >
                        Upgrade
                      </a>
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
                    <a 
                      href="/subscribe?tier=pro" 
                      className="inline-block px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-md text-sm"
                    >
                      Upgrade to Pro
                    </a>
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
