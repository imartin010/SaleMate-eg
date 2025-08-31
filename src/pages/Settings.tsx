import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuthStore } from '../store/auth';

import { formatDate } from '../lib/format';
import { 
  User, 
  Mail, 
  Shield, 
  Moon, 
  Sun, 
  LogOut,
  Bell,
  Globe,
  Smartphone,
  Monitor,
  Settings as SettingsIcon,
  Key,
  Palette,
  Eye,
  EyeOff,
  Save,
  Edit,
  Camera,
  Lock,
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useAuthStore();

  if (!user) return null;

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

  return (
    <div className="space-y-8">
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
            <Button variant="outline" size="sm" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
            <Button size="sm" className="shrink-0">
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
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
            <div className="text-2xl font-bold text-foreground">{user.role}</div>
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
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
              >
                <Camera className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-foreground">{user.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge className={`${getRoleColor(user.role)} border px-3 py-1.5 text-sm font-medium flex items-center gap-2 w-fit`}>
                  {getRoleIcon(user.role)}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input value={user.name} disabled className="bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled className="bg-gray-50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Member Since</label>
              <Input value={formatDate(user.createdAt)} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Profile information is managed by your administrator. Contact support for updates.
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
          <Button variant="outline" size="sm">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Key className="h-4 w-4 mr-2" />
              Change
            </Button>
          </div>

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
            <Button variant="outline" size="sm">
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
                <p className="text-sm text-muted-foreground">2 active sessions</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
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
          <Button variant="outline" size="sm">
            <Palette className="h-4 w-4 mr-2" />
            Customize
          </Button>
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
          <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-800">Delete Account</h3>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-800">Logout</h3>
              <p className="text-sm text-red-600">Sign out of your current session</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="border-red-300 text-red-700 hover:bg-red-100">
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
