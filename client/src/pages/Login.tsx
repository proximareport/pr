import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RocketIcon, Loader2, EyeIcon, EyeOffIcon, MailIcon, UserIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import ModernButton from "@/components/ui/modern-button";

function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginMethod, setLoginMethod] = useState<"email" | "username">("email");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (loginMethod === "email") {
      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Email is invalid";
      }
    } else {
      if (!username.trim()) {
        newErrors.username = "Username is required";
      }
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Create credentials based on login method
      const credentials = loginMethod === "email" 
        ? { email, password } 
        : { username, password };
      
      await login(credentials);
      
      // If there's a redirect URL in the query string, go there. Otherwise go to homepage.
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect") || "/";
      navigate(redirectUrl);
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/60 to-black flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Enhanced dark purple background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-900/20 via-violet-900/20 to-purple-800/20"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-700/20 to-pink-700/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-violet-600/15 to-purple-600/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-purple-900/40 bg-gray-950/80 backdrop-blur-2xl shadow-2xl shadow-purple-500/10 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-violet-900/10"></div>
          
          <CardHeader className="relative space-y-1 text-center pt-8 pb-2">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <RocketIcon className="h-10 w-10 text-white transform -rotate-45" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl opacity-30 blur-sm"></div>
                <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 opacity-20 animate-ping"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white tracking-tight">
              Welcome <span className="text-purple-400">Back</span>
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Sign in to continue your space journey
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="email" onValueChange={(v) => setLoginMethod(v as "email" | "username")} className="relative">
            <div className="px-6 mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-gray-800/50 rounded-xl">
                <TabsTrigger 
                  value="email" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-700 data-[state=active]:text-white text-gray-400 rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <MailIcon className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="username" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-700 data-[state=active]:text-white text-gray-400 rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Username</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 px-6">
                <TabsContent value="email" className="space-y-4 m-0">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your-email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-4 ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                        <span>⚠️</span><span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="username" className="space-y-4 m-0">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-300 font-medium">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-4 ${errors.username ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                        <span>⚠️</span><span>{errors.username}</span>
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`bg-gray-900/50 border-gray-800/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 rounded-xl h-12 pl-4 pr-12 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                      <span>⚠️</span><span>{errors.password}</span>
                    </p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col px-6 pb-8 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <RocketIcon className="h-5 w-5 transform -rotate-45" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
                
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-purple-400 hover:text-purple-300 transition-colors duration-300 font-semibold">
                      Create one now
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          </Tabs>
        </Card>
        
        {/* Additional decorative elements */}
        <div className="absolute -z-10 top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-600/10 to-violet-600/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default Login;
