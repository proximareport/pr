import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function AdvertiseSuccess() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Advertisement Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Thank you for submitting your advertisement. Our team will review your submission and 
              get back to you within 1-2 business days.
            </p>
            
            <p className="text-gray-600">
              If you have any questions or need to make changes to your submission, 
              please contact our advertising team at ads@proximareport.com.
            </p>
            
            <div className="flex justify-center gap-4 pt-2">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/advertise">Submit Another Ad</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}