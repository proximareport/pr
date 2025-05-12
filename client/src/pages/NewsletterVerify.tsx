import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsletterVerify() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")?.[1] || "");
  const token = params.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  // Verify token
  const { isLoading } = useQuery({
    queryKey: ["/api/newsletter/verify", token],
    enabled: !!token,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const response = await fetch(`/api/newsletter/verify/${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Your subscription has been verified!");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify your subscription. The token may be invalid or expired.");
        }
        
        return data;
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your subscription. Please try again later.");
        throw error;
      }
    }
  });

  // Redirect to home if there's no token
  useEffect(() => {
    if (!token) {
      window.location.href = "/";
    }
  }, [token]);

  if (!token) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Newsletter Subscription</CardTitle>
          <CardDescription>
            Verification Status
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {isLoading || status === "loading" ? (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">Verifying your subscription...</p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Success!</h3>
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 text-green-800">
                <p className="text-sm">
                  Your email has been confirmed and you are now subscribed to our newsletter.
                  Get ready to receive the latest space and STEM news straight to your inbox!
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Verification Failed</h3>
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 text-red-800">
                <p className="text-sm">
                  We were unable to verify your subscription. The verification link may have expired 
                  or is invalid. Please try subscribing again.
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="default"
            onClick={() => window.location.href = "/"}
            disabled={isLoading || status === "loading"}
          >
            Return to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}