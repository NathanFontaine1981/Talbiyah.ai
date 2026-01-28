# Talbiyah.ai ChooseCourse Page — Comprehensive Audit

**Audit Date:** January 2026
**File:** `src/pages/ChooseCourse.tsx`
**Lines:** ~185
**Overall Grade:** A- (88/100) - UPDATED after fixes

---

## Fixes Completed

1. **Add skip link** - Skip to course selection for accessibility
2. **Add main element wrapper** - `<main id="main-content">` for semantic structure
3. **Add aria-label to back button** - "Go back to home"

---

## Executive Summary

The ChooseCourse page presents Qur'an and Arabic courses with Book Now and Learn More CTAs. Similar to SubjectSelection but with slightly different styling and navigation.

**What's Working:**
- Clean course card layout
- Featured badge for popular course
- Coming Soon state for unavailable courses
- Free taster session messaging
- Browse All Teachers fallback

**What Needed Improvement:**
- No skip link for accessibility
- No `<main>` element wrapper
- Back button missing aria-label

---

## Section-by-Section Audit

### 1. Navigation
**Grade: A (90/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Fixed header with branding |
| Navigation | A | Back to home |
| Accessibility | A | Now has aria-label |

---

### 2. Hero Section
**Grade: A (90/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Clean header |
| Messaging | A | Free taster emphasis |
| Accessibility | A | Good heading structure |

---

### 3. Course Cards
**Grade: A- (85/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Clean cards |
| CTAs | A | Book Now, Learn More |
| Accessibility | A | Good structure |

---

### 4. Footer CTA
**Grade: A (90/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Browse all fallback |
| Messaging | A | Helpful |
| Accessibility | A | Good button |

---

## Final Verdict

The ChooseCourse page has clean course selection with value proposition. All accessibility gaps have been addressed with skip link, main wrapper, and aria-label.

**Bottom line:** All accessibility improvements implemented. Page now at A- (88%) grade.

---

*Audit completed. All fixes implemented.*
