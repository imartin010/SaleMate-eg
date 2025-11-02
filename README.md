# SaleMate - Egyptian Real Estate Lead Management System

SaleMate is a comprehensive frontend-only web application built for Egyptian real estate professionals. It provides lead management, shopping for leads, community features, and role-based access control.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to the URL shown in the terminal (typically `http://localhost:5173`)

4. **Login:**
   - The app will redirect you to the Quick Login page
   - Choose from one of the pre-seeded users to login
   - Each user has different permissions based on their role

## 👥 Demo Users

The application comes with pre-seeded demo users:

| Name | Email | Role | Access |
|------|-------|------|---------|
| Ahmed Hassan | admin@sm.com | Admin | Full access to all features |
| Fatma Ali | support@sm.com | Support | Support panel, user management |
| Mohamed Saeed | manager@sm.com | Manager | Team lead management |
| Sara Mahmoud | user1@sm.com | User | Basic agent features |
| Omar Khaled | user2@sm.com | User | Basic agent features |

## 🏗️ Tech Stack

- **Build Tool:** Vite
- **Framework:** React 18 with TypeScript
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **Server State:** TanStack React Query
- **Styling:** Tailwind CSS + Custom UI Components
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios (with mock data)
- **Icons:** Lucide React
- **Date Handling:** Day.js
- **Utilities:** clsx, class-variance-authority

## 📱 Features

### Core Features
- **Dashboard:** Overview with stats and quick actions
- **Lead Management (CRM):** View, edit, and manage your leads
- **Shop:** Purchase leads from real estate projects (min 30 leads)
- **Community:** Social feed for real estate professionals
- **Partners:** Higher commission partner information
- **Settings:** Profile and theme management

### Role-Based Access
- **Admin:** Full system access, user management, project management
- **Support:** Support panel, case management, user moderation
- **Manager:** Team lead management, view team performance
- **User:** Basic agent features, personal lead management

### Payment Methods
- **Instapay:** Digital payment method
- **Vodafone Cash:** Mobile payment
- **Bank Transfer:** Traditional banking

### Responsive Design
- **Desktop:** Sidebar navigation with full feature access
- **Mobile:** Bottom navigation with optimized mobile experience
- **Dark/Light Mode:** Theme toggle with system preference detection

## 📊 Data Models

The application uses localStorage for data persistence with the following models:

- **Users:** Role-based user accounts
- **Projects:** Real estate projects with available leads
- **Leads:** Client information with stages and feedback
- **Orders:** Lead purchase transactions
- **Posts:** Community social posts with comments/likes
- **Support Cases:** Customer support tickets

## 🎨 UI Components

Built with custom shadcn/ui-inspired components:
- Cards, Buttons, Inputs, Selects
- Dialogs, Badges, Tables
- Responsive layouts and forms

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/
│   ├── layout/          # Layout components (Sidebar, BottomNav)
│   ├── providers/       # Context providers (Theme, Query)
│   └── routes.tsx       # React Router configuration
├── components/
│   ├── ui/             # Base UI components
│   ├── leads/          # Lead-specific components
│   ├── projects/       # Project-specific components
│   └── common/         # Shared components
├── pages/              # Page components
├── store/              # Zustand stores
├── mocks/              # Mock data and localStorage DB
├── lib/                # Utilities and helpers
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

## 🌟 Key Features Implemented

### Shop Flow
1. Browse available projects with lead counts
2. Select quantity (minimum 30 leads)
3. Choose payment method
4. Process mock payment
5. Leads automatically assigned to user
6. Success notification and redirect to CRM

### CRM Features
- **Desktop:** Full data table with inline editing
- **Mobile:** Card-based view with quick actions
- **Filtering:** By project, platform, stage, and search
- **Actions:** Call (tel:), WhatsApp, edit stage, add feedback

### Community
- Create posts and comments
- Like/unlike functionality
- User role badges
- Real-time-like interaction (local state)

### Admin Panel
- User role management
- Project CRUD operations
- CSV upload simulation for bulk lead import
- System insights and statistics

### Support Panel
- Support case management
- User moderation (ban/unban)
- Manager role removal
- Case status tracking

## 🎯 Egyptian Real Estate Focus

The application is specifically designed for the Egyptian market:
- **Regions:** New Administrative Capital, North Coast, Sheikh Zayed, etc.
- **Developers:** Local Egyptian real estate developers
- **Phone Numbers:** Egyptian mobile number formatting
- **Currency:** EGP (Egyptian Pounds)
- **Partners:** The Address Investments, Bold Routes, Nawy, Coldwell Banker

## 🔒 Security & RBAC

Role-based access control implemented throughout:
- Route protection based on user roles
- Component-level role guards
- Feature visibility based on permissions
- Manager hierarchy support

## 📱 Mobile Optimization

- Bottom navigation for mobile devices
- Touch-friendly interfaces
- Responsive card layouts
- Mobile-optimized forms and actions

## 🎨 Design System

- **Colors:** Tailwind CSS with CSS custom properties
- **Typography:** Consistent font scales and weights
- **Spacing:** Systematic spacing scale
- **Shadows:** Subtle shadow system for depth
- **Animations:** Smooth transitions and hover effects

## 🚀 Production Ready

The application is built with production considerations:
- TypeScript for type safety
- ESLint for code quality
- Responsive design for all devices
- Optimized build process with Vite
- Clean architecture with separation of concerns

## 📄 License

This project is a demo application built for educational and demonstration purposes.

---

**Ready to use!** Just run `npm install && npm run dev` and start exploring the SaleMate application.