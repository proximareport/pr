import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RocketIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

function Register() {
  const [, navigate] = useLocation();
  const { register: registerUser, login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await registerUser({ 
        username, 
        email, 
        password
      });
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created. Welcome to Proxima Report!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "This email or username may already be in use. Please try another.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border border-white/10 bg-[#14141E]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <RocketIcon className="h-6 w-6 text-white transform -rotate-45" />
            </div>
          </div>
          <CardTitle className="text-2xl font-space font-bold">Create an account</CardTitle>
          <CardDescription>
            Join the Proxima Report community
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`bg-[#1E1E2D] border-white/10 ${errors.username ? "border-red-500" : ""}`}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`bg-[#1E1E2D] border-white/10 ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`bg-[#1E1E2D] border-white/10 ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`bg-[#1E1E2D] border-white/10 ${errors.confirmPassword ? "border-red-500" : ""}`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            
            <div className="text-xs text-white/60">
              By registering, you agree to our{" "}
              <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>.
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full bg-purple-800 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
            <p className="mt-4 text-center text-sm text-white/60">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Register;
