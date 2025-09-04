import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { CheckCircle2Icon, HomeIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SubscriptionSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | "pending">("pending");
  const { user, updateUser, refetch } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Extract session ID from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  
  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setStatus("error");
        setIsVerifying(false);
        return;
      }
      
      try {
        // Verify the session with the backend
        const response = await apiRequest("GET", `/api/stripe/verify-session?session_id=${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
          setStatus("success");
          // Update local user data
          if (updateUser) {
            await updateUser({
              membershipTier: data.tier
            });
          }
          
          // Force refresh user data from server
          await refetch();
          
          toast({
            title: "Subscription Successful!",
            description: `Welcome to ${data.tier === "enterprise" ? "Enterprise" : data.tier === "pro" ? "Pro" : "Supporter"} membership!`,
          });
        } else {
          setStatus("error");
          toast({
            title: "Verification Failed",
            description: data.message || "Could not verify your subscription",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error verifying session:", error);
        setStatus("error");
        toast({
          title: "Verification Error",
          description: "There was a problem verifying your subscription. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    }
    
    verifySession();
  }, [sessionId, toast, updateUser]);
  
  return (
    <div className="bg-[#0D0D17] min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-white/10 bg-[#14141E]">
            <CardHeader className="text-center">
              {isVerifying ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-t-transparent border-purple-500 rounded-full animate-spin mb-4"></div>
                  <CardTitle className="font-space text-2xl">Verifying Your Subscription</CardTitle>
                  <CardDescription>
                    Please wait while we confirm your payment...
                  </CardDescription>
                </div>
              ) : status === "success" ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2Icon className="w-16 h-16 text-green-500 mb-4" />
                  <CardTitle className="font-space text-2xl">Subscription Successful!</CardTitle>
                  <CardDescription>
                    Thank you for supporting Proxima Report!
                  </CardDescription>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
                    <span className="text-red-500 text-3xl">!</span>
                  </div>
                  <CardTitle className="font-space text-2xl">Verification Issue</CardTitle>
                  <CardDescription>
                    We couldn't verify your subscription status. If you believe this is an error,
                    please contact support.
                  </CardDescription>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {!isVerifying && (
                <div className="space-y-6">
                  {status === "success" && (
                    <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-600/20">
                      <h3 className="font-medium mb-2">
                        Your {user?.membershipTier === "pro" ? "Pro" : "Supporter"} membership benefits:
                      </h3>
                      <ul className="space-y-2">
                        {user?.membershipTier === "pro" ? (
                          <>
                            <li className="flex items-start text-sm">
                              <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                              <span>Ad-free experience</span>
                            </li>
                            <li className="flex items-start text-sm">
                              <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                              <span>Full profile customization</span>
                            </li>
                            <li className="flex items-start text-sm">
                              <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                              <span>Priority comment placement</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start text-sm">
                              <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                              <span>Access to premium content</span>
                            </li>
                            <li className="flex items-start text-sm">
                              <CheckCircle2Icon className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                              <span>Profile badge</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="flex-1 bg-purple-800 hover:bg-purple-700">
                      <Link href="/">
                        <HomeIcon className="w-4 h-4 mr-2" />
                        Go to Home
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/profile">
                        <UserIcon className="w-4 h-4 mr-2" />
                        View Profile
                      </Link>
                    </Button>
                  </div>
                  
                  {status === "error" && (
                    <p className="text-center text-sm text-white/60 mt-4">
                      Session ID: {sessionId || "Not provided"}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}