import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  X, 
  Check, 
  Plus, 
  Tag as TagIcon, 
  FolderTree 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export type TaxonomyItem = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'tag' | 'category';
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
};

interface TaxonomySelectorProps {
  selectedTaxonomyIds: number[];
  onChange: (selectedIds: number[]) => void;
  className?: string;
  type?: 'tag' | 'category' | undefined; // If you want to filter by type
  title?: string; // Custom title instead of "Tags" or "Categories"
  helpText?: string; // Custom helper text
  addButtonText?: string; // Custom "Add" button text
  emptyText?: string; // Custom "No items selected" text
  canCreate?: boolean; // Whether users can create new items
  onCreate?: (name: string, type: 'tag' | 'category') => Promise<void>;
}

const TaxonomySelector = ({ 
  selectedTaxonomyIds, 
  onChange, 
  className,
  type,
  title = type === 'category' ? 'Categories' : 'Tags',
  helpText = type === 'category' 
    ? 'Categories help organize your content into sections' 
    : 'Tags help readers find your content and improve discoverability',
  addButtonText = `Add ${type === 'category' ? 'Category' : 'Tag'}`,
  emptyText = `No ${type === 'category' ? 'categories' : 'tags'} selected`,
  canCreate = false,
  onCreate
}: TaxonomySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all available taxonomy items
  const { data: taxonomyItems = [], isLoading } = useQuery<TaxonomyItem[]>({
    queryKey: ['/api/taxonomy', { type }],
    staleTime: 60000,
  });

  // Filter function to find displayed items
  const getSelectedItems = (): TaxonomyItem[] => {
    return taxonomyItems.filter((item: TaxonomyItem) => selectedTaxonomyIds.includes(item.id));
  };

  // Get items that are not selected
  const getAvailableItems = (): TaxonomyItem[] => {
    return taxonomyItems
      .filter((item: TaxonomyItem) => !selectedTaxonomyIds.includes(item.id))
      // If type is specified, filter by type
      .filter((item: TaxonomyItem) => !type || item.type === type);
  };

  const handleSelectItem = (itemId: number) => {
    if (!selectedTaxonomyIds.includes(itemId)) {
      onChange([...selectedTaxonomyIds, itemId]);
    }
    setOpen(false);
    setInputValue('');
  };

  const handleRemoveItem = (itemId: number) => {
    onChange(selectedTaxonomyIds.filter(id => id !== itemId));
  };

  const handleCreateItem = async () => {
    if (!inputValue.trim() || !canCreate || !onCreate) return;

    try {
      setIsCreating(true);
      
      // Call the onCreate handler
      await onCreate(inputValue.trim(), type || 'tag');
      
      // Close the popover and reset input
      setOpen(false);
      setInputValue('');
    } catch (error) {
      console.error('Error creating taxonomy item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Default implementation if onCreate is not provided
  const defaultCreateItem = async (name: string, itemType: 'tag' | 'category') => {
    try {
      setIsCreating(true);
      
      const response = await apiRequest('POST', '/api/taxonomy', {
        name,
        type: itemType,
        // Generate a slug from the name
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      });
      
      if (response.ok) {
        const newItem = await response.json();
        
        // Add the new item to the selected list
        onChange([...selectedTaxonomyIds, newItem.id]);
      } else {
        console.error('Failed to create taxonomy item');
      }
      
      // Close the popover and reset input
      setOpen(false);
      setInputValue('');
    } catch (error) {
      console.error('Error creating taxonomy item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="taxonomy" className="text-base font-medium">{title}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {addButtonText}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-60" align="end">
            <Command>
              <CommandInput 
                placeholder={`Search ${type === 'category' ? 'categories' : 'tags'}...`}
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                <CommandEmpty>
                  {inputValue.trim().length > 0 && canCreate ? (
                    <div className="py-3 px-4 text-sm text-center space-y-2">
                      <p>No {type === 'category' ? 'categories' : 'tags'} found</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs h-8"
                        disabled={isCreating}
                        onClick={() => (onCreate || defaultCreateItem)(inputValue.trim(), type || 'tag')}
                      >
                        {isCreating ? (
                          <>
                            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                            Creating...
                          </>
                        ) : (
                          <>Create "{inputValue}"</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="py-3 px-4 text-sm text-center">
                      No {type === 'category' ? 'categories' : 'tags'} available
                    </p>
                  )}
                </CommandEmpty>
                <CommandGroup heading={type === 'category' ? 'Available Categories' : 'Available Tags'}>
                  {getAvailableItems().map((item: TaxonomyItem) => (
                    <CommandItem 
                      key={item.id}
                      value={item.name}
                      onSelect={() => handleSelectItem(item.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">
                          {item.type === 'category' && <FolderTree className="h-3.5 w-3.5 opacity-70" />}
                          {item.type === 'tag' && <TagIcon className="h-3.5 w-3.5 opacity-70" />}
                          <span>{item.name}</span>
                        </div>
                        <Check 
                          className={cn(
                            "h-4 w-4 opacity-0",
                            selectedTaxonomyIds.includes(item.id) && "opacity-100"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="border rounded-md p-2 min-h-[80px] bg-background">
        {isLoading ? (
          <div className="flex justify-center items-center h-12">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : getSelectedItems().length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {getSelectedItems().map((item: TaxonomyItem) => (
              <Badge 
                key={item.id} 
                variant={item.type === 'category' ? 'outline' : 'secondary'}
                className="py-1 px-2 gap-1"
              >
                <span className="flex items-center gap-1">
                  {item.type === 'category' && <FolderTree className="h-3 w-3 opacity-70" />}
                  {item.type === 'tag' && <TagIcon className="h-3 w-3 opacity-70" />}
                  {item.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground text-sm">
            {type === 'category' ? (
              <FolderTree className="h-5 w-5 mb-1 opacity-50" />
            ) : (
              <TagIcon className="h-5 w-5 mb-1 opacity-50" />
            )}
            <p>{emptyText}</p>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {helpText}
      </p>
    </div>
  );
};

export default TaxonomySelector;