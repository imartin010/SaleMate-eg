import React from 'react';
import { Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export const AdminTopbar: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="admin-topbar">
      <div className="flex items-center justify-between w-full">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="admin-search">
            <Search className="admin-search-icon h-5 w-5" />
            <input
              type="text"
              placeholder="Do a voice search..."
              className="admin-input pl-12"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-gray-900">{profile?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 admin-card py-2 z-50">
                <Link
                  to="/app/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 transition-colors rounded-lg"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </Link>
                <Link
                  to="/app/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 transition-colors rounded-lg"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Settings</span>
                </Link>
                <div className="border-t border-gray-100 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
