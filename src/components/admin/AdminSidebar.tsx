import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, Database, ShoppingCart,
  Wallet, BarChart3, HeadphonesIcon, FileText, Settings,
  Flag, FileSearch, Image, Mail, MessageSquare, Megaphone,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { Logo } from '../common/Logo';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/app/admin',
    icon: LayoutDashboard,
    allowedRoles: ['admin'],
  },
  {
    label: 'Users',
    path: '/app/admin/users',
    icon: Users,
    allowedRoles: ['admin'],
  },
  {
    label: 'Projects',
    path: '/app/admin/projects',
    icon: Building2,
    allowedRoles: ['admin'],
  },
  {
    label: 'Leads',
    path: '/app/admin/leads',
    icon: Database,
    allowedRoles: ['admin'],
  },
  {
    label: 'Purchases',
    path: '/app/admin/purchases',
    icon: ShoppingCart,
    allowedRoles: ['admin'],
  },
  {
    label: 'Wallets',
    path: '/app/admin/wallets',
    icon: Wallet,
    allowedRoles: ['admin'],
  },
  {
    label: 'Analytics',
    path: '/app/admin/analytics',
    icon: BarChart3,
    allowedRoles: ['admin'],
  },
  {
    label: 'Support',
    path: '/app/admin/support',
    icon: HeadphonesIcon,
    allowedRoles: ['admin', 'support'],
  },
  {
    label: 'CMS',
    path: '/app/admin/cms',
    icon: FileText,
    allowedRoles: ['admin'],
    children: [
      {
        label: 'Projects',
        path: '/app/admin/cms/projects',
        icon: Building2,
      },
      {
        label: 'Email Templates',
        path: '/app/admin/cms/emails',
        icon: Mail,
      },
      {
        label: 'SMS Templates',
        path: '/app/admin/cms/sms',
        icon: MessageSquare,
      },
      {
        label: 'Banners',
        path: '/app/admin/cms/banners',
        icon: Megaphone,
      },
      {
        label: 'Marketing',
        path: '/app/admin/cms/marketing',
        icon: Image,
      },
      {
        label: 'Settings',
        path: '/app/admin/cms/settings',
        icon: Settings,
      },
    ],
  },
  {
    label: 'System',
    path: '/app/admin/system',
    icon: Settings,
    allowedRoles: ['admin'],
    children: [
      {
        label: 'Feature Flags',
        path: '/app/admin/system/flags',
        icon: Flag,
      },
      {
        label: 'Audit Logs',
        path: '/app/admin/system/audit',
        icon: FileSearch,
      },
    ],
  },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuthStore();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    CMS: true,
    System: true,
  });

  const toggleExpanded = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const hasAccess = (item: NavItem): boolean => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(profile?.role || '');
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="w-20 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm flex-shrink-0" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 flex justify-center" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: 'bold', fontSize: '1.25rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>S</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((item) => {
          if (!hasAccess(item)) return null;

          const Icon = item.icon;
          const active = isActive(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expanded[item.label];

          return (
            <div key={item.path}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200 min-h-[64px] ${
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={item.label}
                    style={{ display: 'flex', flexDirection: 'column', backgroundColor: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#4b5563' }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.color = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#4b5563';
                      }
                    }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      active
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600'
                    }`} style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? '#3b82f6' : '#f3f4f6',
                      color: active ? 'white' : '#4b5563',
                      boxShadow: active ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
                    }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  </button>

                  {isExpanded && item.children && (
                    <div className="ml-2 mt-1 space-y-1 border-l-2 border-blue-100 pl-2" style={{ width: '100%' }}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.path);

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`w-full flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-xl transition-all duration-200 min-h-[56px] no-underline ${
                              childActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={child.label}
                            style={{ display: 'flex', flexDirection: 'column', backgroundColor: childActive ? '#eff6ff' : 'transparent', color: childActive ? '#2563eb' : '#4b5563', textDecoration: 'none' }}
                            onMouseEnter={(e) => {
                              if (!childActive) {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                e.currentTarget.style.color = '#2563eb';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!childActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#4b5563';
                              }
                            }}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              childActive
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600'
                            }`} style={{
                              width: '2.25rem',
                              height: '2.25rem',
                              borderRadius: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: childActive ? '#3b82f6' : '#f3f4f6',
                              color: childActive ? 'white' : '#4b5563',
                              boxShadow: childActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
                            }}>
                              <ChildIcon className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-medium text-center leading-tight">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`w-full flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200 min-h-[64px] no-underline ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={item.label}
                  style={{ display: 'flex', flexDirection: 'column', backgroundColor: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#4b5563', textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.color = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#4b5563';
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    active
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600'
                  }`} style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? '#3b82f6' : '#f3f4f6',
                    color: active ? 'white' : '#4b5563',
                    boxShadow: active ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
                  }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 flex flex-col items-center gap-2" style={{ padding: '0.75rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {profile?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold truncate max-w-[60px]" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '60px' }}>{profile?.name || 'Admin'}</div>
          <div className="text-[10px] capitalize" style={{ fontSize: '10px', color: '#6b7280', textTransform: 'capitalize' }}>{profile?.role || 'admin'}</div>
        </div>
      </div>
    </div>
  );
};
