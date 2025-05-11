import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, CreditCard } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function AdvertiseSuccess() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const adId = params.get('ad_id');
  const paymentId = params.get('payment_id');
  const isPaymentSuccess = !!paymentId;
  
  // Invalidate advertisements query to refresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/advertisements/user'] });
  }, [queryClient]);
  
  // Redirect to dashboard after a delay if coming from payment
  useEffect(() => {
    if (isPaymentSuccess) {
      const timer = setTimeout(() => {
        setLocation('/advertiser-dashboard');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isPaymentSuccess, setLocation]);
  
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-2">
              {isPaymentSuccess ? (
                <CreditCard className="h-16 w-16 text-green-500" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isPaymentSuccess ? 'Payment Successful!' : 'Advertisement Submitted!'}
            </CardTitle>
            {isPaymentSuccess && (
              <CardDescription>
                Payment ID: {paymentId}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isPaymentSuccess ? (
              <>
                <p className="text-gray-600">
                  Your payment has been processed successfully. Your advertisement is now active and will be displayed according to your selected preferences.
                </p>
                <p className="text-gray-600">
                  You will be redirected to your advertiser dashboard in a few seconds where you can track the performance of your advertisement.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Thank you for submitting your advertisement. Our team will review your submission and 
                  get back to you within 1-2 business days.
                </p>
                <p className="text-gray-600">
                  If you have any questions or need to make changes to your submission, 
                  please contact our advertising team at ads@proximareport.com.
                </p>
              </>
            )}
            
            <div className="flex justify-center gap-4 pt-2">
              <Button asChild>
                <Link href="/advertiser-dashboard">Go to Dashboard</Link>
              </Button>
              {!isPaymentSuccess && (
                <Button variant="outline" asChild>
                  <Link href="/advertise">Submit Another Ad</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}