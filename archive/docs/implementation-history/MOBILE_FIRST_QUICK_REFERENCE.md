# Mobile-First Quick Reference Guide

**Quick lookup for mobile-first design standards**

---

## 🎯 Core Principles

1. **Mobile-First:** Design for mobile first, then adapt for desktop
2. **Touch-Friendly:** All interactive elements minimum 44x44px
3. **Thumb-Friendly:** Primary actions in bottom half of screen
4. **One-Handed:** Optimize for single-hand use
5. **Fast:** Load quickly on slow networks

---

## 📏 Size Standards

### Touch Targets
```
Minimum:     44x44px  (Apple HIG, Material Design)
Recommended: 48x48px  (Primary actions)
FAB:         56x56px  (Floating action button)
Spacing:     8px minimum between targets
```

### Typography
```
H1 (Mobile):  30px  (1.875rem) - Page titles
H2 (Mobile):  24px  (1.5rem)   - Section titles
H3 (Mobile):  20px  (1.25rem)  - Subsections
Body:         16px  (1rem)     - Minimum readable
Body Small:   14px  (0.875rem) - Use sparingly
```

### Spacing
```
XS:  4px  (0.25rem)  - Tight spacing
SM:  8px  (0.5rem)   - Small spacing
MD:  16px (1rem)     - Default mobile spacing
LG:  24px (1.5rem)    - Large spacing
XL:  32px (2rem)      - Extra large
2XL: 48px (3rem)      - Section spacing
```

### Forms
```
Input Height:     48px minimum
Input Padding:    14px vertical, 16px horizontal
Label Size:       14px (0.875rem)
Error Text:       14px (0.875rem)
Submit Button:    56px height, full-width, sticky bottom
```

### Cards
```
Padding:     16px (mobile), 24px (desktop)
Gap:         16px between cards
Width:       Full-width minus 32px side padding
Min Height:  80px for tappable cards
```

---

## 🎨 Color & Contrast

### Minimum Contrast (WCAG AA)
```
Normal Text:    4.5:1
Large Text:     3:1 (18px+ or 14px+ bold)
UI Components: 3:1
```

### Primary Colors
```
Primary:   #3b82f6 (Blue)
Success:   #16a34a (Green)
Warning:   #ca8a04 (Yellow)
Error:     #dc2626 (Red)
```

---

## 📱 Layout Patterns

### Single Column
```
✅ Use for: All list pages on mobile
✅ Cards: Full-width, 16px padding
✅ Gap: 16px between cards
✅ Scroll: Vertical, infinite scroll preferred
```

### Bottom Sheet
```
✅ Use for: Filters, modals, detail views
✅ Height: 50-90% of screen
✅ Swipe: Down to close
✅ Button: Sticky "Apply" or "Save" at bottom
```

### Sticky Elements
```
✅ Header: Search bar, filters
✅ Bottom: Submit buttons, action bars
✅ Avoid: Sticky sidebars (use bottom sheet instead)
```

### Floating Action Button (FAB)
```
✅ Size: 56x56px
✅ Position: Fixed bottom-right, 16px from edges
✅ Use for: Primary create/add actions
✅ Shadow: Large for elevation
```

---

## 🔘 Button Patterns

### Primary Button
```
Width:     Full-width on mobile
Height:    48px minimum
Padding:   14px vertical, 24px horizontal
Font:      16px, weight 600
Position:  Sticky at bottom for forms
```

### Secondary Button
```
Width:     Full-width on mobile
Height:    48px minimum
Style:     Outlined (border, transparent background)
```

### FAB (Floating Action Button)
```
Size:      56x56px
Position:  Fixed bottom-right
Icon:      24x24px, white
Shadow:    Large elevation
```

---

## 📝 Form Patterns

### Input Field
```
Height:     48px minimum
Padding:    14px vertical, 16px horizontal
Border:     2px solid #e2e8f0
Radius:     8px (0.5rem)
Focus:      Primary border, shadow ring
```

### Label
```
Size:       14px (0.875rem)
Weight:     500
Position:   Above input
Spacing:    8px below label
```

### Error Message
```
Size:       14px (0.875rem)
Color:      Error red
Position:   Above input (not below) on mobile
Spacing:    4px margin-top
```

### Submit Button
```
Position:   Sticky at bottom of screen
Width:      Full-width
Height:     56px minimum
Style:      Primary button
Always:     Visible while scrolling
```

---

## 🎴 Card Patterns

### Standard Card
```
Padding:     16px (mobile)
Border:      1px solid #e2e8f0
Radius:      16px (1rem)
Shadow:      Soft shadow, elevates on tap
Width:       Full-width minus 32px side padding
Min Height:  80px for tappable cards
```

### List Card (Mobile)
```
Layout:     Single column
Spacing:    16px between cards
Content:    Key info visible, details expandable
Actions:    Swipe gestures or bottom action bar
```

---

## 🔍 Filter & Search

### Search Bar
```
Position:   Sticky at top
Height:     48px minimum
Padding:    12px horizontal
Icon:       44x44px touch target
Clear:      "X" button, 44x44px
```

### Filters
```
Pattern:    Bottom sheet (not sidebar)
Trigger:    Filter icon in search bar (44x44px)
Height:     50-80% of screen
Actions:    "Apply Filters" button sticky at bottom
```

---

## 📊 Data Display

### Metrics Cards
```
Layout:     Horizontal scrollable on mobile
Card Size:  Min 200px width, full height
Spacing:    16px between cards
Scroll:     Horizontal with indicators
```

### Charts
```
Type:       Simplified for mobile
Size:       Readable on small screens
Labels:     Minimum 12px font
Legend:     Below chart or collapsible
```

---

## ⚡ Performance

### Loading States
```
Pattern:    Skeleton screens (not spinners)
Layout:     Single-column cards
Animation:  Subtle pulse
Count:      Show 3-5 skeleton cards
```

### Empty States
```
Illustration: Max 200px height
Text:         Large, readable (18px+)
CTA:          Full-width button, min 48px height
Spacing:      Generous (48px+ between elements)
```

---

## 🎯 Common Patterns

### List Page (Mobile)
```
1. Sticky search bar at top
2. Filter icon (44x44px) in search bar
3. Single-column card list
4. Infinite scroll (not pagination)
5. Pull-to-refresh at top
6. FAB for "Add" action (if applicable)
```

### Detail Page (Mobile)
```
1. Header with back button (44x44px)
2. Title and key info
3. Scrollable content sections
4. Sticky action bar at bottom
5. Primary actions always accessible
```

### Form Page (Mobile)
```
1. Single-column layout
2. Full-width inputs (48px height)
3. Labels above inputs
4. Error messages above inputs
5. Sticky submit button at bottom
6. Keyboard-optimized inputs
```

---

## ✅ Quick Checks

Before shipping mobile features, verify:

- [ ] All touch targets ≥ 44x44px
- [ ] All buttons full-width on mobile
- [ ] Forms have sticky submit buttons
- [ ] Filters use bottom sheets
- [ ] Cards use single-column layout
- [ ] Text is minimum 16px
- [ ] Spacing uses 16px base unit
- [ ] Tested on real mobile device
- [ ] Works one-handed
- [ ] Loads < 3 seconds on 3G

---

## 📚 Reference Documents

- **Full Review:** `UI_UX_REVIEW.md`
- **Executive Summary:** `UI_UX_EXECUTIVE_SUMMARY.md`
- **Implementation Checklist:** `MOBILE_FIRST_CHECKLIST.md`
- **This Guide:** `MOBILE_FIRST_QUICK_REFERENCE.md`

---

**Last Updated:** December 2024

