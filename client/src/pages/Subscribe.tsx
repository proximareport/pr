import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  CheckIcon, 
  CreditCardIcon, 
  CrownIcon,
  RocketIcon, 
  ShieldIcon, 
  StarIcon
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

// Make sure to load Stripe outside of the component to avoid recreating it on every render
// Create a dummy promise for development without a Stripe key
let stripePromise;
try {
  if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  } else {
    console.warn('No Stripe public key found. Using dummy implementation for development.');
    // Create a dummy Promise that resolves to an object implementing the Stripe interface
    stripePromise = Promise.resolve({
      elements: () => ({
        create: () => ({})
      }),
      confirmPayment: async () => ({ error: { message: 'This is a dummy Stripe implementation.' } })
    });
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

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

// Price IDs - would normally be environment variables
const PRICE_IDS = {
  supporter: import.meta.env.STRIPE_SUPPORTER_PRICE_ID || "price_supporter",
  pro: import.meta.env.STRIPE_PRO_PRICE_ID || "price_pro"
};

// Payment Form Component
function CheckoutForm({ tier }: { tier: "supporter" | "pro" }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "An unknown error occurred");
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your subscription has been activated!",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        title: "Payment Error",
        description: "Something went wrong with the payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-1 bg-white/5 rounded-lg mb-6">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-purple-800 hover:bg-purple-700"
        disabled={!stripe || isLoading}
      >
        {isLoading ? "Processing..." : `Subscribe to ${tier === "pro" ? "Pro" : "Supporter"}`}
      </Button>
      
      <p className="text-xs text-white/60 text-center mt-4">
        By subscribing, you agree to our{" "}
        <Link href="/terms" className="text-purple-400 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-purple-400 hover:underline">
          Privacy Policy
        </Link>.
      </p>
    </form>
  );
}

// Subscription Page Component
function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedTier, setSelectedTier] = useState<"supporter" | "pro" | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get the tier from URL query param
  const params = new URLSearchParams(window.location.search);
  const tierParam = params.get("tier") as "supporter" | "pro" | null;
  
  useEffect(() => {
    if (tierParam && (tierParam === "supporter" || tierParam === "pro")) {
      setSelectedTier(tierParam);
    }
  }, [tierParam]);
  
  // Redirect if user is already on the selected plan or higher
  useEffect(() => {
    if (user) {
      if (
        (selectedTier === "supporter" && (user.membershipTier === "supporter" || user.membershipTier === "pro")) ||
        (selectedTier === "pro" && user.membershipTier === "pro")
      ) {
        toast({
          title: "Already subscribed",
          description: `You are already subscribed to the ${user.membershipTier} plan.`,
        });
        navigate("/profile/settings#subscription");
      }
    }
  }, [user, selectedTier, navigate, toast]);
  
  // Create a payment intent when a tier is selected
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!selectedTier || !user) return;
      
      try {
        const priceId = selectedTier === "pro" ? PRICE_IDS.pro : PRICE_IDS.supporter;
        const response = await apiRequest("POST", "/api/stripe/create-checkout-session", { priceId });
        const data = await response.json();
        
        // If we get a URL directly, redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        
        // Otherwise set the client secret for Elements
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast({
          title: "Error",
          description: "Could not initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    if (selectedTier && user) {
      createPaymentIntent();
    }
  }, [selectedTier, user, toast]);
  
  // If user is not logged in, redirect to login page
  if (!user) {
    return (
      <div className="bg-[#0D0D17] min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-white/10 bg-[#14141E]">
            <CardHeader>
              <CardTitle className="font-space text-2xl text-center">Login Required</CardTitle>
              <CardDescription className="text-center">
                Please log in or create an account to subscribe.
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
        
        {!selectedTier ? (
          // Tier selection
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free tier */}
            <Card className="border-white/10 bg-[#14141E] hover:shadow-[0_0_10px_rgba(157,78,221,0.3)] transition-shadow">
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
                  <Button variant="outline" className="w-full">
                    Downgrade
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Supporter tier */}
            <Card className="border-purple-700/50 bg-[#14141E] relative hover:shadow-[0_0_15px_rgba(157,78,221,0.5)] transition-shadow">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-800 text-white text-xs px-3 py-1 rounded-full">
                POPULAR
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
                  <Button variant="outline" className="w-full">
                    Downgrade to Supporter
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-purple-800 hover:bg-purple-700" 
                    onClick={() => setSelectedTier("supporter")}
                  >
                    Subscribe
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Pro tier */}
            <Card className="border-purple-600/30 bg-[#14141E] hover:shadow-[0_0_15px_rgba(157,78,221,0.5)] transition-shadow">
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
                    className="w-full bg-purple-500 hover:bg-purple-600"
                    onClick={() => setSelectedTier("pro")}
                  >
                    Subscribe
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        ) : (
          // Checkout form
          <div className="max-w-2xl mx-auto">
            <Card className="border-white/10 bg-[#14141E]">
              <CardHeader>
                <div className="flex items-center justify-center mb-2">
                  {selectedTier === "pro" ? (
                    <CrownIcon className="h-8 w-8 text-purple-500" />
                  ) : (
                    <StarIcon className="h-8 w-8 text-purple-500" />
                  )}
                </div>
                <CardTitle className="font-space text-2xl text-center">
                  {selectedTier === "pro" ? "Pro Subscription" : "Supporter Subscription"}
                </CardTitle>
                <CardDescription className="text-center">
                  {selectedTier === "pro" 
                    ? "Unlock all premium features and an ad-free experience" 
                    : "Enhanced experience with exclusive features"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-3xl font-bold">
                    ${selectedTier === "pro" ? "4" : "2"}
                  </span>
                  <span className="text-white/60">/month</span>
                </div>
                
                <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                  <h3 className="font-medium mb-2 flex items-center">
                    <ShieldIcon className="h-4 w-4 mr-2 text-purple-500" />
                    What's included:
                  </h3>
                  <ul className="space-y-2">
                    {FEATURES[selectedTier].map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckIcon className="h-4 w-4 text-purple-500 mt-0.5 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret, appearance: { theme: 'night' } }}
                  >
                    <CheckoutForm tier={selectedTier} />
                  </Elements>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/70">Setting up payment...</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setSelectedTier(null)}
                >
                  Back to plans
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Testimonials or extra info */}
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
