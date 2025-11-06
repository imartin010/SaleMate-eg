#!/bin/bash

# Case Manager Deployment Script
# Automates the complete deployment of the Case Manager system

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🚀 Case Manager System Deployment                    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}1️⃣ Checking prerequisites...${NC}"

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Create .env file from env.example"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}\n"

# Step 2: Install dependencies
echo -e "${BLUE}2️⃣ Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Step 3: Run migrations
echo -e "${BLUE}3️⃣ Running database migrations...${NC}"
if supabase db push; then
    echo -e "${GREEN}✅ Migrations applied${NC}\n"
else
    echo -e "${YELLOW}⚠️ Migrations may have failed. Check manually.${NC}\n"
fi

# Step 4: Deploy Edge Functions
echo -e "${BLUE}4️⃣ Deploying Edge Functions...${NC}"

FUNCTIONS=(
    "notify-user"
    "case-coach"
    "case-stage-change"
    "case-actions"
    "case-face-change"
    "inventory-matcher"
    "reminder-scheduler"
)

for func in "${FUNCTIONS[@]}"; do
    echo -e "  📤 Deploying ${func}..."
    if supabase functions deploy "$func" --no-verify-jwt 2>/dev/null; then
        echo -e "  ${GREEN}✅ ${func} deployed${NC}"
    else
        echo -e "  ${YELLOW}⚠️ ${func} may have failed${NC}"
    fi
done

echo ""

# Step 5: Set secrets
echo -e "${BLUE}5️⃣ Setting Supabase secrets...${NC}"

# Extract OpenAI key from .env
OPENAI_KEY=$(grep VITE_OPENAI_API_KEY .env | cut -d '=' -f2-)

if [ -n "$OPENAI_KEY" ]; then
    if supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"; then
        echo -e "${GREEN}✅ OpenAI API key configured${NC}\n"
    else
        echo -e "${YELLOW}⚠️ Failed to set secret. Set manually:${NC}"
        echo "   supabase secrets set OPENAI_API_KEY=your-key\n"
    fi
else
    echo -e "${YELLOW}⚠️ OPENAI_API_KEY not found in .env${NC}\n"
fi

# Step 6: Build frontend
echo -e "${BLUE}6️⃣ Building frontend...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}\n"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 7: Run tests
echo -e "${BLUE}7️⃣ Running tests...${NC}"
echo "Unit tests:"
npm run test:unit -- --run || echo -e "${YELLOW}⚠️ Some tests may have failed${NC}"

echo ""

# Summary
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  ✅ Deployment Complete!                              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📋 Next steps:${NC}"
echo "  1. Configure pg_cron for reminder scheduler (see docs/CASE_MANAGER_DEPLOYMENT.md)"
echo "  2. Test locally: npm run dev"
echo "  3. Navigate to /app/crm and click 'Manage' on any lead"
echo "  4. Deploy frontend: vercel --prod (or your hosting service)"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  - docs/case-manager.md"
echo "  - docs/CASE_MANAGER_DEPLOYMENT.md"
echo ""
echo -e "${BLUE}🧪 Run E2E tests:${NC}"
echo "  npx playwright test"
echo ""

