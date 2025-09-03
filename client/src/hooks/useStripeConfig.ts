import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface StripePriceIds {
  tier1: {
    monthly: string;
    yearly: string;
  };
  tier2: {
    monthly: string;
    yearly: string;
  };
  tier3: {
    monthly: string;
    yearly: string;
  };
  publishableKey: string;
}

export function useStripeConfig() {
  return useQuery<StripePriceIds>({
    queryKey: ['stripe-config'],
    queryFn: async () => {
      // Try the new endpoint first
      try {
        const response = await apiRequest('GET', '/api/stripe/price-ids');
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.log('New endpoint not available, falling back to environment variables');
      }
      
      // Fallback to environment variables if new endpoint is not available
      const config: StripePriceIds = {
        tier1: {
          monthly: import.meta.env.VITE_STRIPE_TIER1_PRICE_ID || '',
          yearly: import.meta.env.VITE_STRIPE_TIER1_YEARLY_PRICE_ID || ''
        },
        tier2: {
          monthly: import.meta.env.VITE_STRIPE_TIER2_PRICE_ID || '',
          yearly: import.meta.env.VITE_STRIPE_TIER2_YEARLY_PRICE_ID || ''
        },
        tier3: {
          monthly: import.meta.env.VITE_STRIPE_TIER3_PRICE_ID || '',
          yearly: import.meta.env.VITE_STRIPE_TIER3_YEARLY_PRICE_ID || ''
        },
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
      };
      
      // Check if any price IDs are configured
      const hasAnyPriceIds = Object.values(config).some(tier => 
        tier.monthly || tier.yearly
      );
      
      if (!hasAnyPriceIds) {
        throw new Error('No Stripe price IDs configured. Please set up your Stripe environment variables.');
      }
      
      return config;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3,
  });
}
