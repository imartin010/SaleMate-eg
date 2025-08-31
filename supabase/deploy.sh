#!/bin/bash

# SaleMate Supabase Deployment Script
# This script deploys the complete Supabase backend to production

set -e

echo "🚀 Starting SaleMate Supabase deployment..."

# Check if project ref is provided
if [ -z "$1" ]; then
    echo "❌ Error: Project reference is required"
    echo "Usage: ./deploy.sh <project-ref>"
    echo "Example: ./deploy.sh abcdefghijklmnop"
    exit 1
fi

PROJECT_REF=$1

echo "📋 Project Reference: $PROJECT_REF"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase"
    echo "Login with: supabase login"
    exit 1
fi

echo "🔗 Linking to project..."
supabase link --project-ref $PROJECT_REF

echo "🗄️  Deploying database schema..."
supabase db push

echo "🌐 Deploying Edge Functions..."

echo "  📤 Deploying payment_webhook function..."
supabase functions deploy payment_webhook

echo "  📤 Deploying assign_leads function..."
supabase functions deploy assign_leads

echo "  📤 Deploying recalc_analytics function..."
supabase functions deploy recalc_analytics

echo "🔄 Setting up cron jobs..."

# Set up analytics refresh cron job (daily at 2 AM)
echo "  ⏰ Setting up analytics refresh cron job..."
supabase functions deploy recalc_analytics --no-verify-jwt

echo "✅ Deployment completed successfully!"
echo ""
echo "🌍 Your Supabase project is now live at:"
echo "   https://$PROJECT_REF.supabase.co"
echo ""
echo "🔑 Don't forget to:"
echo "   1. Update your frontend environment variables"
echo "   2. Set up proper webhook secrets in production"
echo "   3. Configure storage bucket policies"
echo "   4. Test all Edge Functions"
echo ""
echo "📚 Documentation: https://supabase.com/docs"
