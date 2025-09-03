import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { 
  CheckIcon, 
  CrownIcon,
  RocketIcon, 
  StarIcon,
  GiftIcon,
  ZapIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  Users,
  Heart,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useStripeConfig } from '@/hooks/useStripeConfig';

// Comprehensive feature definitions
const FEATURES = {
  free: [
    { feature: "Access to all public articles", included: true },
    { feature: "Basic astronomy photo gallery", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Basic profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "Google ads experience", included: true },
    { feature: "Premium themes", included: false },
    { feature: "Advanced profile customization", included: false },
    { feature: "Comment boosting", included: false },
    { feature: "Proxihub & Mission Control access", included: false }
  ],
  tier1: [
    { feature: "Access to all public articles", included: true },
    { feature: "Basic astronomy photo gallery", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Enhanced profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "No Google ads", included: true },
    { feature: "Access to premium themes", included: true },
    { feature: "More profile customization options", included: true },
    { feature: "Tier 1 Supporter badge", included: true },
    { feature: "Complete ad-free experience", included: false },
    { feature: "Comment boosting on articles", included: false },
    { feature: "Advanced Proxihub access", included: false },
    { feature: "Mission Control pages access", included: false }
  ],
  tier2: [
    { feature: "Access to all public articles", included: true },
    { feature: "Basic astronomy photo gallery", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Enhanced profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "No ads at all", included: true },
    { feature: "Access to premium themes", included: true },
    { feature: "More profile customization options", included: true },
    { feature: "Tier 1 Supporter badge", included: true },
    { feature: "Ability to boost comments on articles", included: true },
    { feature: "Access to advanced Proxihub", included: true },
    { feature: "Access to Mission Control pages", included: true },
    { feature: "Early access to updates", included: true },
    { feature: "Tier 2 Supporter badge", included: true },
    { feature: "Custom art uploads", included: false },
    { feature: "Exclusive supporter articles", included: false },
    { feature: "Discord in-progress features access", included: false }
  ],
  tier3: [
    { feature: "Access to all public articles", included: true },
    { feature: "Basic astronomy photo gallery", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Enhanced profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "No ads at all", included: true },
    { feature: "Access to premium themes", included: true },
    { feature: "More profile customization options", included: true },
    { feature: "Tier 1 Supporter badge", included: true },
    { feature: "Ability to boost comments on articles", included: true },
    { feature: "Access to advanced Proxihub", included: true },
    { feature: "Access to Mission Control pages", included: true },
    { feature: "Early access to updates", included: true },
    { feature: "Tier 2 Supporter badge", included: true },
    { feature: "Top fan badges for comments", included: true },
    { feature: "Ability to upload custom art/images directly to site", included: true },
    { feature: "Exclusive supporter articles", included: true },
    { feature: "Access to in-progress features section on Discord", included: true },
    { feature: "Full access to Proxihub and Mission Control", included: true },
    { feature: "Exclusive profile and site themes", included: true }
  ]
};

const TIER_CONFIG = {
  free: {
    name: "Free",
    price: 0,
    period: "",
    description: "Perfect for casual space enthusiasts",
    icon: StarIcon,
    color: "from-gray-600 to-gray-800",
    highlight: false,
    yearlyDiscount: 0
  },
  tier1: {
    name: "Tier 1 Supporter",
    price: 2.99,
    period: "/month",
    description: "Enhanced experience with themes and customization",
    icon: Heart,
    color: "from-blue-600 to-cyan-600",
    highlight: false,
    yearlyDiscount: 20
  },
  tier2: {
    name: "Tier 2 Supporter",
    price: 4.99,
    period: "/month",
    description: "Advanced features with Proxihub and Mission Control",
    icon: ZapIcon,
    color: "from-purple-600 to-pink-600",
    highlight: false,
    yearlyDiscount: 20
  },
  tier3: {
    name: "Tier 3 Supporter",
    price: 9.99,
    period: "/month",
    description: "Ultimate supporter experience with exclusive access",
    icon: CrownIcon,
    color: "from-purple-600 to-blue-600",
    highlight: true,
    yearlyDiscount: 25
  }
};

