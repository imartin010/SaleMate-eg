#!/bin/bash

# Deploy all Case Manager Edge Functions
# Run this after database migrations

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🚀 Deploying Case Manager Edge Functions             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}❌ Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}📤 Deploying Edge Functions...${NC}\n"

FUNCTIONS=(
    "notify-user"
    "case-coach"
    "case-chat"
    "case-stage-change"
    "case-actions"
    "case-face-change"
    "inventory-matcher"
    "reminder-scheduler"
)

SUCCESS=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo -e "${BLUE}Deploying ${func}...${NC}"
    if supabase functions deploy "$func" 2>&1 | tee /tmp/deploy-${func}.log; then
        echo -e "${GREEN}✅ ${func} deployed${NC}\n"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${YELLOW}⚠️ ${func} failed${NC}\n"
        FAILED=$((FAILED + 1))
    fi
done

# Set OpenAI secret
echo -e "${BLUE}🔑 Setting OpenAI API key secret...${NC}"

# Try to extract from env.example
if [ -f "env.example" ]; then
    OPENAI_KEY=$(grep VITE_OPENAI_API_KEY env.example | cut -d '=' -f2-)
    if [ -n "$OPENAI_KEY" ]; then
        echo "   Found key in env.example"
        if supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"; then
            echo -e "${GREEN}✅ OpenAI API key set${NC}\n"
        else
            echo -e "${YELLOW}⚠️ Failed to set secret. Run manually:${NC}"
            echo "   supabase secrets set OPENAI_API_KEY=your-key"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ Set OpenAI key manually:${NC}"
    echo "   supabase secrets set OPENAI_API_KEY=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"
fi

# Summary
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  📊 Deployment Summary                                ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Successful: $SUCCESS${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Failed: $FAILED${NC}"
fi
echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo "  1. Verify deployment: supabase functions list"
echo "  2. Check secrets: supabase secrets list"
echo "  3. Test locally: npm run dev"
echo "  4. Navigate to /app/crm/case/[lead-id]"
echo ""

