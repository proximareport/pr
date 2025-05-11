import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, ArrowLeft, Camera, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileFormValues {
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProfileFormValues>({
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
      profilePicture: user?.profilePicture || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      // Set form values when user data is available
      reset({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture || "",
      });

      // Set profile picture preview if available
      if (user.profilePicture) {
        setProfilePicturePreview(user.profilePicture);
      }
    }
  }, [user, navigate, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if password change was requested
      if (showPasswordSection && data.currentPassword && data.newPassword) {
        // Validate password match
        if (data.newPassword !== data.confirmPassword) {
          toast({
            title: "Passwords do not match",
            description: "Your new password and confirmation do not match.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Update password
        const passwordResponse = await apiRequest("POST", "/api/users/password", {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        
        if (!passwordResponse.ok) {
          const error = await passwordResponse.json();
          throw new Error(error.message || "Failed to update password");
        }
      }
      
      // Handle profile picture upload if a new file was selected
      let profilePicturePath = user.profilePicture;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("profilePicture", selectedFile);
        
        const uploadResponse = await fetch("/api/users/profile-picture", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload profile picture");
        }
        
        const result = await uploadResponse.json();
        profilePicturePath = result.profilePicture;
      }
      
      // Update user profile
      const userUpdate = {
        username: data.username !== user.username ? data.username : undefined,
        email: data.email !== user.email ? data.email : undefined,
        bio: data.bio !== user.bio ? data.bio : undefined,
        profilePicture: profilePicturePath !== user.profilePicture ? profilePicturePath : undefined,
      };
      
      // Remove undefined fields
      Object.keys(userUpdate).forEach(key => {
        if (userUpdate[key as keyof typeof userUpdate] === undefined) {
          delete userUpdate[key as keyof typeof userUpdate];
        }
      });
      
      // Only make the API call if there are changes
      if (Object.keys(userUpdate).length > 0) {
        await updateUser(userUpdate);
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Navigate back to profile page
      navigate(`/profile/${data.username}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#0D0D17] py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <button 
          onClick={() => navigate(`/profile/${user.username}`)}
          className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </button>
        
        <Card className="bg-[#14141E] border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information and profile settings
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24 border-2 border-purple-500/50">
                      <AvatarImage src={profilePicturePreview || undefined} />
                      <AvatarFallback className="bg-purple-900/30 text-xl">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="profile-picture" 
                      className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      <input 
                        id="profile-picture"
                        type="file"
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-white/60">Click the camera icon to change</p>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        className="bg-[#1E1E2D] border-white/10"
                        {...register("username", { required: "Username is required" })}
                      />
                      {errors.username && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" /> {errors.username.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        className="bg-[#1E1E2D] border-white/10"
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" /> {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      className="bg-[#1E1E2D] border-white/10 min-h-[100px]"
                      placeholder="Tell others about yourself..."
                      {...register("bio")}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="w-full justify-start"
                >
                  {showPasswordSection ? "Hide Password Section" : "Change Password"}
                </Button>
                
                {showPasswordSection && (
                  <div className="mt-4 space-y-4 border border-white/10 rounded-lg p-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        className="bg-[#1E1E2D] border-white/10"
                        {...register("currentPassword", {
                          required: showPasswordSection ? "Current password is required" : false
                        })}
                      />
                      {errors.currentPassword && (
                        <p className="text-red-500 text-xs flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" /> {errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          className="bg-[#1E1E2D] border-white/10"
                          {...register("newPassword", {
                            required: showPasswordSection ? "New password is required" : false,
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters"
                            }
                          })}
                        />
                        {errors.newPassword && (
                          <p className="text-red-500 text-xs flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" /> {errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          className="bg-[#1E1E2D] border-white/10"
                          {...register("confirmPassword", {
                            required: showPasswordSection ? "Please confirm your password" : false,
                            validate: value => !showPasswordSection || value === watch("newPassword") || "Passwords do not match"
                          })}
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-xs flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" /> {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                className="bg-purple-800 hover:bg-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}