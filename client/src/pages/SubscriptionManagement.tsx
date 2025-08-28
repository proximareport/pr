import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  Crown, 
  Heart, 
  Star, 
  XCircle, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Gift
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SubscriptionData {
  active: boolean;
  tier: 'free' | 'supporter' | 'pro';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  billingCycle?: 'monthly' | 'yearly';
}

interface UsageData {
  feature: string;
  usage_count: number;
  usage_limit: number;
  reset_date: string;
}

function SubscriptionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subscriptionRes, usageRes] = await Promise.all([
        apiRequest('GET', '/api/subscription'),
        apiRequest('GET', '/api/subscription/usage')
      ]);

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        setSubscription(subscriptionData);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.active) return;

    setIsCanceling(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/cancel');
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: data.cancelAtPeriodEnd } : null);
        toast({
          title: "Subscription Canceled",
          description: "Your subscription will end at the end of the current billing period.",
        });
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.active) return;

    setIsReactivating(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/reactivate');
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: data.cancelAtPeriodEnd } : null);
        toast({
          title: "Subscription Reactivated",
          description: "Your subscription has been reactivated successfully.",
        });
      } else {
        throw new Error('Failed to reactivate subscription');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'supporter':
        return <Heart className="h-6 w-6 text-pink-500" />;
      default:
        return <Star className="h-6 w-6 text-gray-400" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600';
      case 'supporter':
        return 'bg-gradient-to-r from-pink-600 to-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro';
      case 'supporter':
        return 'Supporter';
      default:
        return 'Free';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-space text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Subscription Management
          </h1>
          <p className="text-xl text-white/70">
            Manage your subscription, billing, and usage
          </p>
        </div>

        {/* Current Subscription Status */}
        <Card className="border-white/10 bg-[#14141E] mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getTierIcon(subscription?.tier || 'free')}
              Current Plan: {getTierName(subscription?.tier || 'free')}
            </CardTitle>
            <CardDescription>
              {subscription?.active 
                ? 'Your subscription is active and you have access to all features.'
                : 'You are currently on the free plan.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription?.active && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1E1E2D] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-400" />
                      <span className="font-medium">Billing Cycle</span>
                    </div>
                    <p className="text-white/70 capitalize">
                      {subscription.billingCycle || 'Monthly'}
                    </p>
                  </div>
                  
                  <div className="bg-[#1E1E2D] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-purple-400" />
                      <span className="font-medium">Next Billing Date</span>
                    </div>
                    <p className="text-white/70">
                      {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
                    </p>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <span className="font-medium text-yellow-300">Subscription Ending</span>
                    </div>
                    <p className="text-yellow-200 text-sm">
                      Your subscription will end on {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}. 
                      You can reactivate it anytime before then.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  {subscription.cancelAtPeriodEnd ? (
                    <Button
                      onClick={handleReactivateSubscription}
                      disabled={isReactivating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isReactivating ? 'Reactivating...' : 'Reactivate Subscription'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      variant="destructive"
                    >
                      {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                    </Button>
                  )}
                  
                  <Button variant="outline" asChild>
                    <a href="/pricing">Change Plan</a>
                  </Button>
                </div>
              </div>
            )}

            {!subscription?.active && (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">
                  Upgrade to unlock premium features and support our mission
                </p>
                <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <a href="/pricing">View Plans</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Usage */}
        {usage.length > 0 && (
          <Card className="border-white/10 bg-[#14141E] mb-8">
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
              <CardDescription>
                Track your usage of premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usage.map((item, index) => (
                  <div key={index} className="bg-[#1E1E2D] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {item.feature.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-white/60">
                        {item.usage_count} / {item.usage_limit === -1 ? '∞' : item.usage_limit}
                      </span>
                    </div>
                    
                    {item.usage_limit !== -1 && (
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            getUsagePercentage(item.usage_count, item.usage_limit) > 80
                              ? 'bg-red-500'
                              : getUsagePercentage(item.usage_count, item.usage_limit) > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${getUsagePercentage(item.usage_count, item.usage_limit)}%`
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Resets: {formatDate(item.reset_date)}</span>
                      {item.usage_limit === -1 && (
                        <span className="text-green-400">Unlimited</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        <Card className="border-white/10 bg-[#14141E] mb-8">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your past payments and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-white/50">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Billing history will be available here once you have an active subscription.</p>
            </div>
          </CardContent>
        </Card>

        {/* Support & Help */}
        <Card className="border-white/10 bg-[#14141E]">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Get support with your subscription or billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1E1E2D] rounded-lg p-4">
                <h4 className="font-medium mb-2">Contact Support</h4>
                <p className="text-white/70 text-sm mb-3">
                  Get help with technical issues or billing questions
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/contact">Contact Us</a>
                </Button>
              </div>
              
              <div className="bg-[#1E1E2D] rounded-lg p-4">
                <h4 className="font-medium mb-2">FAQ</h4>
                <p className="text-white/70 text-sm mb-3">
                  Find answers to common subscription questions
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="/pricing">View FAQ</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
