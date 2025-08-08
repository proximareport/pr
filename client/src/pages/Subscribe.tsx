import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  CheckIcon, 
  CreditCardIcon, 
  CrownIcon,
  RocketIcon, 
  ShieldIcon, 
  StarIcon,
  AlertTriangleIcon,
  ClockIcon
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Different feature lists for each tier
const FEATURES = {
  free: [
    "Basic profile customization",
    "Comment on articles",
    "Access public content",
    "View astronomy photo gallery"
  ],
  supporter: [
    "All Free features",
    "5 exclusive color themes",
    "Animated avatar frame",
    "\"Supporter\" profile badge",
    "Access to exclusive articles"
  ],
  pro: [
    "All Supporter features",
    "Ad-free experience",
    "Full profile customization",
    "Animated profile background",
    "Priority comment placement",
    "All premium content access"
  ]
};

// Subscription Page Component
function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // If user is not logged in, redirect to login page
  if (!user) {
    return (
      <div className="bg-[#0D0D17] min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-white/10 bg-[#14141E]">
            <CardHeader>
              <CardTitle className="font-space text-2xl text-center">Login Required</CardTitle>
              <CardDescription className="text-center">
                Please log in or create an account to view subscription plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button asChild className="bg-purple-800 hover:bg-purple-700">
                <Link href={`/login?redirect=${encodeURIComponent("/subscribe")}`}>
                  Log In
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/register?redirect=${encodeURIComponent("/subscribe")}`}>
                  Create Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D17] min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-space font-bold text-center mb-8">Membership Plans</h1>
        
        {/* Payment Services Setup Notice */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border-orange-500/30 bg-orange-950/20">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <CardTitle className="font-space text-xl text-orange-300">Payment Services Coming Soon</CardTitle>
              <CardDescription className="text-orange-200/80">
                We're currently setting up our payment processing system. Subscription features will be available soon!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-4">
                <AlertTriangleIcon className="h-3 w-3 mr-1" />
                Temporarily Unavailable
              </Badge>
              <p className="text-orange-200/70 text-sm">
                Our team is working hard to bring you secure payment options. 
                You'll be notified when subscriptions become available.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tier selection - All disabled */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free tier */}
          <Card className="border-white/10 bg-[#14141E] opacity-100">
            <CardHeader>
              <CardTitle className="font-space text-xl">Free</CardTitle>
              <CardDescription>
                Basic access to content and community
              </CardDescription>
              <div className="mt-2">
                <span className="text-2xl font-bold">$0</span>
                <span className="text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {FEATURES.free.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-4 w-4 text-purple-500 mt-1 mr-2" />
                    <span className="text-white/90 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {user.membershipTier === "free" ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Downgrade
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Supporter tier */}
          <Card className="border-purple-700/50 bg-[#14141E] relative opacity-60">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-xs px-3 py-1 rounded-full">
              COMING SOON
            </div>
            <CardHeader>
              <CardTitle className="font-space text-xl">Supporter</CardTitle>
              <CardDescription>
                Enhanced features and customization
              </CardDescription>
              <div className="mt-2">
                <span className="text-2xl font-bold">$2</span>
                <span className="text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {FEATURES.supporter.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-4 w-4 text-purple-500 mt-1 mr-2" />
                    <span className="text-white/90 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {user.membershipTier === "supporter" ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : user.membershipTier === "pro" ? (
                <Button variant="outline" className="w-full" disabled>
                  Downgrade to Supporter
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gray-600 hover:bg-gray-700 cursor-not-allowed" 
                  disabled
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Pro tier */}
          <Card className="border-purple-600/30 bg-[#14141E] opacity-60">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-xs px-3 py-1 rounded-full">
              COMING SOON
            </div>
            <CardHeader>
              <CardTitle className="font-space text-xl">Pro</CardTitle>
              <CardDescription>
                Premium experience and full access
              </CardDescription>
              <div className="mt-2">
                <span className="text-2xl font-bold">$4</span>
                <span className="text-white/60">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {FEATURES.pro.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-4 w-4 text-purple-500 mt-1 mr-2" />
                    <span className="text-white/90 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {user.membershipTier === "pro" ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                  disabled
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Additional info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-xl font-space font-bold mb-6 text-center">Why Upgrade Your Membership?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#14141E] p-6 rounded-lg border border-white/10">
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <h3 className="font-space font-bold text-center mb-2">Premium Content</h3>
              <p className="text-center text-white/70 text-sm">
                Get access to exclusive articles, in-depth analysis, and premium features not available to free users.
              </p>
            </div>
            
            <div className="bg-[#14141E] p-6 rounded-lg border border-white/10">
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <RocketIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <h3 className="font-space font-bold text-center mb-2">Customization</h3>
              <p className="text-center text-white/70 text-sm">
                Make your profile stand out with custom colors, animated frames, and unique personalization options.
              </p>
            </div>
            
            <div className="bg-[#14141E] p-6 rounded-lg border border-white/10">
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                  <ShieldIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <h3 className="font-space font-bold text-center mb-2">Ad-Free Experience</h3>
              <p className="text-center text-white/70 text-sm">
                Pro members enjoy an entirely ad-free experience throughout the entire site. No distractions.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8 text-white/60 text-sm">
            <p>
              Have questions about our subscription plans? Check our{" "}
              <Link href="/faq" className="text-purple-400 hover:underline">
                FAQ
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-purple-400 hover:underline">
                contact us
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscribe;
