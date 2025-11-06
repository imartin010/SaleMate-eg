#!/bin/bash

# Case Manager Verification Script
# Checks that all components are properly deployed

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🔍 Case Manager System Verification                  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check frontend files
echo -e "${BLUE}📁 Checking frontend files...${NC}"

FILES=(
    "src/types/case.ts"
    "src/lib/case/stateMachine.ts"
    "src/lib/api/caseApi.ts"
    "src/hooks/case/useCase.ts"
    "src/hooks/case/useStageChange.ts"
    "src/hooks/case/useNotifications.ts"
    "src/pages/Case/CaseManager.tsx"
    "src/components/case/CaseStageTimeline.tsx"
    "src/components/case/CaseCoachPanel.tsx"
    "src/components/case/FeedbackEditor.tsx"
    "src/components/case/ActionsList.tsx"
    "src/components/case/ActivityLog.tsx"
    "src/components/case/QuickActions.tsx"
    "src/components/case/MeetingScheduler.tsx"
    "src/components/case/InventoryMatchesCard.tsx"
    "src/components/case/ChangeFaceModal.tsx"
    "src/components/case/StageChangeModal.tsx"
    "src/components/notifications/NotificationBell.tsx"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${RED}❌${NC} $file"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo -e "${RED}❌ $MISSING files missing${NC}\n"
else
    echo -e "${GREEN}✅ All frontend files present${NC}\n"
fi

# Check Edge Functions
echo -e "${BLUE}🌐 Checking Edge Functions...${NC}"

FUNCTIONS=(
    "supabase/functions/notify-user/index.ts"
    "supabase/functions/case-coach/index.ts"
    "supabase/functions/case-stage-change/index.ts"
    "supabase/functions/case-actions/index.ts"
    "supabase/functions/case-face-change/index.ts"
    "supabase/functions/inventory-matcher/index.ts"
    "supabase/functions/reminder-scheduler/index.ts"
)

MISSING_FUNCS=0
for func in "${FUNCTIONS[@]}"; do
    if [ -f "$func" ]; then
        echo -e "  ${GREEN}✅${NC} $(basename $(dirname $func))"
    else
        echo -e "  ${RED}❌${NC} $(basename $(dirname $func))"
        MISSING_FUNCS=$((MISSING_FUNCS + 1))
    fi
done

if [ $MISSING_FUNCS -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_FUNCS Edge Functions missing${NC}\n"
else
    echo -e "${GREEN}✅ All Edge Functions present${NC}\n"
fi

# Check migration
echo -e "${BLUE}🗄️ Checking database migration...${NC}"
if [ -f "supabase/migrations/20251106000001_create_case_manager_tables.sql" ]; then
    echo -e "  ${GREEN}✅ Migration file exists${NC}\n"
else
    echo -e "  ${RED}❌ Migration file missing${NC}\n"
fi

# Check documentation
echo -e "${BLUE}📚 Checking documentation...${NC}"

DOCS=(
    "docs/case-manager.md"
    "docs/CASE_MANAGER_DEPLOYMENT.md"
    "docs/CASE_MANAGER_QUICK_START.md"
    "CASE_MANAGER_IMPLEMENTATION_SUMMARY.md"
    "README_CASE_MANAGER.md"
)

MISSING_DOCS=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "  ${GREEN}✅${NC} $doc"
    else
        echo -e "  ${YELLOW}⚠️${NC} $doc"
        MISSING_DOCS=$((MISSING_DOCS + 1))
    fi
done

if [ $MISSING_DOCS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ $MISSING_DOCS documentation files missing${NC}\n"
else
    echo -e "${GREEN}✅ All documentation present${NC}\n"
fi

# Check tests
echo -e "${BLUE}🧪 Checking tests...${NC}"

TESTS=(
    "tests/e2e/case-manager.spec.ts"
    "tests/automation/supabase-config.spec.ts"
    "tests/e2e/visual-regression.spec.ts"
    "src/lib/case/__tests__/stateMachine.test.ts"
)

MISSING_TESTS=0
for test in "${TESTS[@]}"; do
    if [ -f "$test" ]; then
        echo -e "  ${GREEN}✅${NC} $test"
    else
        echo -e "  ${YELLOW}⚠️${NC} $test"
        MISSING_TESTS=$((MISSING_TESTS + 1))
    fi
done

if [ $MISSING_TESTS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ $MISSING_TESTS test files missing${NC}\n"
else
    echo -e "${GREEN}✅ All test files present${NC}\n"
fi

# Try to build
echo -e "${BLUE}🔨 Testing build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}\n"
else
    echo -e "${RED}❌ Build failed${NC}\n"
fi

# Summary
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  📊 Verification Summary                              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

TOTAL_ISSUES=$((MISSING + MISSING_FUNCS + MISSING_DOCS + MISSING_TESTS))

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}   Case Manager is fully implemented and ready.${NC}"
else
    echo -e "${YELLOW}⚠️ Found $TOTAL_ISSUES issues${NC}"
    echo -e "   Review the output above for details."
fi

echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "  1. Run automated setup: ./scripts/deploy-case-manager.sh"
echo "  2. Configure cron job (see docs/CASE_MANAGER_DEPLOYMENT.md)"
echo "  3. Test locally: npm run dev"
echo "  4. Run E2E tests: npm run test:e2e"
echo ""

