# Talbiyah.ai Recruitment Master Manual

**Version 1.0 | February 2026**

---

## Table of Contents

1. [Overview](#1-overview)
2. [The Recruitment Pipeline at a Glance](#2-the-recruitment-pipeline-at-a-glance)
3. [Step 1 — Source Prospects](#3-step-1--source-prospects)
4. [Step 2 — Move Prospect into Pipeline](#4-step-2--move-prospect-into-pipeline)
5. [Step 3 — Manage Candidates in the Pipeline](#5-step-3--manage-candidates-in-the-pipeline)
6. [Step 4 — Schedule an Interview](#6-step-4--schedule-an-interview)
7. [Step 5 — Candidate Books Their Slot](#7-step-5--candidate-books-their-slot)
8. [Step 6 — Conduct the Interview](#8-step-6--conduct-the-interview)
9. [Step 7 — Generate AI Summary](#9-step-7--generate-ai-summary)
10. [Step 8 — Verify Documents](#10-step-8--verify-documents)
11. [Step 9 — Trial Lesson (Optional)](#11-step-9--trial-lesson-optional)
12. [Step 10 — Approve the Candidate](#12-step-10--approve-the-candidate)
13. [Step 11 — Create Teacher Account](#13-step-11--create-teacher-account)
14. [Step 12 — Onboarding](#14-step-12--onboarding)
15. [Step 13 — Set to Active](#15-step-13--set-to-active)
16. [Rejecting a Candidate](#16-rejecting-a-candidate)
17. [Sending Emails](#17-sending-emails)
18. [Managing Onboarding Resources](#18-managing-onboarding-resources)
19. [Admin Pages Quick Reference](#19-admin-pages-quick-reference)
20. [Pipeline Stages Reference](#20-pipeline-stages-reference)

---

## 1. Overview

The Talbiyah.ai Recruitment System helps you find, evaluate, and onboard qualified teachers onto the platform. The process has two phases:

- **Sourcing** — Finding and reaching out to potential candidates before they formally enter the pipeline.
- **Pipeline** — Managing candidates through 10 defined stages, from initial contact all the way to becoming an active teacher.

All recruitment tools are accessible from the admin sidebar under the **Recruitment** section.

---

## 2. The Recruitment Pipeline at a Glance

Below is the complete journey a candidate takes from discovery to active teacher:

```
SOURCING                          PIPELINE
--------                          --------
Identified                        Initial Contact
    |                                 |
Contacted                         Application
    |                                 |
Responded                         Interview Scheduled
    |                                 |
Move to Pipeline ──────────>      Interview Completed
                                      |
                                  Document Verification
                                      |
                                  Trial Lesson (optional)
                                      |
                                  Approved
                                      |
                                  Onboarding
                                      |
                                  Active Teacher
```

A candidate can be **Rejected** at any stage in the pipeline.

---

## 3. Step 1 — Source Prospects

**Page:** Admin > Sourcing Tracker (`/admin/sourcing`)

This is where you track people you've found who might be good teachers, before they formally enter the pipeline.

### Adding a New Prospect

1. Click the **"Add Prospect"** button (top-right).
2. Fill in the form:
   - **Full Name** (required)
   - **Email**
   - **Phone**
   - **Nationality**
   - **Languages** (comma-separated, e.g. "English, Arabic")
   - **Platform Source** — where you found them: Fiverr, Upwork, LinkedIn, Referral, Direct, or Other
   - **Source URL** — link to their profile on that platform
   - **Subjects** — tick the boxes: Quran, Arabic, Tajweed, Islamic Studies
   - **Expected Hourly Rate** (GBP)
   - **Notes** — any relevant info
3. Click **Save**.

### Managing Prospect Status

Each prospect has a status that you update as your outreach progresses:

| Status | Meaning |
|--------|---------|
| **Identified** | You've found them but not reached out yet |
| **Contacted** | You've sent them a message / email |
| **Responded** | They've replied to your outreach |
| **In Pipeline** | They've been moved into the formal recruitment pipeline |

To change a status: click the **status badge** in the table row and select the new status from the dropdown.

### Filtering and Searching

- Use the **search bar** to find prospects by name or email.
- Use the **Status** dropdown to filter by sourcing status.
- Use the **Platform** dropdown to filter by source platform.

---

## 4. Step 2 — Move Prospect into Pipeline

When a prospect is ready to be formally evaluated:

1. Go to **Sourcing Tracker** (`/admin/sourcing`).
2. Find the prospect in the table.
3. Click the **pipeline icon button** (arrow icon) in the Actions column.
4. Confirm the action.

**What happens behind the scenes:**
- A new candidate record is created in the pipeline at the **Initial Contact** stage.
- The prospect's sourcing status changes to **In Pipeline**.
- The two records are linked so you can trace the candidate back to their source.

> **Note:** You can also add candidates directly to the pipeline without sourcing them first (see Step 3).

---

## 5. Step 3 — Manage Candidates in the Pipeline

**Page:** Admin > Recruitment Pipeline (`/admin/recruitment-pipeline`)

This is your main hub for tracking all active candidates.

### Dashboard Stats

At the top of the page you'll see four key metrics:
- **Total in Pipeline** — all active candidates
- **Interviews This Week** — upcoming interviews in the current week
- **Approved This Month** — candidates approved this month
- **Avg Days to Hire** — average time from entering pipeline to approval

### Two View Modes

**Kanban View (default):**
- Candidates appear as cards in columns, one column per pipeline stage.
- **Drag and drop** a card from one column to another to change their stage.
- Click a card to open the **Candidate Detail Drawer** (full profile).
- Click the **three-dot menu** on a card for quick actions: Send Email, Schedule Interview, Add Note.

**Table View:**
- Candidates displayed in a sortable table with columns: Name, Email, Subjects, Stage, Tier, Days in Stage, Actions.
- Action buttons per row: Send Email, Schedule Interview.
- Click a candidate name to open the detail drawer.

### Adding a Candidate Directly

If you want to skip sourcing and add someone straight to the pipeline:

1. Click the **"Add Candidate"** button (top-right).
2. Fill in the form:
   - **Full Name** (required), **Email** (required)
   - Phone, Nationality, Country, City
   - Languages
   - **Subjects** (checkboxes): Quran, Arabic, Tajweed, Islamic Studies, Quran Memorisation
   - Expected Hourly Rate (GBP)
   - **Teacher Type**: Platform or Independent
   - Years of Experience
   - Education Level: High School / Bachelor's / Master's / PhD / Diploma / Ijazah / Other
   - Bio/Notes
   - **Initial Pipeline Stage** — which stage to place them in
3. Click **Save**.

### The Candidate Detail Drawer

Click any candidate (card or table row) to open a slide-out drawer with 5 tabs:

| Tab | What It Shows |
|-----|---------------|
| **Overview** | Personal info, teaching info, bio, source & timeline, admin notes |
| **Documents** | DBS check status, references status, CV, certificates |
| **Interview** | Interview details, ratings, notes, AI summary, trial lesson info |
| **Emails** | History of all emails sent to this candidate |
| **History** | Full timeline of every stage change with timestamps |

The drawer header also contains key action buttons (described in later steps).

---

## 6. Step 4 — Schedule an Interview

**Page:** Admin > Interviews (`/admin/interviews`)

Interview scheduling is a three-part process: create time slots, generate an invite link, and send it to the candidate.

### Part A — Create Available Time Slots

1. Go to the **"Manage Slots"** tab.
2. You'll see a **14-day calendar grid** (9am–6pm in 30-minute intervals).
3. **To add a slot:** Click an empty cell (turns green/emerald to show it's available).
4. **To remove a slot:** Click an existing green cell.
5. Toggle between **30-minute** and **60-minute** durations at the top.
6. Alternatively, use the **Quick Add** form below the calendar: pick a date, time, and duration, then click Add.

> **Colour key:**
> - Grey = empty (no slot)
> - Green/Emerald = available slot
> - Blue = booked slot (a candidate has claimed it)

### Part B — Generate an Invite Link

1. Go to the **"Upcoming Interviews"** tab.
2. Find the candidate (or navigate here from the pipeline via Schedule Interview action).
3. Click **"Generate Invite Link"**.
4. A unique booking link is created and **copied to your clipboard** automatically.
5. The link format is: `https://talbiyah.ai/book-interview/{token}`

### Part C — Send the Link to the Candidate

- Paste the link into an email to the candidate.
- You can use the **Send Email** action (see [Sending Emails](#17-sending-emails)) with the interview invite template, which has a `{{interview_link}}` placeholder.
- Or send it manually via your own email.

---

## 7. Step 5 — Candidate Books Their Slot

This step is done by the **candidate** — no admin action needed.

1. The candidate opens the booking link in their browser (no login required).
2. They see all your available time slots grouped by date.
3. They select a slot and confirm.
4. The system automatically:
   - Creates a video interview room (100ms)
   - Books the slot (prevents double-booking)
   - Moves the candidate to **Interview Scheduled** stage
   - Sends the candidate a confirmation email with the interview link and time

> **If two candidates try to book the same slot at the same time**, the system handles this safely — only one will succeed, the other will see the slot as unavailable.

---

## 8. Step 6 — Conduct the Interview

### Before the Interview

- Go to **Interviews > Upcoming Interviews** tab.
- You'll see a countdown timer for each upcoming interview.
- Optionally click **"Send Reminder"** to email the candidate a reminder with the join link and time.

### During the Interview

1. Click **"Join Interview"** next to the candidate — this takes you to the **Interview Room** (`/admin/interview-room/:id`).
2. The room has two panels:
   - **Left:** Live video call (you join as host, candidate joins as guest).
   - **Right sidebar:** Candidate information and evaluation tools.

3. **Review candidate info** in the sidebar: name, email, phone, nationality, languages, subjects, experience, education, qualifications, bio.

4. **Rate the candidate** on 5 dimensions (1–5 stars each):
   - Teaching Demo
   - Communication
   - Knowledge
   - Personality
   - Overall

   > Ratings **auto-save** as you click the stars.

5. **Take interview notes** in the textarea. Notes **auto-save** every 2 seconds and when you click away.

### After the Interview

6. Click **"Mark Completed"** to set the interview status to completed.
   - If the candidate didn't show up, click **"No Show"** instead.

---

## 9. Step 7 — Generate AI Summary

After the interview is completed and you've entered your notes:

1. In the Interview Room sidebar (or in the candidate's detail drawer under the Interview tab), find the **"AI Summary"** section.
2. Click **"Generate Summary"** (or **"Regenerate"** if one already exists).
3. The system sends your notes and ratings to Claude AI, which returns:
   - A brief summary of the interview
   - Key strengths
   - Areas for improvement
   - Recommended tier level (Newcomer / Apprentice / Skilled / Expert / Master)
   - Overall recommendation: **Approve**, **Reject**, or **Further Review**
   - Specific notes or concerns

> **Requirement:** You must have written interview notes for the AI summary to work. Empty notes will be rejected.

4. Move the candidate to **Interview Completed** stage (if not already there).

---

## 10. Step 8 — Verify Documents

Move the candidate to the **Document Verification** stage, then open their **Candidate Detail Drawer > Documents tab**.

### DBS Check

1. Set the **DBS Status** using the dropdown:
   - Not Started → Submitted → In Progress → **Cleared** / Flagged / Not Required
2. Enter the **DBS Reference Number** when available.

### References

1. Set the **References Status**:
   - Not Started → Requested → Received → **Verified** / Flagged
2. Review individual character references and update their status badges.

### CV and Certificates

- Review the uploaded **CV** (link provided).
- Check each **certificate** and tick the verified checkbox.

---

## 11. Step 9 — Trial Lesson (Optional)

If you want the candidate to do a trial lesson before approval:

1. Move the candidate to the **Trial Lesson** stage.
2. Arrange the trial lesson outside the system (or via a scheduled video call).
3. After the trial, open the **Candidate Detail Drawer > Interview tab** and scroll to the **Trial Lesson** section.
4. Enter a **rating** and **notes** for the trial lesson.

---

## 12. Step 10 — Approve the Candidate

When you're satisfied with a candidate (after interview, documents, and optionally trial lesson):

1. Open the **Candidate Detail Drawer**.
2. In the drawer header, click the **"Approve"** button (green).
   - This button is visible when the candidate is at: Interview Completed, Document Verification, or Trial Lesson stage.
3. The candidate moves to the **Approved** stage and their approval date is recorded.

---

## 13. Step 11 — Create Teacher Account

Once a candidate is approved, you need to create their platform account:

1. Open the **Candidate Detail Drawer** for an approved candidate.
2. In the drawer header, click **"Create Account & Send Invite"**.
3. The system will:
   - Create a Supabase user account for the candidate
   - Create their teacher profile with all their data (bio, subjects, rate, tier, etc.)
   - Move them to the **Onboarding** stage
   - Send them a **welcome email** with:
     - A magic login link (valid for 24 hours)
     - Instructions to complete their onboarding

> **After account creation**, the button changes to an **"Account Created"** indicator — this is irreversible per candidate.

> **If the magic link expires** (after 24 hours), the teacher can use the "Forgot Password" flow on the login page.

---

## 14. Step 12 — Onboarding

**Page:** Admin > Onboarding Resources (`/admin/onboarding-resources`)

### What the Teacher Does

After logging in with their magic link, the teacher accesses onboarding materials and marks them as read/completed.

### What You Monitor

1. Go to the **"Teacher Completion"** tab.
2. You'll see a table of all approved teachers showing:
   - **Required Read** — how many required resources they've completed
   - **Total Required** — total number of required resources
   - **Total Read** — total resources read (including optional ones)
   - **Last Activity** — when they last interacted with resources
   - **Status** — Complete / In Progress / Not Started

---

## 15. Step 13 — Set to Active

When a teacher has completed onboarding:

1. Go to **Recruitment Pipeline**.
2. Find the candidate in the **Onboarding** column (Kanban) or filter by Onboarding stage (Table).
3. **Drag** (Kanban) or **update** their stage to **Active**.

The teacher is now a fully onboarded, active platform teacher.

---

## 16. Rejecting a Candidate

You can reject a candidate at **any stage** in the pipeline:

1. Open the **Candidate Detail Drawer**.
2. Click the **"Reject"** button (red) in the drawer header.
3. An inline confirmation form appears — enter a **rejection reason** in the textarea.
4. Confirm the rejection.

The candidate moves to the **Rejected** stage and the rejection date and reason are recorded.

> **Alternatively**, you can drag a candidate card to the Rejected column on the Kanban board (but this won't prompt for a reason).

---

## 17. Sending Emails

You can send emails to candidates at any point:

1. Click **"Send Email"** (available from: Kanban card menu, table row action, drawer header).
2. The **Send Email Modal** opens with two steps:

### Step 1 — Choose a Template

- Select from pre-configured recruitment email templates.
- Templates contain placeholders that get auto-filled.

### Step 2 — Compose / Edit

- **Auto-populated fields** (read-only): `{{teacher_name}}`, `{{subjects}}`, `{{tier_name}}`, `{{hourly_rate}}`
- **Editable fields**: `{{platform_name}}`, `{{interview_link}}`
- Toggle between **Preview** and **Edit** mode.
- Review the final email, then click **Send**.

All sent emails are logged and visible in the candidate's **Emails** tab in the detail drawer.

---

## 18. Managing Onboarding Resources

**Page:** Admin > Onboarding Resources (`/admin/onboarding-resources`) > **Resources tab**

### Adding a Resource

1. Click **"Add Resource"**.
2. Fill in:
   - **English Title** and **Description**
   - **Arabic Title** and **Description** (optional)
   - **Type**: PDF, Video, Article, or Link
   - **Language**: English, Arabic, or Both
   - **Category**: Platform Guide, Teaching Methodology, Safeguarding, Technology, Policy, or General
   - **File Upload** (for PDFs) or **External URL** (for videos/links)
   - **Sort Order** — controls display order
   - **Required** checkbox — teachers must complete required resources
   - **Active** checkbox — only active resources are visible to teachers
3. Click **Save**.

### Managing Resources

- **Edit** any resource using the edit button in the table.
- **Toggle Active** status with the toggle switch.
- **Delete** resources using the delete button.

---

## 19. Admin Pages Quick Reference

| Page | URL | Purpose |
|------|-----|---------|
| Sourcing Tracker | `/admin/sourcing` | Find and track prospects before pipeline |
| Recruitment Pipeline | `/admin/recruitment-pipeline` | Main candidate management (Kanban + Table) |
| Interviews | `/admin/interviews` | Manage slots, upcoming interviews, completed interviews |
| Interview Room | `/admin/interview-room/:id` | Live video interview with evaluation tools |
| Onboarding Resources | `/admin/onboarding-resources` | Manage materials + monitor teacher completion |

---

## 20. Pipeline Stages Reference

| # | Stage | Colour | Description |
|---|-------|--------|-------------|
| 1 | Initial Contact | Grey | Candidate has just entered the pipeline |
| 2 | Application | Blue | Candidate is formally applying |
| 3 | Interview Scheduled | Cyan | Interview has been booked |
| 4 | Interview Completed | Indigo | Interview is done, awaiting review |
| 5 | Document Verification | Yellow | Checking DBS, references, certificates |
| 6 | Trial Lesson | Purple | Optional trial teaching session |
| 7 | Approved | Emerald | Candidate passed — ready for account creation |
| 8 | Onboarding | Teal | Account created, completing onboarding materials |
| 9 | Active | Green | Fully onboarded and teaching on the platform |
| 10 | Rejected | Red | Candidate was not accepted (can happen at any stage) |

---

## Quick-Start Checklist

For your very first hire, follow these steps in order:

- [ ] **Set up onboarding resources** — Go to Onboarding Resources and upload your teaching guides, policies, and platform tutorials
- [ ] **Set up email templates** — Ensure recruitment email templates are configured
- [ ] **Create interview slots** — Go to Interviews > Manage Slots and mark your available times
- [ ] **Add your first prospect** — Go to Sourcing Tracker and add a prospect (or add directly to Pipeline)
- [ ] **Move to pipeline** — Once they respond, move them into the pipeline
- [ ] **Generate invite link** — From the Interviews page, generate a booking link
- [ ] **Send the link** — Email the candidate their interview booking link
- [ ] **Conduct interview** — Join the Interview Room when the time comes
- [ ] **Generate AI summary** — Let Claude analyse the interview
- [ ] **Verify documents** — Check DBS, references, and certificates
- [ ] **Approve** — Hit the Approve button
- [ ] **Create account** — Click "Create Account & Send Invite" to onboard them
- [ ] **Monitor onboarding** — Check the Teacher Completion tab
- [ ] **Set to Active** — Move them to Active once onboarding is done

---

*Talbiyah.ai — Nurturing Knowledge, Building Futures*
