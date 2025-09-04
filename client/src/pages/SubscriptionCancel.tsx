import { Link } from "wouter";
import { XCircleIcon, HomeIcon, CreditCardIcon, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-red-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Subscription Cancelled
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your subscription process was cancelled. No charges have been made.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Don't worry - you can always come back and subscribe later!</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                asChild 
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Link href="/pricing">
                  <CreditCardIcon className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                className="w-full"
              >
                <Link href="/">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact our support team for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
