import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { X, Check, Plus, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tag = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

interface TagSelectorProps {
  selectedTags: number[];
  onChange: (selectedTags: number[]) => void;
  className?: string;
}

const TagSelector = ({ selectedTags, onChange, className }: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Fetch all available tags
  const { data: tags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['/api/tags'],
    staleTime: 60000,
  });

  // Filter function to find displayed tags
  const getSelectedTags = (): Tag[] => {
    if (!tags) return [];
    return tags.filter((tag: Tag) => selectedTags.includes(tag.id));
  };

  // Get tags that are not selected
  const getAvailableTags = (): Tag[] => {
    if (!tags) return [];
    return tags.filter((tag: Tag) => !selectedTags.includes(tag.id));
  };

  const handleSelectTag = (tagId: number) => {
    if (!selectedTags.includes(tagId)) {
      onChange([...selectedTags, tagId]);
    }
    setOpen(false);
    setInputValue('');
  };

  const handleRemoveTag = (tagId: number) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="tags" className="text-base font-medium">Tags</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-60" align="end">
            <Command>
              <CommandInput 
                placeholder="Search tags..." 
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                <CommandEmpty>
                  {inputValue.trim().length > 0 ? (
                    <div className="py-3 px-4 text-sm text-center space-y-2">
                      <p>No tags found</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full text-xs h-8"
                        onClick={() => {
                          // Here you could implement tag creation
                          // For now, we'll just close the popover
                          setOpen(false);
                        }}
                      >
                        Create "{inputValue}"
                      </Button>
                    </div>
                  ) : (
                    <p className="py-3 px-4 text-sm text-center">No tags available</p>
                  )}
                </CommandEmpty>
                <CommandGroup heading="Available Tags">
                  {getAvailableTags().map((tag: Tag) => (
                    <CommandItem 
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelectTag(tag.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{tag.name}</span>
                        <Check 
                          className={cn(
                            "h-4 w-4 opacity-0",
                            selectedTags.includes(tag.id) && "opacity-100"
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
        {isLoadingTags ? (
          <div className="flex justify-center items-center h-12">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : getSelectedTags().length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {getSelectedTags().map((tag: Tag) => (
              <Badge 
                key={tag.id} 
                variant="secondary"
                className="py-1 px-2 gap-1"
              >
                {tag.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground text-sm">
            <TagIcon className="h-5 w-5 mb-1 opacity-50" />
            <p>No tags selected</p>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Tags help readers find your content and improve discoverability
      </p>
    </div>
  );
};

export default TagSelector;