import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { 
  LayoutDashboard, Users, Building2, Database, ShoppingCart,
  Wallet, BarChart3, LifeBuoy, FileEdit, Settings,
  Flag, Shield, Mail, MessageSquare, Image, FileText
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[]; // Roles that can see this item
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
    roles: ['admin', 'support']
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users,
    roles: ['admin', 'support']
  },
  { 
    name: 'Projects', 
    href: '/admin/projects', 
    icon: Building2,
    roles: ['admin']
  },
  { 
    name: 'Leads', 
    href: '/admin/leads', 
    icon: Database,
    roles: ['admin']
  },
  { 
    name: 'Purchases', 
    href: '/admin/purchases', 
    icon: ShoppingCart,
    roles: ['admin']
  },
  { 
    name: 'Wallets', 
    href: '/admin/wallets', 
    icon: Wallet,
    roles: ['admin']
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: BarChart3,
    roles: ['admin']
  },
  { 
    name: 'Support', 
    href: '/admin/support', 
    icon: LifeBuoy,
    roles: ['admin', 'support']
  },
  {
    name: 'CMS',
    href: '/admin/cms',
    icon: FileEdit,
    roles: ['admin'],
    children: [
      { name: 'Projects', href: '/admin/cms/projects', icon: Building2, roles: ['admin'] },
      { name: 'Email Templates', href: '/admin/cms/email', icon: Mail, roles: ['admin'] },
      { name: 'SMS Templates', href: '/admin/cms/sms', icon: MessageSquare, roles: ['admin'] },
      { name: 'Banners', href: '/admin/cms/banners', icon: Image, roles: ['admin'] },
      { name: 'Marketing', href: '/admin/cms/marketing', icon: FileText, roles: ['admin'] },
    ],
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    roles: ['admin'],
    children: [
      { name: 'General', href: '/admin/settings/general', icon: Settings, roles: ['admin'] },
      { name: 'Feature Flags', href: '/admin/settings/features', icon: Flag, roles: ['admin'] },
      { name: 'Security', href: '/admin/settings/security', icon: Shield, roles: ['admin'] },
    ],
  },
];

export const AdminSidebar: React.FC = () => {
  const { profile } = useAuthStore();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const canSeeItem = (item: NavItem) => {
    if (!profile) return false;
    return item.roles.includes(profile.role);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!canSeeItem(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const Icon = item.icon;

    return (
      <div key={item.name}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.name)}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors rounded-lg group"
            style={{ paddingLeft: `${depth * 12 + 16}px` }}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1 text-left font-medium">{item.name}</span>
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <NavLink
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`
            }
            style={{ paddingLeft: `${depth * 12 + 16}px` }}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children?.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 overflow-y-auto">
      <div className="p-4">
        {/* Admin Badge */}
        <div className="mb-6 p-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-sm">
              {profile?.role === 'admin' ? 'Admin Panel' : 'Support Panel'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map(item => renderNavItem(item))}
        </nav>

        {/* Footer Info */}
        <div className="mt-8 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500 px-4">
            <p>SaleMate Admin</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

