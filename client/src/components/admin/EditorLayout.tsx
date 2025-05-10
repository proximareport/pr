import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { useLocation } from 'wouter';

interface EditorLayoutProps {
  title: string;
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
}

export function EditorLayout({ title, mainContent, sidebarContent }: EditorLayoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="container max-w-7xl mx-auto py-10">
      <div className="flex items-center mb-8 border-b border-white/10 pb-4">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {mainContent}
        </div>
        
        <div className="lg:col-span-4">
          {sidebarContent}
        </div>
      </div>
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
    <Card className="border-white/10 bg-[#14141E] shadow-lg sticky top-6">
      <CardHeader className="border-b border-white/10 bg-[#1E1E2D]">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
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