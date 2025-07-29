import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon, 
  UsersIcon,
  StarIcon,
  MoveUpIcon,
  MoveDownIcon,
  SearchIcon,
  ExternalLinkIcon
} from 'lucide-react';

// Types
interface TeamMember {
  id: number;
  user_id?: number;
  name: string;
  role: string;
  bio: string;
  profile_image_url?: string;
  is_founder: boolean;
  display_order: number;
  expertise: string[];
  social_linkedin?: string;
  social_twitter?: string;
  social_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // If linked to user account
  user?: {
    id: number;
    username: string;
    email: string;
    profile_picture?: string;
    bio?: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  bio?: string;
}

interface TeamMemberFormData {
  user_id?: number;
  name: string;
  role: string;
  bio: string;
  profile_image_url?: string;
  is_founder: boolean;
  display_order: number;
  expertise: string[];
  social_linkedin?: string;
  social_twitter?: string;
  social_email?: string;
  is_active: boolean;
}

export default function TeamManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [useExistingUser, setUseExistingUser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ['admin-team-members'],
    queryFn: async () => {
      const response = await fetch('/api/admin/team-members');
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    }
  });

  // Fetch users for selection
  const { data: users } = useQuery<User[]>({
    queryKey: ['admin-users-for-team'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: useExistingUser
  });

  // Form state
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    role: '',
    bio: '',
    is_founder: false,
    display_order: (teamMembers?.length || 0) + 1,
    expertise: [],
    is_active: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await fetch('/api/admin/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Team member created successfully' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TeamMemberFormData }) => {
      const response = await fetch(`/api/admin/team-members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Team member updated successfully' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/team-members/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete team member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Success', description: 'Team member deleted successfully' });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: 'up' | 'down' }) => {
      const response = await fetch(`/api/admin/team-members/${id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });
      if (!response.ok) throw new Error('Failed to reorder team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      is_founder: false,
      display_order: (teamMembers?.length || 0) + 1,
      expertise: [],
      is_active: true
    });
    setEditingMember(null);
    setUseExistingUser(false);
    setExpertiseInput('');
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      user_id: member.user_id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      profile_image_url: member.profile_image_url,
      is_founder: member.is_founder,
      display_order: member.display_order,
      expertise: member.expertise,
      social_linkedin: member.social_linkedin,
      social_twitter: member.social_twitter,
      social_email: member.social_email,
      is_active: member.is_active
    });
    setUseExistingUser(!!member.user_id);
    setExpertiseInput(member.expertise.join(', '));
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse expertise from comma-separated string
    const expertise = expertiseInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const submissionData = { ...formData, expertise };

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users?.find(u => u.id === parseInt(userId));
    if (user) {
      setFormData({
        ...formData,
        user_id: user.id,
        name: user.username,
        bio: user.bio || '',
        profile_image_url: user.profile_picture,
        social_email: user.email
      });
    }
  };

  const addExpertise = (skill: string) => {
    if (skill && !expertiseInput.includes(skill)) {
      const current = expertiseInput ? expertiseInput + ', ' + skill : skill;
      setExpertiseInput(current);
    }
  };

  // Filter team members
  const filteredMembers = teamMembers?.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load team members: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-gray-400">Manage team members displayed on the About page</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </DialogTitle>
              <DialogDescription>
                {editingMember ? 'Update team member information' : 'Add a new team member to display on the About page'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Use Existing User Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-existing-user"
                  checked={useExistingUser}
                  onCheckedChange={setUseExistingUser}
                />
                <Label htmlFor="use-existing-user">Link to existing user account</Label>
              </div>

              {/* User Selection */}
              {useExistingUser && (
                <div className="space-y-2">
                  <Label htmlFor="user-select">Select User</Label>
                  <Select value={formData.user_id?.toString()} onValueChange={handleUserSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{user.username} ({user.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the team member..."
                />
              </div>

              {/* Profile Image URL */}
              <div className="space-y-2">
                <Label htmlFor="profile-image">Profile Image URL</Label>
                <Input
                  id="profile-image"
                  type="url"
                  value={formData.profile_image_url || ''}
                  onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Expertise */}
              <div className="space-y-2">
                <Label htmlFor="expertise">Expertise (comma-separated)</Label>
                <Input
                  id="expertise"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  placeholder="e.g., Space Technology, Astrophysics, Mission Planning"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Space Technology', 'Astrophysics', 'Data Science', 'UI/UX Design', 'Engineering', 'Science Communication'].map(skill => (
                    <Button
                      key={skill}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addExpertise(skill)}
                      className="text-xs"
                    >
                      + {skill}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={formData.social_linkedin || ''}
                    onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    type="url"
                    value={formData.social_twitter || ''}
                    onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.social_email || ''}
                    onChange={(e) => setFormData({ ...formData, social_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-founder"
                    checked={formData.is_founder}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_founder: checked })}
                  />
                  <Label htmlFor="is-founder">Founder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-order">Display Order</Label>
                  <Input
                    id="display-order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {editingMember ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Members List */}
      <div className="grid gap-4">
        {filteredMembers?.map((member) => (
          <Card key={member.id} className="bg-gray-900/60 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-700 flex items-center justify-center text-white font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      {member.is_founder && (
                        <Badge variant="outline" className="bg-yellow-950/50 text-yellow-300 border-yellow-800/50">
                          <StarIcon className="h-3 w-3 mr-1" />
                          Founder
                        </Badge>
                      )}
                      {member.user_id && (
                        <Badge variant="outline" className="bg-blue-950/50 text-blue-300 border-blue-800/50">
                          <UserIcon className="h-3 w-3 mr-1" />
                          Linked User
                        </Badge>
                      )}
                      {!member.is_active && (
                        <Badge variant="outline" className="bg-red-950/50 text-red-300 border-red-800/50">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-purple-400 text-sm font-medium">{member.role}</p>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{member.bio}</p>
                    {member.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 text-xs">Order: {member.display_order}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reorderMutation.mutate({ id: member.id, direction: 'up' })}
                    disabled={reorderMutation.isPending}
                  >
                    <MoveUpIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reorderMutation.mutate({ id: member.id, direction: 'down' })}
                    disabled={reorderMutation.isPending}
                  >
                    <MoveDownIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(member)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this team member?')) {
                        deleteMutation.mutate(member.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers?.length === 0 && (
        <Card className="bg-gray-900/60 border-gray-700">
          <CardContent className="p-8 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No team members found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery ? 'No team members match your search.' : 'Get started by adding your first team member.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 