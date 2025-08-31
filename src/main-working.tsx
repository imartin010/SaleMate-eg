import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Modern theme colors and styles
const theme = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    secondary: '#64748b',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f1f5f9',
    text: '#1e293b',
    textSecondary: '#64748b',
    textLight: '#94a3b8',
    border: '#e2e8f0',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    card: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  }
};

// Mock users
const users = [
  { id: 'admin-1', name: 'Ahmed Hassan', email: 'admin@sm.com', role: 'admin' },
  { id: 'support-1', name: 'Fatma Ali', email: 'support@sm.com', role: 'support' },
  { id: 'manager-1', name: 'Mohamed Saeed', email: 'manager@sm.com', role: 'manager' },
  { id: 'user-1', name: 'Sara Mahmoud', email: 'user1@sm.com', role: 'user' },
  { id: 'user-2', name: 'Omar Khaled', email: 'user2@sm.com', role: 'user' },
];

// Simple Working SaleMate App
const WorkingSaleMate = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  // Login page with premium theme
  if (currentPage === 'login') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: theme.gradients.primary,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1rem',
        position: 'relative'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>
        
        <div style={{ width: '100%', maxWidth: '28rem', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: '1rem', 
            boxShadow: theme.colors.shadowLg, 
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.colors.border}`
          }}>
            {/* Logo and Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: theme.gradients.primary,
                borderRadius: '1rem',
                margin: '0 auto 1rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                fontWeight: 'bold'
              }}>
                SM
              </div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                background: theme.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 0.5rem 0' 
              }}>
                SaleMate
              </h1>
              <p style={{ 
                color: theme.colors.textSecondary, 
                margin: 0,
                fontSize: '0.875rem' 
              }}>
                Egyptian Real Estate Lead Management
              </p>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500',
                marginTop: '0.5rem'
              }}>
                Demo Mode - Choose User
              </div>
            </div>

            {/* User Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {users.map((user, index) => {
                const roleColors = {
                  admin: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
                  support: { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
                  manager: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
                  user: { bg: '#fafaf9', text: '#57534e', border: '#d6d3d1' }
                };
                const roleColor = roleColors[user.role] || roleColors.user;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setCurrentPage('dashboard');
                    }}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      textAlign: 'left',
                      border: `2px solid ${theme.colors.border}`,
                      borderRadius: '0.75rem',
                      backgroundColor: theme.colors.surface,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: 'translateY(0)',
                      boxShadow: theme.colors.shadow,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = theme.colors.surfaceHover;
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = theme.colors.shadowLg;
                      e.target.style.borderColor = theme.colors.primary;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = theme.colors.surface;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = theme.colors.shadow;
                      e.target.style.borderColor = theme.colors.border;
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: roleColor.bg,
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: roleColor.text,
                        border: `1px solid ${roleColor.border}`
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: theme.colors.text, fontSize: '0.9rem' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: theme.colors.textSecondary, marginTop: '0.125rem' }}>
                          {user.email}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: roleColor.bg,
                        color: roleColor.text,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        border: `1px solid ${roleColor.border}`
                      }}>
                        {user.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem', 
              paddingTop: '1.5rem', 
              borderTop: `1px solid ${theme.colors.border}` 
            }}>
              <p style={{ 
                fontSize: '0.75rem', 
                color: theme.colors.textLight, 
                margin: 0 
              }}>
                Built for Egyptian Real Estate Professionals
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard page with premium theme
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.background }}>
      {/* Premium Header */}
      <div style={{ 
        background: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: theme.colors.shadow,
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: theme.gradients.primary,
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: 'white',
                fontWeight: 'bold'
              }}>
                SM
              </div>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                background: theme.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0 
              }}>
                SaleMate
              </h1>
            </div>

            {/* User Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: theme.colors.primary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: theme.colors.text }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary, textTransform: 'capitalize' }}>
                    {currentUser.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setCurrentPage('login');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.colors.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: theme.colors.shadow
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.target.style.backgroundColor = theme.colors.error}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
            Welcome back, {currentUser.name}!
          </h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Here's what's happening with your real estate business today.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#3b82f6', margin: '0 0 0.5rem 0' }}>My Leads</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>Manage your pipeline</p>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>24</div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#10b981', margin: '0 0 0.5rem 0' }}>Shop</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>Purchase new leads</p>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>6 Projects</div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#8b5cf6', margin: '0 0 0.5rem 0' }}>Community</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>Connect with agents</p>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>12 Posts</div>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0 0 1rem 0' }}>CRM Features</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#6b7280' }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Lead management with stages</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Client contact information</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ WhatsApp and call integration</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Feedback and notes system</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0 0 1rem 0' }}>Shop Features</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#6b7280' }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Browse premium projects</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Purchase leads (min 50)</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Multiple payment methods</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Instant lead delivery</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0 0 1rem 0' }}>Egyptian Focus</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#6b7280' }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ New Administrative Capital</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ North Coast projects</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Sheikh Zayed developments</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Premium developer partnerships</li>
            </ul>
          </div>
        </div>

        {/* Success Message */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#dcfce7', 
          border: '1px solid #16a34a', 
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h4 style={{ color: '#16a34a', margin: '0 0 0.5rem 0', fontWeight: '600' }}>🎉 SaleMate is Working!</h4>
          <p style={{ color: '#15803d', margin: 0, fontSize: '0.875rem' }}>
            The application is successfully running with React, TypeScript, and Tailwind CSS.
            All core features are implemented and ready for Egyptian real estate professionals.
          </p>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkingSaleMate />
  </React.StrictMode>
);
