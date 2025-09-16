#!/bin/bash

# SaleMate Deployment Script
# This script builds, pushes, and deploys the application

set -e  # Exit on any error

echo "🚀 Starting SaleMate Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking Node.js version..."
node --version

print_status "Checking npm version..."
npm --version

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Run linting
print_status "Running ESLint..."
npm run lint

if [ $? -eq 0 ]; then
    print_success "Linting passed"
else
    print_warning "Linting failed, but continuing with build..."
fi

# Step 3: Build the application
print_status "Building application for production..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 4: Check if dist directory exists
if [ ! -d "dist" ]; then
    print_error "Build directory 'dist' not found. Build may have failed."
    exit 1
fi

print_success "Build artifacts created in 'dist' directory"

# Step 5: Check for environment variables
print_status "Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please update .env file with your actual values before deploying"
    else
        print_error ".env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Step 6: Git operations
print_status "Checking git status..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
fi

# Add all files
print_status "Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    print_status "Committing changes..."
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S') - Build with wallet system and 30 lead minimum"
fi

# Step 7: Check for remote repository
print_status "Checking for remote repository..."

if ! git remote get-url origin &> /dev/null; then
    print_warning "No remote repository configured."
    print_status "To add a remote repository, run:"
    print_status "git remote add origin <your-repository-url>"
    print_status "Then run this script again."
    exit 0
fi

# Step 8: Push to remote repository
print_status "Pushing to remote repository..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Code pushed to repository successfully"
else
    print_error "Failed to push to repository"
    exit 1
fi

# Step 9: Deployment options
print_status "Deployment options:"
echo "1. Vercel (Recommended for React apps)"
echo "2. Netlify"
echo "3. GitHub Pages"
echo "4. Manual deployment"

read -p "Choose deployment method (1-4): " deploy_choice

case $deploy_choice in
    1)
        print_status "Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            print_warning "Vercel CLI not installed. Installing..."
            npm install -g vercel
            vercel --prod
        fi
        ;;
    2)
        print_status "Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        else
            print_warning "Netlify CLI not installed. Installing..."
            npm install -g netlify-cli
            netlify deploy --prod --dir=dist
        fi
        ;;
    3)
        print_status "Deploying to GitHub Pages..."
        print_warning "Make sure you have GitHub Pages enabled in your repository settings"
        print_status "The build files are in the 'dist' directory"
        print_status "You can manually upload them to GitHub Pages or use GitHub Actions"
        ;;
    4)
        print_status "Manual deployment"
        print_success "Build completed. Files are in the 'dist' directory"
        print_status "Upload the contents of 'dist' to your web server"
        ;;
    *)
        print_warning "Invalid choice. Build completed but not deployed."
        ;;
esac

# Step 10: Final status
print_success "Deployment process completed!"
print_status "Build files location: ./dist"
print_status "Next steps:"
echo "1. Update your environment variables in production"
echo "2. Configure your database connection"
echo "3. Test the application in production"
echo "4. Set up monitoring and analytics"

print_success "🎉 SaleMate deployment completed successfully!"
