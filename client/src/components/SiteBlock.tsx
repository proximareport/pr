import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LockIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon, MailIcon } from 'lucide-react';
import { useLocation } from 'wouter';

interface SiteBlockProps {
  siteBlock: {
    title: string;
    subtitle: string;
    message: string;
    backgroundImageUrl?: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    showLoginForm: boolean;
    loginFormTitle: string;
    loginFormSubtitle: string;
    customCss?: string;
  };
}

export default function SiteBlock({ siteBlock }: SiteBlockProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, refetch } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({ email, password });
      
      // Force refresh auth status to ensure isAdmin is updated
      await refetch();
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate('/admin');
      }, 100);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: siteBlock.backgroundImageUrl 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${siteBlock.backgroundImageUrl})`
          : `linear-gradient(135deg, ${siteBlock.secondaryColor} 0%, ${siteBlock.primaryColor} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        {siteBlock.logoUrl && (
          <div className="text-center mb-8">
            <img 
              src={siteBlock.logoUrl} 
              alt="Site Logo" 
              className="h-16 mx-auto mb-4"
            />
          </div>
        )}

        {/* Main Content */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: siteBlock.primaryColor }}
              >
                <LockIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {siteBlock.title}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {siteBlock.subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Message */}
            <div className="text-center">
              <p className="text-gray-700 leading-relaxed">
                {siteBlock.message}
              </p>
            </div>

            {/* Admin Login Form */}
            {siteBlock.showLoginForm && (
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {siteBlock.loginFormTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {siteBlock.loginFormSubtitle}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MailIcon className="h-4 w-4" />
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        className={`w-full ${email.includes('@') ? 'border-green-500' : ''}`}
                        autoComplete="email"
                      />
                      {email.includes('@') && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MailIcon className="h-3 w-3" />
                      Enter your full email address including the @ symbol
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    style={{ backgroundColor: siteBlock.primaryColor }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm">
            © {new Date().getFullYear()} Proxima Report. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom CSS */}
      {siteBlock.customCss && (
        <style dangerouslySetInnerHTML={{ __html: siteBlock.customCss }} />
      )}
    </div>
  );
}
