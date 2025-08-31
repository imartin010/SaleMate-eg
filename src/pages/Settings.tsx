import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/format';
import { 
  User, 
  Mail, 
  Shield, 
  Sun, 
  LogOut,
  Bell,
  Globe,
  Smartphone,
  Key,
  Palette,
  Eye,
  Save,
  Edit,
  Camera,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Phone,
  X,
  Loader2
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, profile, role, signOut, refreshProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: profile?.name || user?.email?.split('@')[0] || 'User',
    phone: profile?.phone || '',
    email: profile?.email || user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {!user ? 'Loading user data...' : 'Loading profile data...'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            If this takes too long, please refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'support': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'support': return <Bell className="h-4 w-4" />;
      case 'manager': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Delete the user account
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id);

      if (userError) {
        throw userError;
      }

             await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>{message.text}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessage(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Header Section - Mobile First */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Settings</h1>
            <p className="text-lg text-muted-foreground">
              Manage your account preferences and application settings
            </p>
          </div>
          
          {/* Mobile Actions */}
          <div className="flex items-center gap-2 sm:hidden">
            {isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            )}
            <Button 
              size="sm" 
              variant={isEditing ? "destructive" : "outline"}
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setFormData({
                    name: profile.name || '',
                    phone: profile.phone || '',
                    email: profile.email || ''
                  });
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile.name || '',
                      phone: profile.phone || '',
                      email: profile.email || ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Settings Overview - Mobile First Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mx-auto mb-2">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">Profile</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mx-auto mb-2">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{role}</div>
            <div className="text-sm text-muted-foreground">Role</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mx-auto mb-2">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">Light</div>
            <div className="text-sm text-muted-foreground">Theme</div>
          </div>
          
          <div className="card-modern card-hover p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">Active</div>
            <div className="text-sm text-muted-foreground">Status</div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
            <p className="text-muted-foreground">Your account details and role information</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                disabled
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-foreground">{profile.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge className={`${getRoleColor(role)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2 w-fit`}>
                  {getRoleIcon(role)}
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <Input 
                value={formData.email} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Member Since</label>
              <Input 
                value={formatDate(profile.created_at)} 
                disabled 
                className="bg-gray-50" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                {isEditing 
                  ? "Click 'Save Changes' to update your profile information."
                  : "Click 'Edit Profile' to modify your information."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Account Security</h2>
            <p className="text-muted-foreground">Manage your password and security settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">Last changed recently</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <Key className="h-4 w-4 mr-2" />
              Change
            </Button>
          </div>

          {showPasswordForm && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
              <h4 className="font-medium text-blue-800">Change Password</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Password</label>
                  <Input 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">New Password</label>
                  <Input 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
                  <Input 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Update Password
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Not enabled</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Shield className="h-4 w-4 mr-2" />
              Enable
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Login Sessions</h3>
                <p className="text-sm text-muted-foreground">1 active session</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </div>
      </div>

      {/* Appearance & Preferences */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Appearance & Preferences</h2>
            <p className="text-muted-foreground">Customize your experience and interface</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Info */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Theme</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-foreground">Light Mode</div>
                  <div className="text-sm text-muted-foreground">Always enabled for consistent experience</div>
                </div>
              </div>
            </div>
          </div>

          {/* Language & Region */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Time Zone</label>
              <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                <option value="utc+2">UTC+2 (Cairo)</option>
                <option value="utc+0">UTC+0 (London)</option>
                <option value="utc-5">UTC-5 (New York)</option>
              </select>
            </div>
          </div>

          {/* Notification Preferences */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Email Notifications</span>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Push Notifications</span>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Marketing Updates</span>
                </div>
                <input type="checkbox" className="rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card-modern p-6 border-red-200 bg-red-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
            <p className="text-red-600">Irreversible and destructive actions</p>
          </div>
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <div className="space-y-4">
          {showDeleteConfirm ? (
            <div className="p-4 bg-red-100 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Confirm Account Deletion</h3>
              <p className="text-sm text-red-600 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Yes, Delete My Account
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
              <div>
                <h3 className="font-medium text-red-800">Delete Account</h3>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-800">Logout</h3>
              <p className="text-sm text-red-600">Sign out of your current session</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut} 
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
