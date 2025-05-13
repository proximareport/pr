import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CategoryManagement from './CategoryManagement';
import TagManagement from './TagManagement';

export default function TaxonomyTab() {
  // Get active tab from localStorage or default to 'categories'
  const [activeTab, setActiveTab] = useState('categories');
  
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
      
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 border-b border-gray-700 w-full justify-start bg-transparent p-0">
          <TabsTrigger 
            value="categories" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none px-4 py-2"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="tags" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 rounded-none px-4 py-2"
          >
            Tags
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="mt-0">
          <CategoryManagement />
        </TabsContent>
        
        <TabsContent value="tags" className="mt-0">
          <TagManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}