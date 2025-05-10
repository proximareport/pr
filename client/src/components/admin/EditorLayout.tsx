import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { useLocation } from 'wouter';

export interface EditorLayoutProps {
  title: string;
  subtitle?: string;
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  isLoading?: boolean;
}

export function EditorLayout({ title, subtitle, mainContent, sidebarContent, isLoading = false }: EditorLayoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="container max-w-7xl mx-auto py-10">
      <div className="flex flex-col mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 hover:bg-white/10"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        </div>
        {subtitle && <p className="text-white/60 pl-12">{subtitle}</p>}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-60">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {mainContent}
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            {sidebarContent}
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorMainCard({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string | React.ReactNode; 
  children: React.ReactNode 
}) {
  return (
    <Card className="mb-8 border-white/10 bg-[#14141E] shadow-lg">
      <CardHeader className="border-b border-white/10 bg-[#1E1E2D]">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {children}
      </CardContent>
    </Card>
  );
}

export function EditorSideCard({ 
  title, 
  description, 
  children,
  footer
}: { 
  title: string; 
  description?: string | React.ReactNode; 
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#14141E] shadow-lg mb-6">
      <CardHeader className="border-b border-white/10 bg-[#1E1E2D]">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6 p-6 max-h-[60vh] overflow-y-auto">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex flex-col space-y-3 border-t border-white/10 bg-[#1A1A27] p-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}