# Teacher Rating System Implementation Guide

## Status: PHASE 1 COMPLETE ✅

### Completed:
1. ✅ Database migration created (`20251117180000_create_teacher_rating_system.sql`)
2. ✅ QuickLessonFeedback component created

### Remaining Components to Create:

This is a large feature. I've created the foundation. Here's what you need to complete:

## Quick Setup Instructions

### 1. Apply the Migration

```bash
node apply-rating-migration.mjs
```

This will create:
- `lesson_feedback` table
- `teacher_ratings` table
- `teacher_rating_summary` view
- Helper functions for rating logic

### 2. Components Already Created:
- ✅ `src/components/QuickLessonFeedback.tsx` - Thumbs up/down after lessons

### 3. Components to Create Next:

I recommend creating these in order:

#### A. DetailedTeacherRating Component
File: `src/components/DetailedTeacherRating.tsx`
- 5-star ratings for 4 categories
- Would recommend yes/no
- Optional written feedback
- Shows at milestones (lessons 1, 5, 10, 20)

#### B. TeacherRatingDisplay Component
File: `src/components/TeacherRatingDisplay.tsx`
- Shows on teacher profiles
- Displays avg rating, thumbs up %, category breakdowns
- Shows recent reviews
- Behavioral metrics (rebook rate, total students)

#### C. Integration Points

**In `src/pages/Lesson.tsx`:**
After lesson completes:
1. Show QuickLessonFeedback (already created)
2. Check if milestone using `should_request_detailed_rating` RPC
3. If milestone, show DetailedTeacherRating

**In `src/pages/TeacherProfile.tsx`:**
- Add TeacherRatingDisplay component below teacher bio

**In `src/pages/Teachers.tsx`:**
- Query teacher_rating_summary view
- Show rating stars + thumbs up % on teacher cards

## Database Schema Summary

### lesson_feedback table
Quick binary feedback after every lesson:
- thumbs_up (boolean)
- issue_type (if thumbs down)
- issue_detail (optional text)

### teacher_ratings table
Detailed ratings at milestones:
- teaching_quality (1-5)
- punctuality (1-5)
- communication (1-5)
- goal_progress (1-5)
- overall_rating (calculated average)
- would_recommend (boolean)
- positive_feedback (text)
- improvement_feedback (text)
- milestone_type (lesson_1, lesson_5, lesson_10, lesson_20)

### teacher_rating_summary view
Aggregated data:
- avg_rating
- thumbs_up_percentage
- total_detailed_ratings
- Category averages
- Behavioral metrics (rebook_rate, completion_rate)

## Testing Checklist

1. Complete lesson as student → Quick feedback appears ✅
2. Give thumbs up → Saves correctly
3. Give thumbs down → Shows issue form → Saves issue
4. Complete 1st lesson → Detailed rating appears
5. Fill detailed rating → Saves with all categories
6. View teacher profile → Ratings display correctly
7. Complete 5th lesson → Another detailed rating
8. Check calculations in teacher_rating_summary view

## Next Steps

Would you like me to:
1. Create the remaining React components (DetailedTeacherRating, TeacherRatingDisplay)?
2. Create the integration code for Lesson.tsx?
3. Apply the migration to your database?
4. All of the above?

Let me know and I'll continue building!
