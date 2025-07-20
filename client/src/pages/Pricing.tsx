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
  Sparkles
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

// Comprehensive feature definitions
const FEATURES = {
  free: [
    { feature: "Access to all public articles", included: true },
    { feature: "Basic astronomy photo gallery", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Basic profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "Ad-free experience", included: false },
    { feature: "Exclusive articles & content", included: false },
    { feature: "Premium themes", included: false },
    { feature: "Priority support", included: false },
    { feature: "Early access to features", included: false }
  ],
  supporter: [
    { feature: "Access to all public articles", included: true },
    { feature: "Basic astronomy photo gallery", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Enhanced profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "Reduced ads experience", included: true },
    { feature: "5 exclusive premium themes", included: true },
    { feature: "Supporter badge & animated avatar", included: true },
    { feature: "Access to exclusive supporter articles", included: true },
    { feature: "Priority comment placement", included: true },
    { feature: "Complete ad-free experience", included: false },
    { feature: "Full premium content library", included: false },
    { feature: "Early access to features", included: false }
  ],
  pro: [
    { feature: "Access to all public articles", included: true },
    { feature: "Premium astronomy gallery & tools", included: true },
    { feature: "Comment on articles", included: true },
    { feature: "Complete profile customization", included: true },
    { feature: "Newsletter subscription", included: true },
    { feature: "Complete ad-free experience", included: true },
    { feature: "All premium themes & customization", included: true },
    { feature: "Pro badge & premium animations", included: true },
    { feature: "Full premium content library", included: true },
    { feature: "Priority support & feedback", included: true },
    { feature: "Early access to new features", included: true },
    { feature: "Animated profile backgrounds", included: true },
    { feature: "Priority content suggestions", included: true }
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
    highlight: false
  },
  supporter: {
    name: "Supporter",
    price: 4.99,
    period: "/month",
    description: "Support our mission and get premium perks",
    icon: Heart,
    color: "from-purple-600 to-pink-600",
    highlight: false,
    yearlyDiscount: 20
  },
  pro: {
    name: "Pro",
    price: 9.99,
    period: "/month",
    description: "Ultimate space news experience",
    icon: RocketIcon,
    color: "from-purple-600 to-blue-600",
    highlight: true,
    yearlyDiscount: 25
  }
};

// Gift membership form component
function GiftMembershipForm({ tier }: { tier: 'supporter' | 'pro' }) {
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
        {isLoading ? "Processing..." : `Gift ${tier === 'pro' ? 'Pro' : 'Supporter'} Membership`}
      </Button>
    </div>
  );
}

function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showGiftForm, setShowGiftForm] = useState<'supporter' | 'pro' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubscribe = async (tier: 'supporter' | 'pro') => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    // Check if user already has this tier or higher
    if (
      (tier === 'supporter' && (user.membershipTier === 'supporter' || user.membershipTier === 'pro')) ||
      (tier === 'pro' && user.membershipTier === 'pro')
    ) {
      toast({
        title: "Already subscribed",
        description: `You already have ${user.membershipTier} membership.`,
      });
      return;
    }

    try {
      const priceId = tier === 'pro' 
        ? (billingCycle === 'yearly' ? 'price_pro_yearly' : 'price_pro_monthly')
        : (billingCycle === 'yearly' ? 'price_supporter_yearly' : 'price_supporter_monthly');

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
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
    }
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
                        disabled={user?.membershipTier === tierKey || (user?.membershipTier === 'pro' && tierKey === 'supporter')}
                      >
                        {user?.membershipTier === tierKey ? 'Current Plan' : 
                         user?.membershipTier === 'pro' && tierKey === 'supporter' ? 'Lower Tier' :
                         'Get Started'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGiftForm(showGiftForm === tierKey ? null : tierKey)}
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
                  Gift {showGiftForm === 'pro' ? 'Pro' : 'Supporter'} Membership
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
                <CardTitle className="text-lg text-white">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">How do gift memberships work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Gift recipients receive an email with instructions to claim their membership. They can create an account or apply it to an existing one.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  We accept all major credit cards, PayPal, and other payment methods through our secure Stripe integration.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Absolutely! You can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
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