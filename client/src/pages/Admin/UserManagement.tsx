import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeftIcon, 
  SearchIcon, 
  UserIcon, 
  ShieldIcon, 
  MoreHorizontalIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  BanIcon,
  CrownIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function UserManagement() {
  const { user: currentUser, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterMembership, setFilterMembership] = useState('all');
  
  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then(res => res.json()),
  });
  
  // User role update mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number, role: string }) => 
      apiRequest('PATCH', `/api/users/${userId}/role`, { role }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User role updated",
        description: "The user role has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user role",
        description: error.message || "There was an error updating the user role.",
        variant: "destructive",
      });
    }
  });
  
  // User ban mutation
  const toggleUserBanMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: number, banned: boolean }) => 
      apiRequest('PATCH', `/api/users/${userId}/ban`, { banned }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User ban status updated",
        description: "The user ban status has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user ban status",
        description: error.message || "There was an error updating the user ban status.",
        variant: "destructive",
      });
    }
  });
  
  // Filter and search users
  const filteredUsers = users?.filter((user: any) => {
    let matchesSearch = true;
    let matchesRole = true;
    let matchesMembership = true;
    
    if (searchQuery) {
      matchesSearch = 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (filterRole !== 'all') {
      matchesRole = user.role === filterRole;
    }
    
    if (filterMembership !== 'all') {
      matchesMembership = user.membershipTier === filterMembership;
    }
    
    return matchesSearch && matchesRole && matchesMembership;
  }) || [];
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage registered users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterMembership} onValueChange={setFilterMembership}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by membership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Memberships</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="supporter">Supporter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {user.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <Badge variant="destructive" className="flex w-fit items-center gap-1">
                            <BanIcon className="h-3 w-3" />
                            Banned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex w-fit items-center gap-1 bg-green-50 text-green-600 border-green-200">
                            <CheckCircleIcon className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="secondary" className="flex w-fit items-center gap-1">
                            <ShieldIcon className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-sm">User</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.membershipTier === 'pro' ? (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex w-fit items-center gap-1">
                            <CrownIcon className="h-3 w-3" />
                            Pro
                          </Badge>
                        ) : user.membershipTier === 'supporter' ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex w-fit items-center gap-1">
                            Supporter
                          </Badge>
                        ) : (
                          <span className="text-sm">Free</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(user.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/profile/${user.username}`)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            {user.id !== currentUser?.id && (
                              <>
                                {user.role === 'admin' ? (
                                  <DropdownMenuItem 
                                    onClick={() => updateUserRoleMutation.mutate({ userId: user.id, role: 'user' })}
                                  >
                                    Remove Admin Status
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => updateUserRoleMutation.mutate({ userId: user.id, role: 'admin' })}
                                  >
                                    Make Admin
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                {user.banned ? (
                                  <DropdownMenuItem 
                                    onClick={() => toggleUserBanMutation.mutate({ userId: user.id, banned: false })}
                                  >
                                    <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Unban User</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => toggleUserBanMutation.mutate({ userId: user.id, banned: true })}
                                    className="text-red-600"
                                  >
                                    <BanIcon className="mr-2 h-4 w-4" />
                                    <span>Ban User</span>
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserManagement;