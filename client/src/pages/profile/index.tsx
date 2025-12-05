import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Lock, Trash2, AlertTriangle, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiGoogle } from "react-icons/si";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  provider: string | null;
  googleId: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("personal");
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<UserProfile>({
    queryKey: ["/api/account/profile"],
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await apiRequest("PUT", "/api/account/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/account/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (password?: string) => {
      const response = await apiRequest("DELETE", "/api/account", password ? { password } : {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/auth/sign-in");
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load profile</p>
        <Button onClick={() => setLocation("/auth/sign-in")} data-testid="button-go-signin">
          Sign In
        </Button>
      </div>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email.split("@")[0];
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleEditStart = () => {
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ firstName, lastName });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleDeleteAccount = () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    deleteAccountMutation.mutate(profile.hasPassword ? deletePassword : undefined);
  };

  const isGoogleOnlyAccount = profile.googleId && !profile.hasPassword;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and security settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profileImageUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-display-name">{displayName}</h2>
              <p className="text-sm text-muted-foreground" data-testid="text-email">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {profile.emailVerified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
                {profile.googleId && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <SiGoogle className="h-3 w-3" />
                    Google
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="personal" className="flex-1 gap-2" data-testid="tab-personal">
            <User className="h-4 w-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 gap-2" data-testid="tab-security">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 gap-2" data-testid="tab-account">
            <Shield className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your name and profile details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEditStart} data-testid="button-edit-profile">
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEditCancel} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      data-testid="input-first-name"
                    />
                  ) : (
                    <p className="text-sm py-2" data-testid="text-first-name">
                      {profile.firstName || <span className="text-muted-foreground">Not set</span>}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      data-testid="input-last-name"
                    />
                  ) : (
                    <p className="text-sm py-2" data-testid="text-last-name">
                      {profile.lastName || <span className="text-muted-foreground">Not set</span>}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>Email Address</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {profile.email}
                  <span className="ml-2 text-xs">(Cannot be changed)</span>
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground py-2">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                {isGoogleOnlyAccount
                  ? "You signed up with Google and don't have a password set."
                  : "Update your password to keep your account secure"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGoogleOnlyAccount ? (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <SiGoogle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Google Account</p>
                    <p className="text-sm text-muted-foreground">
                      Password management is handled by Google. Visit your Google account settings to change your password.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        data-testid="input-current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        data-testid="button-toggle-current-password"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        data-testid="input-new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        data-testid="button-toggle-new-password"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        data-testid="input-confirm-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                    data-testid="button-change-password"
                  >
                    {changePasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Change Password
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Warning: This action cannot be undone</p>
                    <p className="text-muted-foreground mt-1">
                      Deleting your account will permanently remove:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                      <li>All your personal information</li>
                      <li>All workspaces you own</li>
                      <li>All videos, characters, and assets</li>
                      <li>All production campaigns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                data-testid="button-delete-account"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This action is permanent and cannot be undone. All your data will be deleted forever.
                </p>
                
                {profile.hasPassword && (
                  <div className="grid gap-2">
                    <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      data-testid="input-delete-password"
                    />
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmDelete">Type DELETE to confirm</Label>
                  <Input
                    id="confirmDelete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    data-testid="input-confirm-delete"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeletePassword("");
                setConfirmText("");
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={
                confirmText !== "DELETE" || 
                (profile.hasPassword && !deletePassword) ||
                deleteAccountMutation.isPending
              }
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteAccountMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
