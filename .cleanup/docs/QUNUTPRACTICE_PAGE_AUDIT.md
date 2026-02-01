# Talbiyah.ai QunutPractice Page — Comprehensive Audit

**Audit Date:** January 2026
**File:** `src/pages/QunutPractice.tsx`
**Lines:** ~750
**Overall Grade:** A- (88/100) - UPDATED after fixes

---

## Fixes Completed

1. **Add skip link** - Skip to dua content for accessibility
2. **Add id to main element** - `id="main-content"` for skip link target
3. **Add aria-pressed to mode toggles** - Full View and Line by Line buttons
4. **Add aria-expanded to note toggles** - Show/hide explanation buttons
5. **Add aria-label to progress dots** - Line navigation with current/completed states
6. **Add aria-label to play line buttons** - Clear audio button labels

---

## Executive Summary

The QunutPractice page teaches users the Qunut dua for Witr prayer with Arabic text, transliteration, translation, audio playback, and PDF download. Good learning features but needs accessibility improvements.

**What's Working:**
- Full view and line-by-line modes
- Audio playback for full dua or individual lines
- PDF download functionality
- Toggle options (transliteration, translation, salawat)
- Progress indicators in line-by-line mode
- Expandable explanation notes
- Has `<main>` element already

**What Needs Improvement:**
- No skip link for accessibility
- Mode toggle buttons missing aria-pressed
- Note toggle buttons missing aria-expanded
- Progress dots missing accessible labels
- Play line buttons could use better aria-labels

---

## Section-by-Section Audit

### 1. Header
**Grade: B+ (80/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Clean dark theme |
| Navigation | A | Back button |
| Accessibility | C | No skip link |

---

### 2. Mode Toggle
**Grade: B (76/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Clear toggle buttons |
| Functionality | A | Switches modes |
| Accessibility | C | Missing aria-pressed |

---

### 3. Expandable Notes
**Grade: B- (72/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Clean toggle |
| Interaction | A | Show/hide explanation |
| Accessibility | D | Missing aria-expanded |

---

### 4. Line-by-Line Progress
**Grade: B- (72/100)**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Design | A | Nice dot indicators |
| Navigation | A | Click to jump |
| Accessibility | D | Dots need aria-labels |

---

## Priority Action Items

### Immediate (Critical)
1. **Add skip link** — Accessibility requirement
2. **Add id to main element** — For skip link target

### High Priority
3. **Add aria-pressed to mode toggles** — Button state indication
4. **Add aria-expanded to note toggles** — Expandable accessibility
5. **Add aria-label to progress dots** — Screen reader support
6. **Add aria-label to play line buttons** — Clarity

---

## Final Verdict

The QunutPractice page has excellent learning functionality with audio and PDF features. All accessibility gaps have been addressed with skip link, aria-pressed for mode toggles, aria-expanded for notes, and proper aria-labels.

**Bottom line:** All accessibility improvements implemented. Page now at A- (88%) grade.

---

*Audit completed. Ready for implementation.*
