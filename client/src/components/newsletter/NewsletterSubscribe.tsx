import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type FormValues = z.infer<typeof schema>;

interface NewsletterSubscribeProps {
  compact?: boolean;
  className?: string;
}

export function NewsletterSubscribe({ compact = false, className = "" }: NewsletterSubscribeProps) {
  const { toast } = useToast();
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "error">("idle");
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/newsletter/subscribe", data);
    },
    onSuccess: (response) => {
      if (response.ok) {
        setSubscribeStatus("success");
        reset();
        toast({
          title: "Successfully subscribed!",
          description: "Please check your email to confirm your subscription.",
          variant: "default",
        });
      } else {
        response.json().then((data) => {
          setSubscribeStatus("error");
          toast({
            title: "Subscription failed",
            description: data.message || "There was an error subscribing to the newsletter.",
            variant: "destructive",
          });
        });
      }
    },
    onError: () => {
      setSubscribeStatus("error");
      toast({
        title: "Subscription failed",
        description: "There was an error subscribing to the newsletter. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setSubscribeStatus("idle");
    mutate(data);
  };

  if (compact) {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              className={`pr-8 ${errors.email ? 'border-red-500' : ''}`}
              disabled={isPending || subscribeStatus === "success"}
            />
            {errors.email && (
              <span className="text-xs text-red-500 absolute -bottom-5 left-0">
                {errors.email.message}
              </span>
            )}
          </div>
          <Button 
            type="submit" 
            size="sm"
            disabled={isPending || subscribeStatus === "success"}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : subscribeStatus === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-card p-6 shadow-sm ${className}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Subscribe to our Newsletter</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Get the latest space and STEM news delivered to your inbox. No spam, just the content you care about.
        </p>
        
        {subscribeStatus === "success" && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Please check your email to confirm your subscription.
            </AlertDescription>
          </Alert>
        )}
        
        {subscribeStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error subscribing to the newsletter. Please try again later.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email address"
              {...register("email")}
              className={errors.email ? 'border-red-500' : ''}
              disabled={isPending || subscribeStatus === "success"}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isPending || subscribeStatus === "success"}
          >
            {isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subscribing...
              </span>
            ) : subscribeStatus === "success" ? (
              <span className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-4 w-4" /> Subscribed!
              </span>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground">
          By subscribing, you agree to our <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a> and 
          to receive emails from us. You can unsubscribe at any time.
        </p>
      </div>
    </div>
  );
}