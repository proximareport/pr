import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  PencilIcon,
  UserIcon,
  ShieldIcon,
  CheckIcon,
  MoreHorizontalIcon,
  StarIcon,
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  membershipTier: string;
  profilePicture?: string;
  createdAt: string;
  lastLoginAt?: string;
  hasStripeAccount: boolean;
}

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedMembership, setSelectedMembership] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch users with admin flag for detailed info
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users', { admin: true }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?admin=true');
      return await response.json();
    },
    enabled: true,
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      setIsRoleDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  // Update membership tier mutation
  const updateMembershipMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: number; tier: string }) => {
      return await apiRequest('PATCH', `/api/users/${userId}/membership`, { tier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User membership updated successfully',
      });
      setIsMembershipDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update user membership',
        variant: 'destructive',
      });
    },
  });

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const openMembershipDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedMembership(user.membershipTier);
    setIsMembershipDialogOpen(true);
  };

  const handleRoleUpdate = () => {
    if (selectedUser && selectedRole) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };

  const handleMembershipUpdate = () => {
    if (selectedUser && selectedMembership) {
      updateMembershipMutation.mutate({
        userId: selectedUser.id,
        tier: selectedMembership,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>;
      case 'editor':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Editor</Badge>;
      case 'author':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Author</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">User</Badge>;
    }
  };

  const getMembershipBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pro</Badge>;
      case 'supporter':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Supporter</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Free</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter users based on search query
  const filteredUsers = searchQuery 
    ? users.filter((user: User) => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Input
            type="search"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal text-xs">
            {filteredUsers.length} users
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No users found</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Membership</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                    <span>{user.username}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getMembershipBadge(user.membershipTier)}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                        <ShieldIcon className="mr-2 h-4 w-4" />
                        Change role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openMembershipDialog(user)}>
                        <StarIcon className="mr-2 h-4 w-4" />
                        Change membership
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* User Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for <span className="font-medium">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup
              value={selectedRole}
              onValueChange={setSelectedRole}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user-role" />
                <Label htmlFor="user-role" className="flex items-center">
                  <Badge className="ml-2 bg-gray-100 text-gray-800 border-gray-200">User</Badge>
                  <span className="ml-2">Basic access</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="author" id="author-role" />
                <Label htmlFor="author-role" className="flex items-center">
                  <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">Author</Badge>
                  <span className="ml-2">Can create and edit own content</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="editor" id="editor-role" />
                <Label htmlFor="editor-role" className="flex items-center">
                  <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">Editor</Badge>
                  <span className="ml-2">Can manage all content</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin-role" />
                <Label htmlFor="admin-role" className="flex items-center">
                  <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">Admin</Badge>
                  <span className="ml-2">Full access to the platform</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleUpdate}
              disabled={updateRoleMutation.isPending || selectedRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Membership Dialog */}
      <Dialog open={isMembershipDialogOpen} onOpenChange={setIsMembershipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Membership Tier</DialogTitle>
            <DialogDescription>
              Update membership for <span className="font-medium">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup
              value={selectedMembership}
              onValueChange={setSelectedMembership}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free-tier" />
                <Label htmlFor="free-tier" className="flex items-center">
                  <Badge className="ml-2 bg-gray-100 text-gray-800 border-gray-200">Free</Badge>
                  <span className="ml-2">Basic features</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supporter" id="supporter-tier" />
                <Label htmlFor="supporter-tier" className="flex items-center">
                  <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">Supporter</Badge>
                  <span className="ml-2">$2/month - Enhanced features</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id="pro-tier" />
                <Label htmlFor="pro-tier" className="flex items-center">
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Pro</Badge>
                  <span className="ml-2">$4/month - All features</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembershipDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMembershipUpdate}
              disabled={updateMembershipMutation.isPending || selectedMembership === selectedUser?.membershipTier}
            >
              {updateMembershipMutation.isPending ? 'Updating...' : 'Update Membership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}