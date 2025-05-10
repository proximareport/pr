import { Link } from "wouter";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

function MembershipBanner() {
  const { user } = useAuth();
  
  // Don't show membership banner to logged in pro users
  if (user && user.membershipTier === "pro") {
    return null;
  }
  
  return (
    <div className="bg-[#14141E] py-10 border-y border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:max-w-xl">
            <h2 className="font-space text-2xl md:text-3xl font-bold text-white mb-2">
              Join the Proxima Community
            </h2>
            <p className="text-white/80">
              Get exclusive content, customize your profile, and join discussions with leading scientists and space enthusiasts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-[#1E1E2D] p-5 rounded-lg border border-white/10 hover:border-purple-500/30 transition hover:shadow-[0_0_10px_rgba(157,78,221,0.3)]">
              <h3 className="font-space font-bold text-xl mb-2">Free</h3>
              <p className="text-white/70 text-sm mb-4">Basic access to all public content</p>
              <ul className="text-white/90 text-sm mb-4 space-y-2">
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Comment on articles</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Basic profile customization</span>
                </li>
              </ul>
              <Button variant="secondary" asChild className="w-full">
                <Link href="/register">
                  Sign Up
                </Link>
              </Button>
            </div>
            
            <div className="bg-gradient-to-b from-[#1E1E2D] to-[#1E1E2D] border border-purple-700/50 p-5 rounded-lg relative hover:shadow-[0_0_10px_rgba(157,78,221,0.3)] transition">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-800 text-white text-xs px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="font-space font-bold text-xl mb-2">Supporter</h3>
              <p className="text-white/70 text-sm mb-1">$2 per month</p>
              <p className="text-white/70 text-sm mb-4">Enhanced experience & customization</p>
              <ul className="text-white/90 text-sm mb-4 space-y-2">
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>5 exclusive color themes</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Animated avatar frame</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>"Supporter" profile badge</span>
                </li>
              </ul>
              <Button className="w-full bg-purple-800 hover:bg-purple-700" asChild>
                <Link href="/subscribe?tier=supporter">
                  Subscribe
                </Link>
              </Button>
            </div>
            
            <div className="bg-gradient-to-b from-[#1E1E2D] to-[#1E1E2D] border border-purple-600/30 p-5 rounded-lg hover:shadow-[0_0_10px_rgba(157,78,221,0.3)] transition">
              <h3 className="font-space font-bold text-xl mb-2">Pro</h3>
              <p className="text-white/70 text-sm mb-1">$4 per month</p>
              <p className="text-white/70 text-sm mb-4">Premium experience & full access</p>
              <ul className="text-white/90 text-sm mb-4 space-y-2">
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Ad-free experience</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Full profile customization</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Priority comment placement</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                  <span>Animated profile background</span>
                </li>
              </ul>
              <Button className="w-full bg-purple-500 hover:bg-purple-600" asChild>
                <Link href="/subscribe?tier=pro">
                  Subscribe
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipBanner;