// Gift membership form component
function GiftMembershipForm({ tier }: { tier: 'tier1' | 'tier2' | 'tier3' }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGiftPurchase = async () => {
    if (!recipientEmail || !recipientName) {
      toast({
        title: "Missing Information",
        description: "Please fill in recipient email and name.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/gift-membership', {
        recipientEmail,
        recipientName,
        giftMessage,
        senderName: senderName || user?.username || 'Anonymous',
        tier,
        duration: 'monthly' // Could be extended to support different durations
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        throw new Error('Failed to create gift membership');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process gift membership. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipientName">Recipient Name</Label>
          <Input
            id="recipientName"
            placeholder="Enter recipient's name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="recipientEmail">Recipient Email</Label>
          <Input
            id="recipientEmail"
            type="email"
            placeholder="Enter recipient's email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="senderName">Your Name (optional)</Label>
        <Input
          id="senderName"
          placeholder="Your name for the gift message"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="giftMessage">Gift Message (optional)</Label>
        <Textarea
          id="giftMessage"
          placeholder="Add a personal message to your gift..."
          value={giftMessage}
          onChange={(e) => setGiftMessage(e.target.value)}
          rows={3}
        />
      </div>
      
      <Button 
        onClick={handleGiftPurchase} 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isLoading ? "Processing..." : `Gift ${tier === 'tier3' ? 'Tier 3' : tier === 'tier2' ? 'Tier 2' : 'Tier 1'} Membership`}
      </Button>
    </div>
  );
}

function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showGiftForm, setShowGiftForm] = useState<'tier1' | 'tier2' | 'tier3' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: stripeConfig, isLoading: stripeConfigLoading, error: stripeConfigError } = useStripeConfig();

  const handleSubscribe = async (tier: 'tier1' | 'tier2' | 'tier3') => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    // Check if user already has this tier or higher
    if (
      (tier === 'tier1' && (user.membershipTier === 'tier1' || user.membershipTier === 'tier2' || user.membershipTier === 'tier3')) ||
      (tier === 'tier2' && (user.membershipTier === 'tier2' || user.membershipTier === 'tier3')) ||
      (tier === 'tier3' && user.membershipTier === 'tier3')
    ) {
      toast({
        title: "Already subscribed",
        description: `You already have ${user.membershipTier} membership.`,
      });
      return;
    }

    if (!stripeConfig) {
      toast({
        title: "Configuration Error",
        description: "Stripe configuration is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    let priceId: string | undefined;
    try {
      const tierConfig = stripeConfig[tier];
      priceId = billingCycle === 'yearly' ? tierConfig.yearly : tierConfig.monthly;

      if (!priceId) {
        throw new Error(`Price ID not configured for ${tier} ${billingCycle} subscription`);
      }

      const response = await apiRequest('POST', '/api/create-checkout-session', {
        priceId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/pricing`
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error details:', error);
      console.error('Price ID being used:', priceId);
      console.error('Stripe config:', stripeConfig);
      
      toast({
        title: "Error",
        description: `Failed to start subscription process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleGiftClick = (tier: 'tier1' | 'tier2' | 'tier3') => {
    setShowGiftForm(showGiftForm === tier ? null : tier);
  };

  const getPrice = (tier: keyof typeof TIER_CONFIG) => {
    const config = TIER_CONFIG[tier];
    if (tier === 'free') return { display: "Free", annual: null };
    
    const monthlyPrice = config.price;
    if (billingCycle === 'yearly' && config.yearlyDiscount) {
      const yearlyPrice = monthlyPrice * 12 * (1 - config.yearlyDiscount / 100);
      const monthlyEquivalent = yearlyPrice / 12;
      return {
        display: `$${monthlyEquivalent.toFixed(2)}/month`,
        annual: `$${yearlyPrice.toFixed(0)}/year`,
        savings: `Save ${config.yearlyDiscount}%`
      };
    }
    
    return {
      display: `$${monthlyPrice}/month`,
      annual: billingCycle === 'yearly' ? `$${(monthlyPrice * 12).toFixed(0)}/year` : null
    };
  };

  // Show loading state while Stripe config is loading
  if (stripeConfigLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  // Show error state if Stripe config failed to load
  if (stripeConfigError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load subscription configuration</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/40 to-black relative overflow-hidden">
      {/* Geometric ambient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-3 md:px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Choose Your Space Journey
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Join thousands of space enthusiasts with premium access to the universe's latest discoveries
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-white/60'}`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-white/60'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                Save up to 25%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12">
          {Object.entries(TIER_CONFIG).map(([key, config]) => {
            const tierKey = key as keyof typeof TIER_CONFIG;
            const features = FEATURES[tierKey];
            const pricing = getPrice(tierKey);
            const Icon = config.icon;
            
            return (
              <Card 
                key={key}
                className={`relative border transition-all duration-300 hover:scale-105 ${
                  config.highlight 
                    ? 'border-purple-500/50 bg-white/10 shadow-2xl shadow-purple-500/20' 
                    : 'border-white/20 bg-white/5'
                } backdrop-blur-sm`}
              >
                {config.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl text-white">{config.name}</CardTitle>
                  <CardDescription className="text-white/70">{config.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {pricing.display}
                    </div>
                    {pricing.annual && (
                      <div className="text-sm text-white/60">
                        {pricing.annual}
                      </div>
                    )}
                    {pricing.savings && (
                      <div className="text-sm text-green-400 font-medium">
                        {pricing.savings}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-4 pb-4">
                  <ul className="space-y-3">
                    {features.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon 
                          className={`h-4 w-4 mt-1 mr-3 flex-shrink-0 ${
                            item.included ? 'text-green-400' : 'text-gray-500'
                          }`} 
                        />
                        <span className={`text-sm ${
                          item.included ? 'text-white/90' : 'text-white/40 line-through'
                        }`}>
                          {item.feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="px-4 pt-4 space-y-2">
                  {tierKey === 'free' ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={user?.membershipTier === 'free'}
                    >
                      {user?.membershipTier === 'free' ? 'Current Plan' : 'Get Started'}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={() => handleSubscribe(tierKey)}
                        className={`w-full ${
                          config.highlight 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        disabled={user?.membershipTier === tierKey || (user?.membershipTier === 'tier3' && tierKey === 'tier2') || (user?.membershipTier === 'tier2' && tierKey === 'tier1') || (user?.membershipTier === 'tier1' && tierKey === 'tier1')}
                      >
                        {user?.membershipTier === tierKey ? 'Current Plan' : 
                         user?.membershipTier === 'tier3' && tierKey === 'tier2' ? 'Lower Tier' :
                         user?.membershipTier === 'tier2' && tierKey === 'tier1' ? 'Lower Tier' :
                         user?.membershipTier === 'tier1' && tierKey === 'tier1' ? 'Lower Tier' :
                         'Subscribe Now'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGiftClick(tierKey)}
                        className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                      >
                        <GiftIcon className="w-4 h-4 mr-2" />
                        Gift This Plan
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Gift Membership Form */}
        {showGiftForm && (
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="bg-white/10 backdrop-blur-sm border border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GiftIcon className="w-5 h-5 text-purple-400" />
                  Gift {showGiftForm === 'tier3' ? 'Tier 3' : showGiftForm === 'tier2' ? 'Tier 2' : 'Tier 1'} Membership
                </CardTitle>
                <CardDescription className="text-white/70">
                  Give someone special the gift of premium space news and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GiftMembershipForm tier={showGiftForm} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">What's included in each plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Free plans include basic access and commenting. Supporter plans add premium themes and exclusive content. Pro plans include everything plus ad-free experience and priority features.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  We offer a 7-day free trial for all premium plans so you can experience the full benefits before committing.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">How do I cancel my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  You can cancel anytime from your account settings. Your premium access will continue until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-white/70 mb-4">
            Ready to explore the universe with us?
          </p>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Link href="/register">
              Start Your Journey Today
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Pricing; 