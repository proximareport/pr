import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsletterUnsubscribe() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")?.[1] || "");
  const token = params.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  // Unsubscribe using token
  const { isLoading } = useQuery({
    queryKey: ["/api/newsletter/unsubscribe", token],
    enabled: !!token,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    onSuccess: (data: any) => {
      if (data.success) {
        setStatus("success");
        setMessage(data.message || "You have been successfully unsubscribed.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to unsubscribe. The token may be invalid or expired.");
      }
    },
    onError: () => {
      setStatus("error");
      setMessage("An error occurred while processing your unsubscribe request. Please try again later.");
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
          <CardTitle className="text-2xl">Newsletter Unsubscribe</CardTitle>
          <CardDescription>
            Managing your subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {isLoading || status === "loading" ? (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">Processing your request...</p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Unsubscribed Successfully</h3>
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                <p className="text-sm">
                  You have been unsubscribed from our newsletter. We're sorry to see you go! 
                  If you change your mind, you can subscribe again anytime.
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Unsubscribe Failed</h3>
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 text-red-800">
                <p className="text-sm">
                  We were unable to process your unsubscribe request. The link may have expired 
                  or is invalid. Please try clicking the unsubscribe link from the newsletter email again.
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            variant="default"
            onClick={() => window.location.href = "/"}
            disabled={isLoading || status === "loading"}
            className="w-full"
          >
            Return to Homepage
          </Button>
          
          {status === "success" && (
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="w-full"
            >
              Subscribe Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}