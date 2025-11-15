# Mobile-First Implementation Checklist

**Use this checklist when implementing mobile-first improvements**

---

## ✅ Phase 1: Mobile Foundation (Weeks 1-3)

### Touch Targets
- [ ] Audit all buttons - ensure minimum 44x44px
- [ ] Audit all icons - ensure minimum 44x44px touch area
- [ ] Audit all checkboxes/radios - ensure minimum 44x44px
- [ ] Audit all links - ensure minimum 44x44px
- [ ] Fix spacing between touch targets (minimum 8px)

### Layouts
- [ ] Convert CRM table to card view on mobile
- [ ] Convert Admin tables to card views on mobile
- [ ] Convert Deals table to card view on mobile
- [ ] Convert Team list to card view on mobile
- [ ] Ensure single-column layout on all list pages
- [ ] Standardize card spacing (16px padding, 16px gaps)
- [ ] Ensure full-width cards (100% minus 32px side padding)

### Forms
- [ ] Update all inputs to minimum 48px height
- [ ] Make all form inputs full-width on mobile
- [ ] Add sticky submit buttons at bottom of forms
- [ ] Optimize keyboard types (numeric, email, tel)
- [ ] Position error messages above inputs (not below)
- [ ] Ensure form labels are minimum 14px

### Navigation
- [ ] Implement bottom sheet for CRM filters
- [ ] Implement bottom sheet for Shop filters
- [ ] Implement bottom sheet for Inventory filters
- [ ] Implement bottom sheet for Deals filters
- [ ] Implement bottom sheet for Admin filters
- [ ] Add bottom sheet navigation for Admin panel
- [ ] Create consistent bottom action bars

### Empty States
- [ ] Create mobile-optimized empty state component
- [ ] Add to Dashboard
- [ ] Add to CRM
- [ ] Add to Shop
- [ ] Add to Deals
- [ ] Add to Team
- [ ] Add to Inventory
- [ ] Ensure illustrations max 200px height
- [ ] Ensure CTA buttons full-width, min 48px height

### Loading States
- [ ] Create mobile skeleton card component
- [ ] Replace spinners with skeletons on Dashboard
- [ ] Replace spinners with skeletons on CRM
- [ ] Replace spinners with skeletons on Admin tables
- [ ] Replace spinners with skeletons on Shop
- [ ] Ensure single-column skeleton layout

---

## ✅ Phase 2: Design System & Patterns (Weeks 4-6)

### Design System
- [ ] Document mobile-first color palette
- [ ] Document mobile typography scale (min 16px body)
- [ ] Create mobile-first button component library
- [ ] Document mobile spacing scale (16px base)
- [ ] Create component library with mobile examples
- [ ] Test color contrast for WCAG AA compliance

### Filter/Search
- [ ] Create reusable bottom sheet filter component
- [ ] Standardize search bar (sticky at top, filter icon)
- [ ] Add pull-to-refresh to CRM
- [ ] Add pull-to-refresh to Shop
- [ ] Add pull-to-refresh to Inventory
- [ ] Add pull-to-refresh to Deals
- [ ] Add pull-to-refresh to Team

### Action Patterns
- [ ] Create FAB component
- [ ] Add FAB to CRM (Add Lead)
- [ ] Add FAB to Shop (if applicable)
- [ ] Add FAB to Team (Invite Member)
- [ ] Add FAB to Admin pages (Create actions)
- [ ] Create sticky bottom action bar component
- [ ] Implement swipe gestures for quick actions
- [ ] Add bulk selection patterns

### Data Visualization
- [ ] Create horizontal scrollable metric cards
- [ ] Optimize charts for mobile (simplified, readable)
- [ ] Add mobile-friendly date range pickers (bottom sheet)
- [ ] Implement mobile dashboard patterns
- [ ] Test charts on various screen sizes

### Testing
- [ ] Test on iPhone (various sizes)
- [ ] Test on Android (various sizes)
- [ ] Test on tablets
- [ ] Test one-handed usability
- [ ] Test on slow networks (3G)
- [ ] Verify touch target sizes
- [ ] Verify spacing consistency
- [ ] Test with screen readers

---

## ✅ Phase 3: Advanced Features (Weeks 8-12)

### Advanced Patterns
- [ ] Implement swipe gestures on CRM cards
- [ ] Implement swipe gestures on Shop cards
- [ ] Implement swipe gestures on Deals cards
- [ ] Add haptic feedback for key actions
- [ ] Create mobile-optimized image galleries (swipeable)
- [ ] Add voice input for search (where applicable)
- [ ] Implement offline support

### Performance
- [ ] Implement virtual scrolling for mobile lists
- [ ] Optimize image loading (lazy load, responsive)
- [ ] Reduce bundle size for mobile
- [ ] Implement PWA features
- [ ] Optimize for slow mobile networks
- [ ] Test page load times (<3s on 3G)

### Accessibility
- [ ] WCAG 2.1 AA compliance audit
- [ ] Screen reader optimization
- [ ] Voice control support
- [ ] High contrast mode support
- [ ] Mobile accessibility testing

### Mobile-Specific Features
- [ ] Biometric authentication (Face ID/Touch ID)
- [ ] Camera integration for file uploads
- [ ] Location services (if applicable)
- [ ] Push notifications
- [ ] Mobile app-like experience (PWA)

### User Testing
- [ ] Conduct mobile user testing sessions
- [ ] Test on various devices and screen sizes
- [ ] Gather mobile-specific feedback
- [ ] A/B test mobile flows
- [ ] Iterate based on mobile usage data

---

## 📋 Quick Reference: Mobile Standards

### Touch Targets
- **Minimum:** 44x44px
- **Recommended:** 48x48px for primary actions
- **Spacing:** Minimum 8px between targets

### Typography
- **Body Text:** Minimum 16px
- **Headings:** 20px (H3), 24px (H2), 30px (H1)
- **Line Height:** 1.6 for body, 1.2-1.4 for headings

### Spacing
- **Base Unit:** 16px
- **Page Padding:** 16px sides
- **Card Gap:** 16px between cards
- **Section Spacing:** 24px between sections

### Buttons
- **Primary:** Full-width, minimum 48px height
- **Secondary:** Full-width, minimum 48px height
- **FAB:** 56x56px, fixed bottom-right

### Forms
- **Input Height:** Minimum 48px
- **Input Padding:** 14px vertical, 16px horizontal
- **Submit Button:** Sticky at bottom, full-width, min 56px height

### Cards
- **Padding:** 16px (mobile), 24px (desktop)
- **Width:** Full-width minus 32px side padding
- **Height:** Minimum 80px for tappable cards
- **Gap:** 16px between cards

---

## 🎯 Priority Guide

### Must Have (Phase 1)
- Touch target compliance
- Mobile card layouts
- Bottom sheet filters
- Mobile form optimization

### Should Have (Phase 2)
- Design system
- Consistent patterns
- Mobile testing
- Performance optimization

### Nice to Have (Phase 3)
- Advanced gestures
- PWA features
- Biometric auth
- Offline support

---

**Last Updated:** December 2024  
**Reference:** See `UI_UX_REVIEW.md` for detailed recommendations

