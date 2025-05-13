import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CategoryManagement from './CategoryManagement';
import TagManagement from './TagManagement';
import TaxonomyManagement from './TaxonomyManagement';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

export default function TaxonomyTab() {
  // Get active tab from localStorage or default to 'unified'
  const [activeTab, setActiveTab] = useState('unified');
  
  useEffect(() => {
    const storedTab = localStorage.getItem('adminTaxonomyTab');
    if (storedTab) {
      setActiveTab(storedTab);
    }
  }, []);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('adminTaxonomyTab', value);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Content Taxonomy</h1>
      </div>
      
      <Alert className="mb-6 border-amber-500/20 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Taxonomy System Update</AlertTitle>
        <AlertDescription className="text-amber-200">
          We've unified categories and tags into a single taxonomy system. The legacy management 
          tabs are still available, but we recommend using the new Unified System for all 
          taxonomy management going forward.
        </AlertDescription>
      </Alert>
      
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 border-b border-gray-700 w-full justify-start bg-transparent p-0">
          <TabsTrigger 
            value="unified" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none px-4 py-2"
          >
            Unified System
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none px-4 py-2 opacity-70"
          >
            Legacy Categories
          </TabsTrigger>
          <TabsTrigger 
            value="tags" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none px-4 py-2 opacity-70"
          >
            Legacy Tags
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="unified" className="mt-0">
          <TaxonomyManagement />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-0">
          <Alert className="mb-6 border-blue-500/20 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">Legacy Management</AlertTitle>
            <AlertDescription className="text-blue-200">
              This is the legacy category management interface. For better organization and features, 
              we recommend using the Unified System tab.
            </AlertDescription>
          </Alert>
          <CategoryManagement />
        </TabsContent>
        
        <TabsContent value="tags" className="mt-0">
          <Alert className="mb-6 border-blue-500/20 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">Legacy Management</AlertTitle>
            <AlertDescription className="text-blue-200">
              This is the legacy tag management interface. For better organization and features, 
              we recommend using the Unified System tab.
            </AlertDescription>
          </Alert>
          <TagManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}