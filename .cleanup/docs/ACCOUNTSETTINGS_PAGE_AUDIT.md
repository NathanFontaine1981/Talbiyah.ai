# Talbiyah.ai Account Settings Page — Comprehensive Audit

**Audit Date:** January 2026
**File:** `src/pages/AccountSettings.tsx`
**Lines:** ~870
**Overall Grade:** A- (88/100) - UPDATED after fixes

---

## Fixes Completed

1. **Add skip link** - Skip to settings for accessibility
2. **Add main element wrapper** - `id="main-content"` for skip link target
3. **Add aria-live to messages** - Error (`role="alert"`) and success (`role="status"`)
4. **Add htmlFor to all form labels** - Full name, email, DOB, location, timezone, about, passwords
5. **Fix file input accessibility** - Proper `id`/`htmlFor` with `sr-only` class
6. **Add password visibility toggles** - Eye icons for both password fields
7. **Fix notification toggle accessibility** - `role="switch"`, `aria-checked`, `aria-label`
8. **Add skeleton loading state** - Full page skeleton with nav and cards

---

## Executive Summary

The Account Settings page handles user profile management with multiple sections for profile, personal details, password, notifications, and teacher-specific settings. It has good functionality but needs accessibility improvements.

**What's Working:**
- Multiple organized sections (Profile, Personal, Password, etc.)
- Avatar upload with preview
- Password change with validation
- Email notification toggle
- Teacher-specific sections (education, interests, video intro)
- Form validation and error handling
- Success/error messages
- Dark mode support

**What Needs Improvement:**
- No skip link for accessibility
- No `<main>` element wrapper
- Basic loading state (no skeleton)
- Error/success messages not in live regions
- Form labels not using htmlFor
- Password fields missing visibility toggle
- Hidden file input accessibility
- Notification toggle accessibility

---

## Section-by-Section Audit

### 1. Navigation Header
**Grade: B+ (80/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A- | Clean, branded |
| Navigation | B+ | Back to dashboard |
| Accessibility | C | No skip link |

---

### 2. Profile Information Form
**Grade: B (76/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Fields | A | Name, avatar |
| Avatar Upload | B | Works but accessibility poor |
| Validation | B+ | Required field |
| Accessibility | C | Labels missing htmlFor |

**Issues:**
1. File input has no accessible label
2. Form fields missing id/htmlFor association

---

### 3. Personal Details Form
**Grade: B (75/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Fields | A | DOB, location, timezone, bio |
| Layout | A- | Good grid |
| Accessibility | C | Labels missing htmlFor |

---

### 4. Password Change Form
**Grade: B- (72/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Validation | B+ | Length, match checks |
| Security | B | Basic requirements |
| Accessibility | C | No visibility toggle |

**Issues:**
1. No password visibility toggle (added in SignUp)
2. No password strength indicator

---

### 5. Email Notifications
**Grade: B (76/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A- | Nice toggle switch |
| Description | A | Clear explanation |
| Accessibility | C | Toggle needs proper labeling |

---

### 6. Loading State
**Grade: C+ (68/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Current | C | Basic spinner |
| Skeleton | F | No skeleton loaders |

---

## Technical Issues

### Accessibility Gaps

1. **No skip link** - Users must tab through nav
2. **No main element** - Missing semantic wrapper
3. **Form labels** - Missing htmlFor/id association
4. **Messages** - Error/success need aria-live
5. **File input** - Hidden input needs proper label
6. **Toggle switch** - Needs aria-label

### UX Issues

1. **No password visibility toggle** - Harder to enter passwords
2. **No form progress** - Long page with no navigation
3. **No unsaved changes warning** - Could lose data

---

## Priority Action Items

### Immediate (Critical)
1. **Add skip link** — Accessibility requirement
2. **Add main element wrapper** — Semantic HTML
3. **Add aria-live to messages** — Screen reader support

### High Priority
4. **Add htmlFor to all labels** — Form accessibility
5. **Add password visibility toggle** — UX improvement
6. **Add skeleton loading** — Better perceived performance
7. **Fix file input accessibility** — Proper labeling

### Medium Priority
8. **Add toggle switch aria-label** — Accessibility
9. **Add form section anchors** — Navigation
10. **Add unsaved changes warning** — UX

### Low Priority
11. **Add password strength indicator** — Security UX
12. **Add timezone dropdown** — Better UX than text input

---

## Recommended Changes

### 1. Skip Link (Add at start of return)
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
>
  Skip to settings
</a>
```

### 2. Main Element Wrapper
```tsx
<main id="main-content" className="max-w-5xl mx-auto px-6 py-8">
```

### 3. Error/Success Messages
```tsx
{error && (
  <div className="..." role="alert" aria-live="assertive">
    <p className="text-red-800 text-sm">{error}</p>
  </div>
)}

{successMessage && (
  <div className="..." role="status" aria-live="polite">
    ...
  </div>
)}
```

### 4. Form Label Association
```tsx
<label htmlFor="full_name" className="...">
  Full Name
</label>
<input
  id="full_name"
  type="text"
  ...
/>
```

### 5. File Input Accessibility
```tsx
<label
  htmlFor="avatar-upload"
  className="... cursor-pointer"
>
  <Upload className="w-4 h-4" />
  <span>Change Photo</span>
  <input
    id="avatar-upload"
    type="file"
    accept="image/*"
    onChange={handleAvatarChange}
    className="sr-only"
  />
</label>
```

---

## Final Verdict

The Account Settings page has good functionality with multiple well-organized sections. The main gaps are in **accessibility** (skip link, form labels, ARIA) and **UX** (no password visibility toggle). The loading state could also be improved.

**Bottom line:** Add accessibility fixes (skip link, htmlFor, aria-live) as priority. Add password visibility toggle for better UX.

---

*Audit completed. Ready for implementation.*
