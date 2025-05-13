import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, FolderTree, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Type for taxonomy items
type TaxonomyItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: 'tag' | 'category';
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
};

// Schema for creating/editing taxonomy items
const taxonomyFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['tag', 'category']),
  parentId: z.number().nullable().optional(),
});

type TaxonomyFormValues = z.infer<typeof taxonomyFormSchema>;

const TaxonomyManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'all' | 'tag' | 'category'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, item: TaxonomyItem | null }>({
    open: false,
    item: null
  });

  // Load taxonomy items
  const { data: taxonomyItems = [], isLoading } = useQuery({
    queryKey: ['/api/taxonomy'],
    staleTime: 10000,
  });

  // Form for creating/editing taxonomy items
  const form = useForm<TaxonomyFormValues>({
    resolver: zodResolver(taxonomyFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      type: 'tag',
      parentId: null,
    },
  });

  // Reset form when editing item changes
  useEffect(() => {
    if (editingItem) {
      form.reset({
        name: editingItem.name,
        slug: editingItem.slug,
        description: editingItem.description || '',
        type: editingItem.type,
        parentId: editingItem.parentId,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        type: 'tag',
        parentId: null,
      });
    }
  }, [editingItem, form]);

  // Filter taxonomy items based on selected tab
  const filteredItems = taxonomyItems.filter((item: TaxonomyItem) => {
    if (selectedTab === 'all') return true;
    return item.type === selectedTab;
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaxonomyFormValues) => {
      const response = await apiRequest('POST', '/api/taxonomy', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create taxonomy item');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Taxonomy item created successfully',
      });
      // Invalidate taxonomy query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/taxonomy'] });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TaxonomyFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PATCH', `/api/taxonomy/${id}`, updateData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update taxonomy item');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Taxonomy item updated successfully',
      });
      // Invalidate taxonomy query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/taxonomy'] });
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/taxonomy/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete taxonomy item');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Taxonomy item deleted successfully',
      });
      // Invalidate taxonomy query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/taxonomy'] });
      setDeleteDialog({ open: false, item: null });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: TaxonomyFormValues) => {
    if (editingItem) {
      updateMutation.mutate({ ...values, id: editingItem.id });
    } else {
      createMutation.mutate(values);
    }
  };

  // Delete handler
  const handleDelete = () => {
    if (deleteDialog.item) {
      deleteMutation.mutate(deleteDialog.item.id);
    }
  };

  // Generate a slug from the name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Taxonomy Management</h1>
          <p className="text-muted-foreground">
            Manage your site's tags and categories in one place
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingItem(null);
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      <Tabs 
        defaultValue="all" 
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as 'all' | 'tag' | 'category')}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="tag">Tags</TabsTrigger>
            <TabsTrigger value="category">Categories</TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <TaxonomyTable 
            items={filteredItems} 
            isLoading={isLoading}
            onEdit={setEditingItem}
            onDelete={(item) => setDeleteDialog({ open: true, item })}
          />
        </TabsContent>
        
        <TabsContent value="tag" className="mt-4">
          <TaxonomyTable 
            items={filteredItems} 
            isLoading={isLoading}
            onEdit={setEditingItem}
            onDelete={(item) => setDeleteDialog({ open: true, item })}
          />
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          <TaxonomyTable 
            items={filteredItems} 
            isLoading={isLoading}
            onEdit={setEditingItem}
            onDelete={(item) => setDeleteDialog({ open: true, item })}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Taxonomy Item' : 'Create New Taxonomy Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? 'Update the details of this taxonomy item' 
                : 'Add a new tag or category to organize your content'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!editingItem} // Prevent changing type if editing
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tag">Tag</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === 'tag' 
                        ? 'Tags are used for detailed content classification' 
                        : 'Categories organize content into broader sections'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Enter ${form.watch('type')} name`} 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-generate slug if not editing
                          if (!editingItem && !form.getValues('slug')) {
                            form.setValue('slug', generateSlug(e.target.value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter URL slug" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Used in URLs. Will be auto-generated if left empty.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`Describe this ${form.watch('type')}`} 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  )}
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, item: null });
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {deleteDialog.item && (
                <>
                  Are you sure you want to delete the {deleteDialog.item.type} 
                  <strong> "{deleteDialog.item.name}"</strong>?
                  <br />
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, item: null })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TaxonomyTableProps {
  items: TaxonomyItem[];
  isLoading: boolean;
  onEdit: (item: TaxonomyItem) => void;
  onDelete: (item: TaxonomyItem) => void;
}

const TaxonomyTable = ({ items, isLoading, onEdit, onDelete }: TaxonomyTableProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-3">
              {items.length === 0 ? (
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              ) : (
                <>
                  <Tag className="h-6 w-6 text-muted-foreground" />
                  <FolderTree className="h-6 w-6 text-muted-foreground" />
                </>
              )}
            </div>
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start by creating a new tag or category
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort items by type and then by name
  const sortedItems = [...items].sort((a, b) => {
    // First sort by type (categories first)
    if (a.type !== b.type) {
      return a.type === 'category' ? -1 : 1;
    }
    // Then sort by name
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge 
                    variant={item.type === 'category' ? 'outline' : 'secondary'}
                    className="capitalize"
                  >
                    {item.type === 'category' ? (
                      <FolderTree className="h-3 w-3 mr-1 inline" />
                    ) : (
                      <Tag className="h-3 w-3 mr-1 inline" />
                    )}
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {item.description || <span className="text-muted-foreground italic">No description</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TaxonomyManagement;