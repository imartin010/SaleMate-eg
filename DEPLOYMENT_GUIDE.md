# SaleMate Deployment Guide

This guide covers building, pushing, and deploying the SaleMate application to various platforms.

## 🚀 Quick Start

### Option 1: Automated Deployment Script
```bash
# Make the script executable (if not already done)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Steps
```bash
# 1. Install dependencies
npm install

# 2. Build the application
npm run build

# 3. Commit and push changes
git add .
git commit -m "Deploy: Build with wallet system and 30 lead minimum"
git push origin main
```

## 📋 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git** (for version control)

### Required Accounts
- **Supabase** (for database)
- **Vercel/Netlify** (for hosting)
- **GitHub** (for code repository)

## 🔧 Environment Setup

### 1. Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file with your values
nano .env
```

### 2. Required Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

## 🏗️ Build Process

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Build Output
- **Location**: `./dist/`
- **Contents**: Optimized HTML, CSS, JS, and assets
- **Size**: ~2-3MB (typical for React apps)

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables
4. Deploy automatically on push

### Option 2: Netlify

#### Using Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

#### Using Netlify Dashboard
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist` folder
3. Configure environment variables
4. Set up continuous deployment

### Option 3: GitHub Pages

#### Using GitHub Actions
1. Enable GitHub Pages in repository settings
2. The included workflow will automatically deploy
3. Access your site at `https://username.github.io/repository-name`

#### Manual Upload
1. Build the application: `npm run build`
2. Upload contents of `dist/` to GitHub Pages
3. Configure custom domain if needed

### Option 4: Manual Deployment

#### Upload to Web Server
1. Build: `npm run build`
2. Upload `dist/` contents to your web server
3. Configure web server for SPA routing
4. Set up HTTPS and domain

## 🔐 Environment Variables Setup

### Vercel
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Netlify
1. Go to Site settings > Environment variables
2. Add the required variables
3. Redeploy the site

### GitHub Actions
1. Go to repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VERCEL_TOKEN` (if using Vercel)
   - `VERCEL_ORG_ID` (if using Vercel)
   - `VERCEL_PROJECT_ID` (if using Vercel)

## 🗄️ Database Setup

### 1. Run Database Scripts
Execute the following SQL scripts in your Supabase dashboard:

```sql
-- 1. Create wallet and lead request system
\i create_wallet_and_lead_request_system.sql

-- 2. Test the system
\i test_wallet_system.sql
```

### 2. Verify Tables
Check that these tables exist:
- `user_wallets`
- `wallet_transactions`
- `lead_requests`
- `projects`
- `user_profiles` (if using)

### 3. Test Functions
Verify these functions work:
- `get_user_wallet_balance()`
- `add_to_wallet()`
- `create_lead_request()`

## 🔍 Post-Deployment Checklist

### ✅ Application Checks
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Shop page displays projects
- [ ] Project cards show "Min 30 leads" badge
- [ ] Purchase dialog enforces 30 lead minimum
- [ ] Wallet system works
- [ ] Lead request system works
- [ ] Checkout page calculates prices correctly

### ✅ Database Checks
- [ ] User wallets are created automatically
- [ ] Lead requests can be submitted
- [ ] Admin can view lead requests
- [ ] Payment processing works

### ✅ Performance Checks
- [ ] Page load times are acceptable
- [ ] Images load properly
- [ ] Mobile responsiveness works
- [ ] No console errors

## 🐛 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Environment Variables Not Working
- Check variable names (must start with `VITE_`)
- Restart development server after changes
- Verify variables are set in production

#### Database Connection Issues
- Verify Supabase URL and key
- Check RLS policies
- Test database functions manually

#### Deployment Fails
- Check build logs for errors
- Verify all dependencies are installed
- Ensure environment variables are set

### Debug Commands
```bash
# Check build output
npm run build -- --verbose

# Run linting
npm run lint

# Check for TypeScript errors
npx tsc --noEmit

# Test production build locally
npm run preview
```

## 📊 Monitoring and Analytics

### Recommended Tools
- **Vercel Analytics** (if using Vercel)
- **Google Analytics** (add GA4 tracking)
- **Sentry** (for error tracking)
- **Supabase Dashboard** (for database monitoring)

### Performance Monitoring
- Monitor Core Web Vitals
- Track user engagement
- Monitor API response times
- Set up alerts for errors

## 🔄 Continuous Deployment

### GitHub Actions Workflow
The included workflow automatically:
1. Builds the application on push to main
2. Runs linting and tests
3. Deploys to Vercel (if configured)

### Manual Deployment
Use the deployment script:
```bash
./deploy.sh
```

## 📞 Support

### Getting Help
1. Check the troubleshooting section
2. Review build logs
3. Check Supabase logs
4. Contact support team

### Useful Commands
```bash
# Check application status
npm run dev

# Build and test locally
npm run build && npm run preview

# Check for updates
npm outdated

# Update dependencies
npm update
```

## 🎉 Success!

Once deployed, your SaleMate application will be available at your chosen domain with:
- ✅ Complete wallet system
- ✅ Lead request functionality
- ✅ 30 lead minimum order
- ✅ Professional UI/UX
- ✅ Mobile responsiveness
- ✅ Secure payment processing

Happy selling! 🚀
