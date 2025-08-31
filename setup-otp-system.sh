#!/bin/bash

echo "🚀 Setting up SaleMate OTP Authentication System"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Step 1: Apply database migration
echo "🗄️  Step 1: Applying database migration..."
cd supabase

if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found, applying migration..."
    supabase db reset
else
    echo "⚠️  Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   Then run: supabase db reset"
fi

cd ..

echo ""

# Step 2: Deploy Edge Function
echo "🚀 Step 2: Deploying Edge Function..."
cd supabase/functions

if command -v supabase &> /dev/null; then
    echo "✅ Deploying auth-otp function..."
    supabase functions deploy auth-otp
else
    echo "⚠️  Supabase CLI not found. Please deploy manually:"
    echo "   cd supabase/functions"
    echo "   supabase functions deploy auth-otp"
fi

cd ../../

echo ""

# Step 3: Install dependencies
echo "📦 Step 3: Installing dependencies..."
npm install

echo ""

# Step 4: Start development server
echo "🌐 Step 4: Starting development server..."
echo "✅ OTP System Setup Complete!"
echo ""
echo "🔧 Development Mode Features:"
echo "   • Use OTP code: 123456"
echo "   • No SMS charges"
echo "   • Fast testing"
echo ""
echo "📱 Test the system:"
echo "   • Signup: http://localhost:5173/auth/signup"
echo "   • Login: http://localhost:5173/auth/login"
echo ""
echo "🚀 To start the server, run: npm run dev"
echo ""
echo "🔐 For production SMS, configure Twilio in your .env file:"
echo "   TWILIO_ACCOUNT_SID=your_sid"
echo "   TWILIO_AUTH_TOKEN=your_token"
echo "   TWILIO_MESSAGING_SERVICE_SID=your_service_id"
echo "   NODE_ENV=production"
