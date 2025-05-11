import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CheckCircle } from 'lucide-react';

function AdvertiseSuccess() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto text-center mt-12">
          <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto mb-4">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Advertisement Submitted</h1>
          <p className="text-gray-600 mb-8">
            Thank you for your advertisement submission. Our team will review your request shortly.
            You will receive a notification when your advertisement is approved.
          </p>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-left">
              <h3 className="font-medium text-blue-800">What happens next?</h3>
              <ol className="mt-2 text-sm text-blue-700 list-decimal pl-5 space-y-1">
                <li>Our team will review your advertisement within 1-2 business days</li>
                <li>Once approved, your ad will run during the selected dates</li>
                <li>You can track performance metrics in your account dashboard</li>
              </ol>
            </div>
            <div className="flex space-x-4 justify-center">
              <Link href="/advertise">
                <Button variant="outline">Submit Another Ad</Button>
              </Link>
              <Link href="/">
                <Button>Return Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdvertiseSuccess;