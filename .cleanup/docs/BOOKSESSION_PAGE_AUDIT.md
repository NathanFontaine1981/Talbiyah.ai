# Talbiyah.ai BookSession Page — Comprehensive Audit

**Audit Date:** January 2026
**File:** `src/pages/BookSession.tsx`
**Lines:** ~845
**Overall Grade:** A- (88/100) - UPDATED after fixes

---

## Fixes Completed

1. **Add skip link** - Skip to booking for accessibility
2. **Add main element wrapper** - `id="main-content"` for skip link target
3. **Add ARIA to step indicator** - `aria-current="step"`, proper `ol`/`li` structure, sr-only text
4. **Add ARIA to cart sidebar** - `aside` element with `aria-label`
5. **Add trust indicator** - "Secure checkout powered by Stripe" with Shield icon
6. **Add aria-pressed to time slots** - Toggle state for screen readers
7. **Add skeleton loading state** - Full page skeleton for initial load

---

## Executive Summary

The BookSession page is the critical conversion funnel where users book lessons. It has a good multi-step flow with cart functionality. However, it's missing accessibility features and some trust/conversion elements.

**What's Working:**
- Multi-step booking flow (Subject → Teacher → Time)
- Shopping cart sidebar with real-time pricing
- Duration selection (30/60 min)
- Week navigation for time slots
- Legacy student support with different pricing
- Promo code functionality
- Block booking discount display
- Time slot grid with availability

**What Needs Improvement:**
- No skip link for accessibility
- No `<main>` element wrapper
- Loading state is basic spinner (no skeleton)
- Steps not accessible (no aria-current)
- Time slots missing aria-pressed
- Clear Cart uses browser confirm()
- Cart sidebar has no ARIA labels
- No trust indicators (secure checkout)

---

## Section-by-Section Audit

### 1. Header & Navigation
**Grade: B (75/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | B+ | Clean, minimal |
| Back Button | A- | Context-aware navigation |
| Accessibility | C | No skip link |

---

### 2. Step Progress Indicator
**Grade: B- (72/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Visual | A- | Clear step indicators |
| Labels | B+ | Good step descriptions |
| Accessibility | D | No aria-current, no role |

**Issues:**
1. No `role="navigation"` or step list
2. No `aria-current="step"` for active step
3. Steps not keyboard navigable

---

### 3. Teacher Selection (Step 2)
**Grade: B+ (80/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Cards | A- | Good teacher info |
| Empty State | B | Basic message |
| Accessibility | B | Button-based selection |

---

### 4. Time Slot Selection (Step 3)
**Grade: B (75/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Grid Layout | A- | Clear 7-day view |
| Slot Buttons | B | Could be clearer |
| Accessibility | C | Missing aria-pressed |
| Loading | B | Has spinner but no skeleton |

**Issues:**
1. Time slot buttons should have `aria-pressed` for selected state
2. No skeleton loading for slot grid
3. Small touch targets on mobile

---

### 5. Shopping Cart Sidebar
**Grade: B (76/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Pricing | A | Clear breakdown |
| Promo Code | A- | Works well |
| Clear Cart | D | Uses browser confirm() |
| Accessibility | C | No ARIA labels |

**Issues:**
1. `confirm()` should be custom modal
2. Cart section needs `aria-label`
3. No live region for price updates

---

### 6. Loading States
**Grade: C+ (68/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Initial Load | C | Basic spinner |
| Slot Loading | B | Has spinner message |
| Skeleton | F | No skeleton loaders |

---

## Technical Issues

### Accessibility Gaps

1. **No skip link** - Users must tab through header
2. **No main element** - Missing semantic wrapper
3. **Steps not accessible** - No ARIA roles/states
4. **Time slots** - Missing aria-pressed
5. **Cart sidebar** - No ARIA labels

### UX Issues

1. **confirm() for Clear Cart** - Jarring native dialog
2. **No trust indicators** - Missing secure checkout badge
3. **No save progress** - Selection could be lost

---

## Priority Action Items

### Immediate (Critical)
1. **Add skip link** — Accessibility requirement
2. **Add main element wrapper** — Semantic HTML
3. **Add ARIA to step indicator** — `aria-current="step"`

### High Priority
4. **Add aria-pressed to time slots** — Selected state
5. **Add ARIA label to cart sidebar** — Screen reader support
6. **Add skeleton loading** — Better perceived performance
7. **Add trust indicator** — Secure checkout badge

### Medium Priority
8. **Replace confirm() with custom modal** — Better UX
9. **Add aria-live to cart total** — Announce price changes
10. **Improve step accessibility** — Role and labels

### Low Priority
11. **Add progress persistence** — Save to localStorage
12. **Add keyboard shortcuts** — Power user feature

---

## Recommended Changes

### 1. Skip Link (Add at start of return)
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
>
  Skip to booking
</a>
```

### 2. Main Element Wrapper
```tsx
<main id="main-content" className="max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
```

### 3. Step Indicator ARIA
```tsx
<nav aria-label="Booking progress">
  <ol className="flex items-center justify-center space-x-4">
    {steps.map((step, index) => (
      <li key={step.number} className="flex items-center" aria-current={currentStep === step.number ? 'step' : undefined}>
```

### 4. Time Slot Accessibility
```tsx
<button
  onClick={() => handleSelectTimeSlot(slot)}
  disabled={!slot.available}
  aria-pressed={isInCart}
  aria-label={`${format(slot.time, 'h:mm a')} on ${format(slot.time, 'EEEE, MMMM d')}${isInCart ? ', selected' : ''}`}
  className={...}
>
```

### 5. Cart ARIA
```tsx
<aside className="..." aria-label="Shopping cart" aria-live="polite">
```

### 6. Trust Indicator (after cart header)
```tsx
<div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
  <Shield className="w-4 h-4 text-emerald-500" />
  <span>Secure checkout</span>
</div>
```

---

## Final Verdict

The BookSession page has solid functionality but needs accessibility improvements. The multi-step flow works well, but screen reader users would struggle with the current implementation. The loading states could also be improved with skeletons.

**Bottom line:** Add accessibility fixes (skip link, ARIA labels, aria-pressed) as priority. Consider adding trust indicators near the checkout button to improve conversion.

---

*Audit completed. Ready for implementation.*
