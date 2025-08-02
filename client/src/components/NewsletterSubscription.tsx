import React, { useState } from 'react';
import { MailIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsletterSubscriptionProps {
  className?: string;
  variant?: 'default' | 'compact' | 'article';
}

export default function NewsletterSubscription({ 
  className = '', 
  variant = 'default' 
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setEmail('');
        toast({
          title: "Successfully subscribed!",
          description: "You'll now receive our latest space news and updates.",
        });
      } else {
        throw new Error(data.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setEmail('');
  };

  if (isSuccess && variant === 'article') {
    return (
      <div className={`bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Successfully Subscribed!</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Thank you for subscribing to our newsletter! You'll receive our latest space news, 
          launch updates, and exclusive content directly to your inbox.
        </p>
        <button
          onClick={resetForm}
          className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <MailIcon className="h-5 w-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Stay Updated</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
      </div>
    );
  }

  if (variant === 'article') {
    return (
      <div className={`bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <MailIcon className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Subscribe to Our Newsletter</h3>
        </div>
        <p className="text-gray-300 mb-6">
          Get the latest space news, rocket launches, and astronomical discoveries delivered directly to your inbox. 
          Join thousands of space enthusiasts who stay updated with Proxima Report.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newsletter-email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 disabled:from-purple-600/50 disabled:to-violet-700/50 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <MailIcon className="h-5 w-5" />
                Subscribe to Newsletter
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          We respect your privacy. Unsubscribe at any time. No spam, ever.
        </p>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-xl p-8 ${className}`}>
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-700 rounded-full flex items-center justify-center">
            <MailIcon className="h-6 w-6 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Stay Connected</h3>
        <p className="text-gray-300">
          Get the latest space news, rocket launches, and astronomical discoveries delivered to your inbox.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newsletter-email-default" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="newsletter-email-default"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 disabled:from-purple-600/50 disabled:to-violet-700/50 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Subscribing...
            </>
          ) : (
            <>
              <MailIcon className="h-5 w-5" />
              Subscribe to Newsletter
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          Join thousands of space enthusiasts. No spam, unsubscribe anytime.
        </p>
      </div>
    </div>
  );
} 