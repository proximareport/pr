import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Key, PlusCircle, Copy, Trash2, ArrowLeftIcon, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ApiKey {
  id: number;
  name: string;
  key: string; // Will be partially masked except at creation time
  permissions: string[];
  lastUsed: string | null;
  createdAt: string;
}

function ApiKeyManagement() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read:articles']);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  
  // Dialogs
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<number | null>(null);
  
  // Available permissions
  const availablePermissions = [
    { id: 'read:articles', label: 'Read Articles' },
    { id: 'read:astronomy', label: 'Read Astronomy Photos' },
    { id: 'read:launches', label: 'Read Launch Data' },
    { id: 'read:jobs', label: 'Read Job Listings' },
  ];
  
  // Queries
  const { 
    data: apiKeys = [], 
    isLoading: apiKeysLoading,
    isError: apiKeysError,
  } = useQuery({
    queryKey: ['/api/api-keys'],
  });
  
  // Mutations
  const createApiKey = useMutation({
    mutationFn: async (keyData: { name: string; permissions: string[] }) => {
      const response = await apiRequest('POST', '/api/api-keys', keyData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // The full API key is only returned once at creation
      setNewlyCreatedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: "API Key created",
        description: "Your new API key has been created. Make sure to copy it now - you won't be able to see it again!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    }
  });
  
  const deleteApiKey = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setDeleteConfirmOpen(false);
      setKeyToDelete(null);
      toast({
        title: "API Key deleted",
        description: "The API key has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    }
  });
  
  // Event handlers
  const handleCreateKey = () => {
    if (!newKeyName) {
      toast({
        title: "Required field",
        description: "API key name is required.",
        variant: "destructive",
      });
      return;
    }
    
    createApiKey.mutate({
      name: newKeyName,
      permissions: selectedPermissions,
    });
  };
  
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard.",
    });
  };
  
  const confirmDeleteKey = (id: number) => {
    setKeyToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteKey = () => {
    if (keyToDelete !== null) {
      deleteApiKey.mutate(keyToDelete);
    }
  };
  
  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Redirect if not admin or authenticated user
  useEffect(() => {
    if (user === null) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mr-2 p-0 h-auto"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">API Key Management</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              Create and manage API keys for external applications
            </CardDescription>
          </div>
          <Dialog 
            open={createKeyDialogOpen} 
            onOpenChange={(open) => {
              setCreateKeyDialogOpen(open);
              if (!open) {
                setNewKeyName('');
                setSelectedPermissions(['read:articles']);
                setNewlyCreatedKey(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  {newlyCreatedKey 
                    ? "Copy your API key now. You won't be able to see it again."
                    : "Give your API key a name and select permissions."}
                </DialogDescription>
              </DialogHeader>
              
              {newlyCreatedKey ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center p-2 border rounded-md bg-muted">
                    <code className="text-sm flex-1 break-all">{newlyCreatedKey}</code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleCopyKey(newlyCreatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">Make sure to copy your API key now. You won't be able to see it again.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">API Key Name</Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Mobile App Integration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {availablePermissions.map((permission) => (
                        <div 
                          key={permission.id} 
                          className="flex items-center space-x-2"
                        >
                          <Checkbox 
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={permission.id}
                            className="cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCreateKeyDialogOpen(false);
                    setNewlyCreatedKey(null);
                  }}
                >
                  {newlyCreatedKey ? 'Close' : 'Cancel'}
                </Button>
                {!newlyCreatedKey && (
                  <Button onClick={handleCreateKey}>
                    Create API Key
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {apiKeysLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : apiKeysError ? (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load API keys. Please try again.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(apiKeys as ApiKey[]).length > 0 ? (
                  (apiKeys as ApiKey[]).map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell className="font-mono text-xs">{apiKey.key}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                      <TableCell>{formatDate(apiKey.lastUsed)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No API keys found. Create your first API key to integrate with external applications.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/50 p-4 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <Key className="h-4 w-4 mt-0.5" />
            <div>
              <p>API keys provide secure access to the Proxima Report API for external applications.</p>
              <p className="mt-1">Keep your API keys secure - they have the same permissions as your account.</p>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ApiKeyManagement;