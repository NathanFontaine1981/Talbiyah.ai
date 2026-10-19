export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_email_log: {
        Row: {
          body: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          sender_id: string | null
          status: string | null
          subject: string
          template_type: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          sender_id?: string | null
          status?: string | null
          subject: string
          template_type?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          sender_id?: string | null
          status?: string | null
          subject?: string
          template_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_log_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_email_log_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      admin_generated_insights: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          generated_content: Json
          id: string
          lesson_date: string
          pdf_url: string | null
          student_name: string | null
          subject_tags: string[] | null
          teacher_name: string
          template_type: string
          title: string
          transcript: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          generated_content: Json
          id?: string
          lesson_date: string
          pdf_url?: string | null
          student_name?: string | null
          subject_tags?: string[] | null
          teacher_name: string
          template_type: string
          title: string
          transcript: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          generated_content?: Json
          id?: string
          lesson_date?: string
          pdf_url?: string | null
          student_name?: string | null
          subject_tags?: string[] | null
          teacher_name?: string
          template_type?: string
          title?: string
          transcript?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_impersonation_log: {
        Row: {
          admin_id: string
          ended_at: string | null
          id: string
          ip: unknown
          started_at: string
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          ended_at?: string | null
          id?: string
          ip?: unknown
          started_at?: string
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          ended_at?: string | null
          id?: string
          ip?: unknown
          started_at?: string
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_interview_slots: {
        Row: {
          admin_id: string
          booked_by_candidate_id: string | null
          created_at: string | null
          date: string
          duration_minutes: number
          end_time: string
          id: string
          is_booked: boolean | null
          start_time: string
        }
        Insert: {
          admin_id: string
          booked_by_candidate_id?: string | null
          created_at?: string | null
          date: string
          duration_minutes?: number
          end_time: string
          id?: string
          is_booked?: boolean | null
          start_time: string
        }
        Update: {
          admin_id?: string
          booked_by_candidate_id?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          is_booked?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_interview_slots_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_interview_slots_booked_by_candidate_id_fkey"
            columns: ["booked_by_candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      anchor_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          facts_verified: Json | null
          id: string
          probability_score: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          facts_verified?: Json | null
          id?: string
          probability_score?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          facts_verified?: Json | null
          id?: string
          probability_score?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean
          published_at: string
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_active?: boolean
          published_at?: string
          tag?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          published_at?: string
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      arabic_homework_submissions: {
        Row: {
          audio_recordings: Json | null
          created_at: string | null
          description: string | null
          due_date: string | null
          grammar_exercises: Json | null
          grammar_score: number | null
          homework_type: string | null
          id: string
          learner_id: string
          lesson_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          syllabus_id: string | null
          teacher_feedback: string | null
          teacher_id: string | null
          teacher_rating: string | null
          title: string | null
          updated_at: string | null
          vocabulary_completed: Json | null
          vocabulary_score: number | null
          vocabulary_words: string[] | null
          writing_feedback: string | null
          written_work: string | null
        }
        Insert: {
          audio_recordings?: Json | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          grammar_exercises?: Json | null
          grammar_score?: number | null
          homework_type?: string | null
          id?: string
          learner_id: string
          lesson_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          syllabus_id?: string | null
          teacher_feedback?: string | null
          teacher_id?: string | null
          teacher_rating?: string | null
          title?: string | null
          updated_at?: string | null
          vocabulary_completed?: Json | null
          vocabulary_score?: number | null
          vocabulary_words?: string[] | null
          writing_feedback?: string | null
          written_work?: string | null
        }
        Update: {
          audio_recordings?: Json | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          grammar_exercises?: Json | null
          grammar_score?: number | null
          homework_type?: string | null
          id?: string
          learner_id?: string
          lesson_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          syllabus_id?: string | null
          teacher_feedback?: string | null
          teacher_id?: string | null
          teacher_rating?: string | null
          title?: string | null
          updated_at?: string | null
          vocabulary_completed?: Json | null
          vocabulary_score?: number | null
          vocabulary_words?: string[] | null
          writing_feedback?: string | null
          written_work?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arabic_homework_submissions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "arabic_syllabus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "arabic_homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      arabic_learner_progress: {
        Row: {
          conversation_practiced: boolean | null
          created_at: string | null
          grammar_mastered: boolean | null
          id: string
          last_lesson_date: string | null
          learner_id: string
          mastery_complete: boolean | null
          practice_complete: boolean | null
          status: string | null
          syllabus_id: string
          teacher_id: string | null
          teacher_notes: string | null
          understanding_complete: boolean | null
          updated_at: string | null
          vocabulary_mastered: number | null
        }
        Insert: {
          conversation_practiced?: boolean | null
          created_at?: string | null
          grammar_mastered?: boolean | null
          id?: string
          last_lesson_date?: string | null
          learner_id: string
          mastery_complete?: boolean | null
          practice_complete?: boolean | null
          status?: string | null
          syllabus_id: string
          teacher_id?: string | null
          teacher_notes?: string | null
          understanding_complete?: boolean | null
          updated_at?: string | null
          vocabulary_mastered?: number | null
        }
        Update: {
          conversation_practiced?: boolean | null
          created_at?: string | null
          grammar_mastered?: boolean | null
          id?: string
          last_lesson_date?: string | null
          learner_id?: string
          mastery_complete?: boolean | null
          practice_complete?: boolean | null
          status?: string | null
          syllabus_id?: string
          teacher_id?: string | null
          teacher_notes?: string | null
          understanding_complete?: boolean | null
          updated_at?: string | null
          vocabulary_mastered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arabic_learner_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_learner_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_learner_progress_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "arabic_syllabus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_learner_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "arabic_learner_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arabic_learner_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "arabic_learner_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      arabic_syllabus: {
        Row: {
          book: string
          conversation_topics: string[] | null
          created_at: string | null
          display_order: number
          estimated_lessons: number | null
          grammar_topics: string[] | null
          id: string
          key_vocabulary: string[] | null
          unit_number: number
          unit_theme: string | null
          unit_title_arabic: string
          unit_title_english: string
        }
        Insert: {
          book: string
          conversation_topics?: string[] | null
          created_at?: string | null
          display_order: number
          estimated_lessons?: number | null
          grammar_topics?: string[] | null
          id?: string
          key_vocabulary?: string[] | null
          unit_number: number
          unit_theme?: string | null
          unit_title_arabic: string
          unit_title_english: string
        }
        Update: {
          book?: string
          conversation_topics?: string[] | null
          created_at?: string | null
          display_order?: number
          estimated_lessons?: number | null
          grammar_topics?: string[] | null
          id?: string
          key_vocabulary?: string[] | null
          unit_number?: number
          unit_theme?: string | null
          unit_title_arabic?: string
          unit_title_english?: string
        }
        Relationships: []
      }
      athkar_memorisation: {
        Row: {
          athkar_id: string
          created_at: string | null
          id: string
          memorised: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          athkar_id: string
          created_at?: string | null
          id?: string
          memorised?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          athkar_id?: string
          created_at?: string | null
          id?: string
          memorised?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ayah_progress: {
        Row: {
          ayah_number: number
          created_at: string | null
          fluency_complete: boolean | null
          id: string
          learner_id: string
          memorization_complete: boolean | null
          surah_number: number
          teacher_notes: string | null
          understanding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          ayah_number: number
          created_at?: string | null
          fluency_complete?: boolean | null
          id?: string
          learner_id: string
          memorization_complete?: boolean | null
          surah_number: number
          teacher_notes?: string | null
          understanding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ayah_number?: number
          created_at?: string | null
          fluency_complete?: boolean | null
          id?: string
          learner_id?: string
          memorization_complete?: boolean | null
          surah_number?: number
          teacher_notes?: string | null
          understanding_complete?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ayah_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ayah_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          reason: string | null
          teacher_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          reason?: string | null
          teacher_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "blocked_dates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_dates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "blocked_dates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          payment_status: string | null
          price: number | null
          room_id: string | null
          scheduled_date: string
          scheduled_time: string
          status: string
          student_id: string
          student_room_code: string | null
          subject_id: string | null
          teacher_id: string
          teacher_room_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          payment_status?: string | null
          price?: number | null
          room_id?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string
          student_id: string
          student_room_code?: string | null
          subject_id?: string | null
          teacher_id: string
          teacher_room_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          payment_status?: string | null
          price?: number | null
          room_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          student_id?: string
          student_room_code?: string | null
          subject_id?: string | null
          teacher_id?: string
          teacher_room_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          duration: number
          duration_minutes: number | null
          expires_at: string | null
          id: string
          lesson_tier: string | null
          price: number | null
          quran_focus: string | null
          scheduled_time: string | null
          status: string | null
          subject_id: string | null
          teacher_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number
          duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          lesson_tier?: string | null
          price?: number | null
          quran_focus?: string | null
          scheduled_time?: string | null
          status?: string | null
          subject_id?: string | null
          teacher_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          duration_minutes?: number | null
          expires_at?: string | null
          id?: string
          lesson_tier?: string | null
          price?: number | null
          quran_focus?: string | null
          scheduled_time?: string | null
          status?: string | null
          subject_id?: string | null
          teacher_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "cart_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "cart_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      course_insights: {
        Row: {
          ai_model: string | null
          confidence_score: number | null
          course_session_id: string
          created_at: string | null
          detailed_insights: Json | null
          group_session_id: string
          id: string
          insights_content: string | null
          notification_count: number | null
          notifications_sent: boolean | null
          processing_time_ms: number | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          confidence_score?: number | null
          course_session_id: string
          created_at?: string | null
          detailed_insights?: Json | null
          group_session_id: string
          id?: string
          insights_content?: string | null
          notification_count?: number | null
          notifications_sent?: boolean | null
          processing_time_ms?: number | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          confidence_score?: number | null
          course_session_id?: string
          created_at?: string | null
          detailed_insights?: Json | null
          group_session_id?: string
          id?: string
          insights_content?: string | null
          notification_count?: number | null
          notifications_sent?: boolean | null
          processing_time_ms?: number | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dawra_insights_dawra_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: true
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dawra_insights_group_session_id_fkey"
            columns: ["group_session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes_access: {
        Row: {
          amount: number
          created_at: string | null
          discount_code: string | null
          group_session_id: string
          id: string
          paid_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          discount_code?: string | null
          group_session_id: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          discount_code?: string | null
          group_session_id?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_access_group_session_id_fkey"
            columns: ["group_session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          "1h_reminder_sent": string | null
          "24h_reminder_sent": string | null
          added_by: string | null
          audio_url: string | null
          created_at: string | null
          group_session_id: string
          id: string
          live_notified_at: string | null
          live_status: string | null
          recording_asset_id: string | null
          recording_expires_at: string | null
          recording_url: string | null
          room_code_guest: string | null
          room_code_host: string | null
          room_id: string | null
          session_date: string | null
          session_number: number
          status: string
          teaching_plan: string | null
          teaching_plan_generated_at: string | null
          teaching_plan_json: Json | null
          title: string | null
          transcript: string | null
          transcript_source: string | null
          updated_at: string | null
        }
        Insert: {
          "1h_reminder_sent"?: string | null
          "24h_reminder_sent"?: string | null
          added_by?: string | null
          audio_url?: string | null
          created_at?: string | null
          group_session_id: string
          id?: string
          live_notified_at?: string | null
          live_status?: string | null
          recording_asset_id?: string | null
          recording_expires_at?: string | null
          recording_url?: string | null
          room_code_guest?: string | null
          room_code_host?: string | null
          room_id?: string | null
          session_date?: string | null
          session_number: number
          status?: string
          teaching_plan?: string | null
          teaching_plan_generated_at?: string | null
          teaching_plan_json?: Json | null
          title?: string | null
          transcript?: string | null
          transcript_source?: string | null
          updated_at?: string | null
        }
        Update: {
          "1h_reminder_sent"?: string | null
          "24h_reminder_sent"?: string | null
          added_by?: string | null
          audio_url?: string | null
          created_at?: string | null
          group_session_id?: string
          id?: string
          live_notified_at?: string | null
          live_status?: string | null
          recording_asset_id?: string | null
          recording_expires_at?: string | null
          recording_url?: string | null
          room_code_guest?: string | null
          room_code_host?: string | null
          room_id?: string | null
          session_date?: string | null
          session_number?: number
          status?: string
          teaching_plan?: string | null
          teaching_plan_generated_at?: string | null
          teaching_plan_json?: Json | null
          title?: string | null
          transcript?: string | null
          transcript_source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dawra_sessions_group_session_id_fkey"
            columns: ["group_session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_student_progress: {
        Row: {
          course_session_id: string
          id: string
          quiz_completed_at: string | null
          quiz_score: number | null
          rated_at: string | null
          rating: number | null
          student_id: string
          viewed_at: string | null
        }
        Insert: {
          course_session_id: string
          id?: string
          quiz_completed_at?: string | null
          quiz_score?: number | null
          rated_at?: string | null
          rating?: number | null
          student_id: string
          viewed_at?: string | null
        }
        Update: {
          course_session_id?: string
          id?: string
          quiz_completed_at?: string | null
          quiz_score?: number | null
          rated_at?: string | null
          rating?: number | null
          student_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dawra_student_progress_dawra_session_id_fkey"
            columns: ["course_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_purchases: {
        Row: {
          created_at: string | null
          credits_added: number
          id: string
          pack_price: number
          pack_size: number
          purchase_date: string | null
          refund_amount: number | null
          refund_date: string | null
          refund_deadline: string | null
          refund_reason: string | null
          refund_type: string | null
          refunded: boolean | null
          refunded_at: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_id: string | null
          stripe_refund_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_added: number
          id?: string
          pack_price: number
          pack_size: number
          purchase_date?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_deadline?: string | null
          refund_reason?: string | null
          refund_type?: string | null
          refunded?: boolean | null
          refunded_at?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          stripe_refund_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_added?: number
          id?: string
          pack_price?: number
          pack_size?: number
          purchase_date?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_deadline?: string | null
          refund_reason?: string | null
          refund_type?: string | null
          refunded?: boolean | null
          refunded_at?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_id?: string | null
          stripe_refund_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string | null
          credits_after: number
          credits_change: number
          id: string
          lesson_id: string | null
          notes: string | null
          purchase_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_after: number
          credits_change: number
          id?: string
          lesson_id?: string | null
          notes?: string | null
          purchase_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_after?: number
          credits_change?: number
          id?: string
          lesson_id?: string | null
          notes?: string | null
          purchase_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "credit_transactions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "credit_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transfers: {
        Row: {
          created_at: string
          credits_amount: number
          from_user_id: string
          id: string
          notes: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          credits_amount: number
          from_user_id: string
          id?: string
          notes?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          credits_amount?: number
          from_user_id?: string
          id?: string
          notes?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      curated_recommendations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          note: string | null
          notified_dashboard_at: string | null
          notified_email_at: string | null
          notified_email_count: number | null
          recommended_by: string | null
          title: string
          updated_at: string | null
          youtube_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          note?: string | null
          notified_dashboard_at?: string | null
          notified_email_at?: string | null
          notified_email_count?: number | null
          recommended_by?: string | null
          title: string
          updated_at?: string | null
          youtube_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          note?: string | null
          notified_dashboard_at?: string | null
          notified_email_at?: string | null
          notified_email_count?: number | null
          recommended_by?: string | null
          title?: string
          updated_at?: string | null
          youtube_url?: string
        }
        Relationships: []
      }
      curriculum_milestones: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_lessons: number | null
          id: string
          name: string
          name_arabic: string | null
          pillar: string | null
          requires_verification: boolean | null
          slug: string
          sort_order: number | null
          stage_id: string
          updated_at: string | null
          verification_criteria: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_lessons?: number | null
          id?: string
          name: string
          name_arabic?: string | null
          pillar?: string | null
          requires_verification?: boolean | null
          slug: string
          sort_order?: number | null
          stage_id: string
          updated_at?: string | null
          verification_criteria?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_lessons?: number | null
          id?: string
          name?: string
          name_arabic?: string | null
          pillar?: string | null
          requires_verification?: boolean | null
          slug?: string
          sort_order?: number | null
          stage_id?: string
          updated_at?: string | null
          verification_criteria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_milestones_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "curriculum_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_phases: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          name_arabic: string | null
          slug: string
          sort_order: number | null
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          name_arabic?: string | null
          slug: string
          sort_order?: number | null
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          name_arabic?: string | null
          slug?: string
          sort_order?: number | null
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_phases_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_stages: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          name: string
          name_arabic: string | null
          phase_id: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          name_arabic?: string | null
          phase_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          name_arabic?: string | null
          phase_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_stages_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "curriculum_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_subjects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_arabic: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_arabic?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_arabic?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_maintenance_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_streak_day: boolean | null
          kahf_completed: boolean | null
          learner_id: string
          salah_surahs: Json | null
          session_date: string
          status: string
          surahs_reviewed: Json
          tasks_completed: number
          total_tasks: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_streak_day?: boolean | null
          kahf_completed?: boolean | null
          learner_id: string
          salah_surahs?: Json | null
          session_date?: string
          status?: string
          surahs_reviewed?: Json
          tasks_completed?: number
          total_tasks?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_streak_day?: boolean | null
          kahf_completed?: boolean | null
          learner_id?: string
          salah_surahs?: Json | null
          session_date?: string
          status?: string
          surahs_reviewed?: Json
          tasks_completed?: number
          total_tasks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_maintenance_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_maintenance_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_assessments: {
        Row: {
          ai_analyzed_at: string | null
          ai_preliminary_assessment: Json | null
          created_at: string | null
          id: string
          learner_id: string | null
          lesson_completed_at: string | null
          lesson_id: string | null
          methodology_alignment: string | null
          pre_assessment_responses: Json | null
          questionnaire_completed_at: string | null
          recommended_phase: string | null
          report_generated_at: string | null
          status: string
          student_id: string
          subject_area: string | null
          teacher_assessment: Json | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_analyzed_at?: string | null
          ai_preliminary_assessment?: Json | null
          created_at?: string | null
          id?: string
          learner_id?: string | null
          lesson_completed_at?: string | null
          lesson_id?: string | null
          methodology_alignment?: string | null
          pre_assessment_responses?: Json | null
          questionnaire_completed_at?: string | null
          recommended_phase?: string | null
          report_generated_at?: string | null
          status?: string
          student_id: string
          subject_area?: string | null
          teacher_assessment?: Json | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_analyzed_at?: string | null
          ai_preliminary_assessment?: Json | null
          created_at?: string | null
          id?: string
          learner_id?: string | null
          lesson_completed_at?: string | null
          lesson_id?: string | null
          methodology_alignment?: string | null
          pre_assessment_responses?: Json | null
          questionnaire_completed_at?: string | null
          recommended_phase?: string | null
          report_generated_at?: string | null
          status?: string
          student_id?: string
          subject_area?: string | null
          teacher_assessment?: Json | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_assessments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "diagnostic_assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      dua_block_sets: {
        Row: {
          admission_block_id: string | null
          category_id: string | null
          closing_block_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          hamd_block_id: string | null
          id: string
          is_featured: boolean | null
          name: string
          name_arabic: string | null
          others_block_id: string | null
          request_block_ids: string[] | null
          salawat_block_id: string | null
        }
        Insert: {
          admission_block_id?: string | null
          category_id?: string | null
          closing_block_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hamd_block_id?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          name_arabic?: string | null
          others_block_id?: string | null
          request_block_ids?: string[] | null
          salawat_block_id?: string | null
        }
        Update: {
          admission_block_id?: string | null
          category_id?: string | null
          closing_block_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hamd_block_id?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          name_arabic?: string | null
          others_block_id?: string | null
          request_block_ids?: string[] | null
          salawat_block_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dua_block_sets_admission_block_id_fkey"
            columns: ["admission_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dua_block_sets_closing_block_id_fkey"
            columns: ["closing_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dua_block_sets_hamd_block_id_fkey"
            columns: ["hamd_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dua_block_sets_others_block_id_fkey"
            columns: ["others_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dua_block_sets_salawat_block_id_fkey"
            columns: ["salawat_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      dua_blocks: {
        Row: {
          allah_names: string[] | null
          arabic_text: string
          block_type: string
          category_id: string | null
          created_at: string | null
          display_order: number | null
          english_translation: string
          id: string
          is_core: boolean | null
          source: string | null
          transliteration: string
          updated_at: string | null
        }
        Insert: {
          allah_names?: string[] | null
          arabic_text: string
          block_type: string
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          english_translation: string
          id?: string
          is_core?: boolean | null
          source?: string | null
          transliteration: string
          updated_at?: string | null
        }
        Update: {
          allah_names?: string[] | null
          arabic_text?: string
          block_type?: string
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          english_translation?: string
          id?: string
          is_core?: boolean | null
          source?: string | null
          transliteration?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dua_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_core: boolean | null
          name: string
          name_arabic: string | null
          sort_order: number | null
          suggested_allah_names: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id: string
          is_core?: boolean | null
          name: string
          name_arabic?: string | null
          sort_order?: number | null
          suggested_allah_names?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_core?: boolean | null
          name?: string
          name_arabic?: string | null
          sort_order?: number | null
          suggested_allah_names?: string[] | null
        }
        Relationships: []
      }
      dua_library: {
        Row: {
          arabic_text: string
          audio_url: string | null
          category_id: string | null
          created_at: string
          english_translation: string
          id: string
          is_core: boolean | null
          sort_order: number | null
          source: string | null
          source_arabic: string | null
          title: string
          title_arabic: string | null
          transliteration: string | null
        }
        Insert: {
          arabic_text: string
          audio_url?: string | null
          category_id?: string | null
          created_at?: string
          english_translation: string
          id?: string
          is_core?: boolean | null
          sort_order?: number | null
          source?: string | null
          source_arabic?: string | null
          title: string
          title_arabic?: string | null
          transliteration?: string | null
        }
        Update: {
          arabic_text?: string
          audio_url?: string | null
          category_id?: string | null
          created_at?: string
          english_translation?: string
          id?: string
          is_core?: boolean | null
          sort_order?: number | null
          source?: string | null
          source_arabic?: string | null
          title?: string
          title_arabic?: string | null
          transliteration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dua_library_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dua_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_progress: {
        Row: {
          axioms_agreed: Json | null
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          axioms_agreed?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          axioms_agreed?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      foundation_categories: {
        Row: {
          arabic_name: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_coming_soon: boolean | null
          name: string
          order_index: number | null
          pillar_id: string | null
          slug: string
        }
        Insert: {
          arabic_name?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          name: string
          order_index?: number | null
          pillar_id?: string | null
          slug: string
        }
        Update: {
          arabic_name?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          name?: string
          order_index?: number | null
          pillar_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_categories_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "foundation_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_exams: {
        Row: {
          created_at: string | null
          generated_by: string | null
          id: string
          passing_score: number | null
          questions: Json
          updated_at: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          passing_score?: number | null
          questions?: Json
          updated_at?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          passing_score?: number | null
          questions?: Json
          updated_at?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_exams_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "foundation_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_external_resources: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          pillar_id: string | null
          resource_type: string
          thumbnail_url: string | null
          title: string
          url: string | null
          year: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          pillar_id?: string | null
          resource_type: string
          thumbnail_url?: string | null
          title: string
          url?: string | null
          year?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          pillar_id?: string | null
          resource_type?: string
          thumbnail_url?: string | null
          title?: string
          url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_external_resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "foundation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_external_resources_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "foundation_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_pillars: {
        Row: {
          arabic_name: string | null
          color: string | null
          created_at: string | null
          description: string | null
          gradient: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          arabic_name?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          arabic_name?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      foundation_progress: {
        Row: {
          attempts: number | null
          created_at: string | null
          exam_in_progress: Json | null
          exam_passed: boolean | null
          exam_passed_at: string | null
          exam_score: number | null
          id: string
          last_attempt_at: string | null
          updated_at: string | null
          user_id: string
          video_id: string
          watched: boolean | null
          watched_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          exam_in_progress?: Json | null
          exam_passed?: boolean | null
          exam_passed_at?: string | null
          exam_score?: number | null
          id?: string
          last_attempt_at?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
          watched?: boolean | null
          watched_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          exam_in_progress?: Json | null
          exam_passed?: boolean | null
          exam_passed_at?: string | null
          exam_score?: number | null
          id?: string
          last_attempt_at?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
          watched?: boolean | null
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "foundation_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_videos: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          transcript: string | null
          transcript_source: string | null
          updated_at: string | null
          video_id: string | null
          video_url: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          transcript_source?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_url: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          transcript_source?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "foundation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      group_session_instances: {
        Row: {
          attended_count: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          insight_id: string | null
          recording_available: boolean | null
          recording_url: string | null
          registered_count: number | null
          room_code: string | null
          room_id: string | null
          scheduled_date: string
          scheduled_time: string
          session_number: number | null
          status: string | null
          student_room_code: string | null
          teacher_id: string | null
          teacher_room_code: string | null
          template_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          attended_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          insight_id?: string | null
          recording_available?: boolean | null
          recording_url?: string | null
          registered_count?: number | null
          room_code?: string | null
          room_id?: string | null
          scheduled_date: string
          scheduled_time: string
          session_number?: number | null
          status?: string | null
          student_room_code?: string | null
          teacher_id?: string | null
          teacher_room_code?: string | null
          template_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          attended_count?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          insight_id?: string | null
          recording_available?: boolean | null
          recording_url?: string | null
          registered_count?: number | null
          room_code?: string | null
          room_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          session_number?: number | null
          status?: string | null
          student_room_code?: string | null
          teacher_id?: string | null
          teacher_room_code?: string | null
          template_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_session_instances_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "group_session_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      group_session_participants: {
        Row: {
          enrolled_at: string | null
          group_session_id: string
          id: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string | null
          group_session_id: string
          id?: string
          student_id: string
        }
        Update: {
          enrolled_at?: string | null
          group_session_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_session_participants_group_session_id_fkey"
            columns: ["group_session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_session_payments: {
        Row: {
          amount: number
          created_at: string | null
          group_session_id: string
          id: string
          paid_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          group_session_id: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          group_session_id?: string
          id?: string
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_session_payments_group_session_id_fkey"
            columns: ["group_session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_session_registrations: {
        Row: {
          amount_paid: number | null
          attendance_time: string | null
          attended: boolean | null
          created_at: string | null
          id: string
          learner_id: string | null
          parent_id: string | null
          payment_status: string | null
          payment_type: string | null
          session_id: string | null
          sessions_remaining: number | null
          status: string | null
          stripe_payment_intent_id: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          attendance_time?: string | null
          attended?: boolean | null
          created_at?: string | null
          id?: string
          learner_id?: string | null
          parent_id?: string | null
          payment_status?: string | null
          payment_type?: string | null
          session_id?: string | null
          sessions_remaining?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          attendance_time?: string | null
          attended?: boolean | null
          created_at?: string | null
          id?: string
          learner_id?: string | null
          parent_id?: string | null
          payment_status?: string | null
          payment_type?: string | null
          session_id?: string | null
          sessions_remaining?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_session_registrations_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_registrations_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_registrations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "group_session_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_registrations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "group_session_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      group_session_templates: {
        Row: {
          age_group: string | null
          age_max: number | null
          age_min: number | null
          allow_guest_teachers: boolean | null
          chat_enabled: boolean | null
          created_at: string | null
          created_by: string | null
          credits_per_session: number | null
          custom_insight_prompt: string | null
          day_of_week: number | null
          description: string | null
          duration_minutes: number
          end_date: string | null
          featured: boolean | null
          gender: string | null
          guest_teacher_ids: string[] | null
          homework_enabled: boolean | null
          id: string
          image_url: string | null
          insight_template_name: string | null
          is_free: boolean | null
          max_participants: number | null
          min_participants: number | null
          name: string
          price_bundle_4: number | null
          price_bundle_8: number | null
          price_per_session: number | null
          recording_enabled: boolean | null
          recurrence: string
          skill_level: string | null
          slug: string
          start_date: string | null
          start_time: string
          status: string | null
          subject_category: string
          teacher_id: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          age_max?: number | null
          age_min?: number | null
          allow_guest_teachers?: boolean | null
          chat_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credits_per_session?: number | null
          custom_insight_prompt?: string | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          featured?: boolean | null
          gender?: string | null
          guest_teacher_ids?: string[] | null
          homework_enabled?: boolean | null
          id?: string
          image_url?: string | null
          insight_template_name?: string | null
          is_free?: boolean | null
          max_participants?: number | null
          min_participants?: number | null
          name: string
          price_bundle_4?: number | null
          price_bundle_8?: number | null
          price_per_session?: number | null
          recording_enabled?: boolean | null
          recurrence?: string
          skill_level?: string | null
          slug: string
          start_date?: string | null
          start_time: string
          status?: string | null
          subject_category: string
          teacher_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          age_max?: number | null
          age_min?: number | null
          allow_guest_teachers?: boolean | null
          chat_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          credits_per_session?: number | null
          custom_insight_prompt?: string | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          featured?: boolean | null
          gender?: string | null
          guest_teacher_ids?: string[] | null
          homework_enabled?: boolean | null
          id?: string
          image_url?: string | null
          insight_template_name?: string | null
          is_free?: boolean | null
          max_participants?: number | null
          min_participants?: number | null
          name?: string
          price_bundle_4?: number | null
          price_bundle_8?: number | null
          price_per_session?: number | null
          recording_enabled?: boolean | null
          recurrence?: string
          skill_level?: string | null
          slug?: string
          start_date?: string | null
          start_time?: string
          status?: string | null
          subject_category?: string
          teacher_id?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_session_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_session_templates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          "100ms_room_id": string | null
          co_teacher_ids: string[] | null
          course_type: string
          created_at: string | null
          created_by: string | null
          current_participants: number
          custom_insight_prompt: string | null
          delivery_mode: string
          description: string | null
          duration_minutes: number
          end_date: string | null
          gender_restriction: string | null
          id: string
          invite_code: string | null
          is_free: boolean
          is_public: boolean
          level: string
          location: string | null
          max_participants: number
          name: string
          notes_discount_code: string | null
          notes_discount_percent: number | null
          poster_url: string | null
          price_per_session: number | null
          schedule_day: string
          schedule_time: string
          slug: string | null
          start_date: string
          status: string
          student_room_code: string | null
          subject_id: string | null
          teacher_id: string | null
          teacher_room_code: string | null
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          "100ms_room_id"?: string | null
          co_teacher_ids?: string[] | null
          course_type?: string
          created_at?: string | null
          created_by?: string | null
          current_participants?: number
          custom_insight_prompt?: string | null
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          gender_restriction?: string | null
          id?: string
          invite_code?: string | null
          is_free?: boolean
          is_public?: boolean
          level: string
          location?: string | null
          max_participants?: number
          name: string
          notes_discount_code?: string | null
          notes_discount_percent?: number | null
          poster_url?: string | null
          price_per_session?: number | null
          schedule_day: string
          schedule_time: string
          slug?: string | null
          start_date: string
          status?: string
          student_room_code?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          teacher_room_code?: string | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          "100ms_room_id"?: string | null
          co_teacher_ids?: string[] | null
          course_type?: string
          created_at?: string | null
          created_by?: string | null
          current_participants?: number
          custom_insight_prompt?: string | null
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          gender_restriction?: string | null
          id?: string
          invite_code?: string | null
          is_free?: boolean
          is_public?: boolean
          level?: string
          location?: string | null
          max_participants?: number
          name?: string
          notes_discount_code?: string | null
          notes_discount_percent?: number | null
          poster_url?: string | null
          price_per_session?: number | null
          schedule_day?: string
          schedule_time?: string
          slug?: string | null
          start_date?: string
          status?: string
          student_room_code?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          teacher_room_code?: string | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_sessions: {
        Row: {
          accuracy_percentage: number | null
          completed_at: string | null
          created_at: string
          current_game_index: number | null
          difficulty_level: string
          external_practice_tips: Json | null
          games: Json
          games_completed: number | null
          id: string
          improvement_metrics: Json | null
          learner_id: string
          lesson_id: string | null
          max_possible_score: number | null
          session_type: string
          started_at: string | null
          status: string
          time_spent_seconds: number | null
          total_games: number | null
          total_score: number | null
          updated_at: string
          weak_areas_targeted: Json | null
        }
        Insert: {
          accuracy_percentage?: number | null
          completed_at?: string | null
          created_at?: string
          current_game_index?: number | null
          difficulty_level?: string
          external_practice_tips?: Json | null
          games?: Json
          games_completed?: number | null
          id?: string
          improvement_metrics?: Json | null
          learner_id: string
          lesson_id?: string | null
          max_possible_score?: number | null
          session_type?: string
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          total_games?: number | null
          total_score?: number | null
          updated_at?: string
          weak_areas_targeted?: Json | null
        }
        Update: {
          accuracy_percentage?: number | null
          completed_at?: string | null
          created_at?: string
          current_game_index?: number | null
          difficulty_level?: string
          external_practice_tips?: Json | null
          games?: Json
          games_completed?: number | null
          id?: string
          improvement_metrics?: Json | null
          learner_id?: string
          lesson_id?: string | null
          max_possible_score?: number | null
          session_type?: string
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          total_games?: number | null
          total_score?: number | null
          updated_at?: string
          weak_areas_targeted?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          areas_to_focus: string[] | null
          best_quiz_score: number | null
          completed_tasks: Json | null
          confidence_level: number | null
          confidence_rating: number | null
          course_type: string | null
          created_at: string | null
          difficulty_rating: number | null
          first_attempt_answers: Json | null
          first_attempt_at: string | null
          first_attempt_score: number | null
          first_attempt_total: number | null
          id: string
          insight_id: string | null
          last_quiz_attempt_at: string | null
          learner_id: string
          lesson_id: string | null
          parent_id: string | null
          questions_for_teacher: string | null
          quiz_answers: Json | null
          quiz_completed_at: string | null
          quiz_score: number | null
          quiz_total: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          student_notes: string | null
          submitted_at: string | null
          syllabus_id: string | null
          tasks_completed_count: number | null
          tasks_total_count: number | null
          teacher_encouragement: string | null
          teacher_feedback: string | null
          teacher_id: string | null
          teacher_rating: string | null
          time_spent_minutes: number | null
          total_quiz_attempts: number | null
          updated_at: string | null
          uploaded_files: Json | null
          vocabulary_practiced: Json | null
          vocabulary_practiced_count: number | null
        }
        Insert: {
          areas_to_focus?: string[] | null
          best_quiz_score?: number | null
          completed_tasks?: Json | null
          confidence_level?: number | null
          confidence_rating?: number | null
          course_type?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          first_attempt_answers?: Json | null
          first_attempt_at?: string | null
          first_attempt_score?: number | null
          first_attempt_total?: number | null
          id?: string
          insight_id?: string | null
          last_quiz_attempt_at?: string | null
          learner_id: string
          lesson_id?: string | null
          parent_id?: string | null
          questions_for_teacher?: string | null
          quiz_answers?: Json | null
          quiz_completed_at?: string | null
          quiz_score?: number | null
          quiz_total?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_notes?: string | null
          submitted_at?: string | null
          syllabus_id?: string | null
          tasks_completed_count?: number | null
          tasks_total_count?: number | null
          teacher_encouragement?: string | null
          teacher_feedback?: string | null
          teacher_id?: string | null
          teacher_rating?: string | null
          time_spent_minutes?: number | null
          total_quiz_attempts?: number | null
          updated_at?: string | null
          uploaded_files?: Json | null
          vocabulary_practiced?: Json | null
          vocabulary_practiced_count?: number | null
        }
        Update: {
          areas_to_focus?: string[] | null
          best_quiz_score?: number | null
          completed_tasks?: Json | null
          confidence_level?: number | null
          confidence_rating?: number | null
          course_type?: string | null
          created_at?: string | null
          difficulty_rating?: number | null
          first_attempt_answers?: Json | null
          first_attempt_at?: string | null
          first_attempt_score?: number | null
          first_attempt_total?: number | null
          id?: string
          insight_id?: string | null
          last_quiz_attempt_at?: string | null
          learner_id?: string
          lesson_id?: string | null
          parent_id?: string | null
          questions_for_teacher?: string | null
          quiz_answers?: Json | null
          quiz_completed_at?: string | null
          quiz_score?: number | null
          quiz_total?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          student_notes?: string | null
          submitted_at?: string | null
          syllabus_id?: string | null
          tasks_completed_count?: number | null
          tasks_total_count?: number | null
          teacher_encouragement?: string | null
          teacher_feedback?: string | null
          teacher_id?: string | null
          teacher_rating?: string | null
          time_spent_minutes?: number | null
          total_quiz_attempts?: number | null
          updated_at?: string | null
          uploaded_files?: Json | null
          vocabulary_practiced?: Json | null
          vocabulary_practiced_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "lesson_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "homework_submissions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "arabic_syllabus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "homework_submissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      imam_conversations: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imam_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      independent_markup_tiers: {
        Row: {
          created_at: string | null
          id: string
          label: string
          markup_percentage: number
          min_hours_taught: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          markup_percentage: number
          min_hours_taught: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          markup_percentage?: number
          min_hours_taught?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      insight_issue_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          learner_id: string | null
          lesson_id: string
          recovery_triggered: boolean
          reported_by: string | null
          reporter_email: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          learner_id?: string | null
          lesson_id: string
          recovery_triggered?: boolean
          reported_by?: string | null
          reporter_email?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          learner_id?: string | null
          lesson_id?: string
          recovery_triggered?: boolean
          reported_by?: string | null
          reporter_email?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_issue_reports_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_issue_reports_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_issue_reports_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_issue_reports_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      insight_templates: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          include_homework: boolean | null
          include_quiz: boolean | null
          include_vocabulary: boolean | null
          is_default: boolean | null
          name: string
          output_format: string | null
          quiz_questions: number | null
          subject_category: string
          system_prompt: string
          updated_at: string | null
          vocabulary_limit: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          include_homework?: boolean | null
          include_quiz?: boolean | null
          include_vocabulary?: boolean | null
          is_default?: boolean | null
          name: string
          output_format?: string | null
          quiz_questions?: number | null
          subject_category: string
          system_prompt: string
          updated_at?: string | null
          vocabulary_limit?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          include_homework?: boolean | null
          include_quiz?: boolean | null
          include_vocabulary?: boolean | null
          is_default?: boolean | null
          name?: string
          output_format?: string | null
          quiz_questions?: number | null
          subject_category?: string
          system_prompt?: string
          updated_at?: string | null
          vocabulary_limit?: number | null
        }
        Relationships: []
      }
      interview_booking_tokens: {
        Row: {
          candidate_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          interview_id: string | null
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          interview_id?: string | null
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          interview_id?: string | null
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_booking_tokens_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_booking_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_booking_tokens_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "recruitment_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          evidence_examined: string[] | null
          id: string
          pillar_slug: string
          step_reached: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          evidence_examined?: string[] | null
          id?: string
          pillar_slug: string
          step_reached?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          evidence_examined?: string[] | null
          id?: string
          pillar_slug?: string
          step_reached?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      khutba_insights: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          insights: Json
          is_public: boolean | null
          khutba_date: string | null
          location: string | null
          notified_dashboard_at: string | null
          notified_email_at: string | null
          notified_email_count: number | null
          original_text: string | null
          speaker: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          insights: Json
          is_public?: boolean | null
          khutba_date?: string | null
          location?: string | null
          notified_dashboard_at?: string | null
          notified_email_at?: string | null
          notified_email_count?: number | null
          original_text?: string | null
          speaker?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          insights?: Json
          is_public?: boolean | null
          khutba_date?: string | null
          location?: string | null
          notified_dashboard_at?: string | null
          notified_email_at?: string | null
          notified_email_count?: number | null
          original_text?: string | null
          speaker?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_gaps: {
        Row: {
          category: string
          confidence_score: number | null
          created_at: string
          evidence: Json | null
          external_practice_tips: Json | null
          first_identified_at: string | null
          id: string
          improvement_rate: number | null
          last_assessed_at: string | null
          learner_id: string
          resolved_at: string | null
          severity: string
          source_id: string | null
          source_type: string
          status: string
          subcategory: string | null
          times_targeted: number | null
          updated_at: string
        }
        Insert: {
          category: string
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          external_practice_tips?: Json | null
          first_identified_at?: string | null
          id?: string
          improvement_rate?: number | null
          last_assessed_at?: string | null
          learner_id: string
          resolved_at?: string | null
          severity?: string
          source_id?: string | null
          source_type: string
          status?: string
          subcategory?: string | null
          times_targeted?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          external_practice_tips?: Json | null
          first_identified_at?: string | null
          id?: string
          improvement_rate?: number | null
          last_assessed_at?: string | null
          learner_id?: string
          resolved_at?: string | null
          severity?: string
          source_id?: string | null
          source_type?: string
          status?: string
          subcategory?: string | null
          times_targeted?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_gaps_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_gaps_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_alphabet_progress: {
        Row: {
          created_at: string
          id: string
          learner_id: string
          letter_id: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          learner_id: string
          letter_id: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          learner_id?: string
          letter_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_alphabet_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_alphabet_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      learners: {
        Row: {
          age: number | null
          current_level: number | null
          current_streak: number | null
          daily_review_rotation_index: number | null
          date_of_birth: string | null
          first_name: string | null
          gamification_points: number | null
          gender: string | null
          id: string
          is_self: boolean | null
          last_login_date: string | null
          last_maintenance_date: string | null
          learning_credits: number | null
          learning_goals: string[] | null
          login_streak: number | null
          longest_streak: number | null
          name: string | null
          parent_id: string
          referral_code: string | null
          referred_by: string | null
          salah_surah_rotation_index: number | null
          school_year: string | null
          show_transliteration: boolean
          total_maintenance_sessions: number | null
          total_points: number | null
          total_xp: number | null
        }
        Insert: {
          age?: number | null
          current_level?: number | null
          current_streak?: number | null
          daily_review_rotation_index?: number | null
          date_of_birth?: string | null
          first_name?: string | null
          gamification_points?: number | null
          gender?: string | null
          id?: string
          is_self?: boolean | null
          last_login_date?: string | null
          last_maintenance_date?: string | null
          learning_credits?: number | null
          learning_goals?: string[] | null
          login_streak?: number | null
          longest_streak?: number | null
          name?: string | null
          parent_id: string
          referral_code?: string | null
          referred_by?: string | null
          salah_surah_rotation_index?: number | null
          school_year?: string | null
          show_transliteration?: boolean
          total_maintenance_sessions?: number | null
          total_points?: number | null
          total_xp?: number | null
        }
        Update: {
          age?: number | null
          current_level?: number | null
          current_streak?: number | null
          daily_review_rotation_index?: number | null
          date_of_birth?: string | null
          first_name?: string | null
          gamification_points?: number | null
          gender?: string | null
          id?: string
          is_self?: boolean | null
          last_login_date?: string | null
          last_maintenance_date?: string | null
          learning_credits?: number | null
          learning_goals?: string[] | null
          login_streak?: number | null
          longest_streak?: number | null
          name?: string | null
          parent_id?: string
          referral_code?: string | null
          referred_by?: string | null
          salah_surah_rotation_index?: number | null
          school_year?: string | null
          show_transliteration?: boolean
          total_maintenance_sessions?: number | null
          total_points?: number | null
          total_xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learners_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_teacher_students: {
        Row: {
          created_at: string | null
          id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_teacher_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_teacher_students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "legacy_teacher_students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_teacher_students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "legacy_teacher_students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      lesson_details: {
        Row: {
          areas_for_improvement: string | null
          ayat_range_end: number | null
          ayat_range_start: number | null
          created_at: string | null
          homework_assigned: boolean | null
          id: string
          lesson_id: string
          milestones_addressed: string[] | null
          milestones_verified: string[] | null
          recommended_focus: string | null
          strengths_observed: string | null
          surahs_practiced: number[] | null
          teacher_notes: string | null
          topics_covered: string[] | null
          updated_at: string | null
        }
        Insert: {
          areas_for_improvement?: string | null
          ayat_range_end?: number | null
          ayat_range_start?: number | null
          created_at?: string | null
          homework_assigned?: boolean | null
          id?: string
          lesson_id: string
          milestones_addressed?: string[] | null
          milestones_verified?: string[] | null
          recommended_focus?: string | null
          strengths_observed?: string | null
          surahs_practiced?: number[] | null
          teacher_notes?: string | null
          topics_covered?: string[] | null
          updated_at?: string | null
        }
        Update: {
          areas_for_improvement?: string | null
          ayat_range_end?: number | null
          ayat_range_start?: number | null
          created_at?: string | null
          homework_assigned?: boolean | null
          id?: string
          lesson_id?: string
          milestones_addressed?: string[] | null
          milestones_verified?: string[] | null
          recommended_focus?: string | null
          strengths_observed?: string | null
          surahs_practiced?: number[] | null
          teacher_notes?: string | null
          topics_covered?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_details_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_details_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          created_at: string | null
          id: string
          issue_detail: string | null
          issue_type: string | null
          lesson_id: string
          student_id: string
          teacher_id: string
          thumbs_up: boolean
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_detail?: string | null
          issue_type?: string | null
          lesson_id: string
          student_id: string
          teacher_id: string
          thumbs_up: boolean
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_detail?: string | null
          issue_type?: string | null
          lesson_id?: string
          student_id?: string
          teacher_id?: string
          thumbs_up?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "lesson_feedback_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "lesson_feedback_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      lesson_insights: {
        Row: {
          ai_model: string | null
          areas_for_improvement: string[] | null
          areas_of_strength: string[] | null
          comprehension_level: string | null
          confidence_score: number | null
          created_at: string | null
          detailed_insights: Json | null
          id: string
          insight_type: string | null
          key_topics: string[] | null
          learner_id: string | null
          lesson_id: string
          processing_time_ms: number | null
          questions_asked: number | null
          raw_transcript: string | null
          recommendations: string[] | null
          recording_id: string | null
          student_participation_score: number | null
          student_rating: number | null
          student_viewed_at: string | null
          subject_id: string | null
          summary: string
          teacher_feedback: string | null
          teacher_id: string | null
          title: string
          updated_at: string | null
          viewed_by_student: boolean | null
          vocabulary_used: string[] | null
        }
        Insert: {
          ai_model?: string | null
          areas_for_improvement?: string[] | null
          areas_of_strength?: string[] | null
          comprehension_level?: string | null
          confidence_score?: number | null
          created_at?: string | null
          detailed_insights?: Json | null
          id?: string
          insight_type?: string | null
          key_topics?: string[] | null
          learner_id?: string | null
          lesson_id: string
          processing_time_ms?: number | null
          questions_asked?: number | null
          raw_transcript?: string | null
          recommendations?: string[] | null
          recording_id?: string | null
          student_participation_score?: number | null
          student_rating?: number | null
          student_viewed_at?: string | null
          subject_id?: string | null
          summary: string
          teacher_feedback?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string | null
          viewed_by_student?: boolean | null
          vocabulary_used?: string[] | null
        }
        Update: {
          ai_model?: string | null
          areas_for_improvement?: string[] | null
          areas_of_strength?: string[] | null
          comprehension_level?: string | null
          confidence_score?: number | null
          created_at?: string | null
          detailed_insights?: Json | null
          id?: string
          insight_type?: string | null
          key_topics?: string[] | null
          learner_id?: string | null
          lesson_id?: string
          processing_time_ms?: number | null
          questions_asked?: number | null
          raw_transcript?: string | null
          recommendations?: string[] | null
          recording_id?: string | null
          student_participation_score?: number | null
          student_rating?: number | null
          student_viewed_at?: string | null
          subject_id?: string | null
          summary?: string
          teacher_feedback?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string | null
          viewed_by_student?: boolean | null
          vocabulary_used?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_insights_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_insights_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_insights_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_insights_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_insights_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "lesson_recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_insights_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_insights_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "lesson_insights_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_insights_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "lesson_insights_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      lesson_messages: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          message_data: Json | null
          message_text: string
          parent_message_id: string | null
          read_at: string | null
          responded_at: string | null
          sender_id: string
          sender_role: string
          status: string | null
          template_code: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          message_data?: Json | null
          message_text: string
          parent_message_id?: string | null
          read_at?: string | null
          responded_at?: string | null
          sender_id: string
          sender_role: string
          status?: string | null
          template_code: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          message_data?: Json | null
          message_text?: string
          parent_message_id?: string | null
          read_at?: string | null
          responded_at?: string | null
          sender_id?: string
          sender_role?: string
          status?: string | null
          template_code?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "lesson_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress_tracker: {
        Row: {
          fluency_complete: boolean | null
          id: string
          learner_id: string
          memorization_complete: boolean | null
          subject_id: string
          teacher_notes: string | null
          topic: string
          understanding_complete: boolean | null
        }
        Insert: {
          fluency_complete?: boolean | null
          id?: string
          learner_id: string
          memorization_complete?: boolean | null
          subject_id: string
          teacher_notes?: string | null
          topic: string
          understanding_complete?: boolean | null
        }
        Update: {
          fluency_complete?: boolean | null
          id?: string
          learner_id?: string
          memorization_complete?: boolean | null
          subject_id?: string
          teacher_notes?: string | null
          topic?: string
          understanding_complete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_tracker_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_tracker_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_tracker_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_recordings: {
        Row: {
          ai_notes: Json | null
          created_at: string | null
          duration_minutes: number | null
          file_size_mb: number | null
          id: string
          lesson_id: string | null
          recording_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          ai_notes?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          file_size_mb?: number | null
          id?: string
          lesson_id?: string | null
          recording_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          ai_notes?: Json | null
          created_at?: string | null
          duration_minutes?: number | null
          file_size_mb?: number | null
          id?: string
          lesson_id?: string | null
          recording_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_recordings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          "100ms_room_id": string | null
          acknowledged_at: string | null
          auto_acknowledged: boolean | null
          booked_at: string | null
          cancelled_at: string | null
          compensation_amount: number | null
          compensation_paid_at: string | null
          confirmation_requested_at: string | null
          confirmation_status: string | null
          created_at: string | null
          decline_reason: string | null
          declined_at: string | null
          duration_minutes: number
          free_insights_trial: boolean | null
          id: string
          independent_teacher_rate: number | null
          insight_recovery_alerted: boolean
          insights_addon: boolean | null
          insights_addon_payment_id: string | null
          insights_addon_price: number | null
          is_free_trial: boolean | null
          is_independent: boolean | null
          is_late_cancellation: boolean | null
          is_trial: boolean | null
          learner_id: string
          lesson_tier: string | null
          lesson_type: string
          markup_percentage_at_booking: number | null
          paid_at: string | null
          parent_id: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          platform_fee: number | null
          quran_focus: string | null
          recording_expires_at: string | null
          recording_url: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          reminder_sent: boolean
          scheduled_time: string
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          student_id: string | null
          student_join_nudge_sent: boolean
          student_joined_at: string | null
          student_room_code: string | null
          subject_id: string
          suggested_alternative_times: Json | null
          teacher_acknowledgment_message: string | null
          teacher_compensated: boolean | null
          teacher_confirmed: boolean | null
          teacher_confirmed_at: string | null
          teacher_id: string
          teacher_join_nudge_sent: boolean
          teacher_joined_at: string | null
          teacher_rate_at_booking: number | null
          teacher_room_code: string | null
          total_cost_paid: number | null
          updated_at: string | null
        }
        Insert: {
          "100ms_room_id"?: string | null
          acknowledged_at?: string | null
          auto_acknowledged?: boolean | null
          booked_at?: string | null
          cancelled_at?: string | null
          compensation_amount?: number | null
          compensation_paid_at?: string | null
          confirmation_requested_at?: string | null
          confirmation_status?: string | null
          created_at?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          duration_minutes: number
          free_insights_trial?: boolean | null
          id?: string
          independent_teacher_rate?: number | null
          insight_recovery_alerted?: boolean
          insights_addon?: boolean | null
          insights_addon_payment_id?: string | null
          insights_addon_price?: number | null
          is_free_trial?: boolean | null
          is_independent?: boolean | null
          is_late_cancellation?: boolean | null
          is_trial?: boolean | null
          learner_id: string
          lesson_tier?: string | null
          lesson_type?: string
          markup_percentage_at_booking?: number | null
          paid_at?: string | null
          parent_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          quran_focus?: string | null
          recording_expires_at?: string | null
          recording_url?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          reminder_sent?: boolean
          scheduled_time: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          student_join_nudge_sent?: boolean
          student_joined_at?: string | null
          student_room_code?: string | null
          subject_id: string
          suggested_alternative_times?: Json | null
          teacher_acknowledgment_message?: string | null
          teacher_compensated?: boolean | null
          teacher_confirmed?: boolean | null
          teacher_confirmed_at?: string | null
          teacher_id: string
          teacher_join_nudge_sent?: boolean
          teacher_joined_at?: string | null
          teacher_rate_at_booking?: number | null
          teacher_room_code?: string | null
          total_cost_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          "100ms_room_id"?: string | null
          acknowledged_at?: string | null
          auto_acknowledged?: boolean | null
          booked_at?: string | null
          cancelled_at?: string | null
          compensation_amount?: number | null
          compensation_paid_at?: string | null
          confirmation_requested_at?: string | null
          confirmation_status?: string | null
          created_at?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          duration_minutes?: number
          free_insights_trial?: boolean | null
          id?: string
          independent_teacher_rate?: number | null
          insight_recovery_alerted?: boolean
          insights_addon?: boolean | null
          insights_addon_payment_id?: string | null
          insights_addon_price?: number | null
          is_free_trial?: boolean | null
          is_independent?: boolean | null
          is_late_cancellation?: boolean | null
          is_trial?: boolean | null
          learner_id?: string
          lesson_tier?: string | null
          lesson_type?: string
          markup_percentage_at_booking?: number | null
          paid_at?: string | null
          parent_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          quran_focus?: string | null
          recording_expires_at?: string | null
          recording_url?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          reminder_sent?: boolean
          scheduled_time?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          student_join_nudge_sent?: boolean
          student_joined_at?: string | null
          student_room_code?: string | null
          subject_id?: string
          suggested_alternative_times?: Json | null
          teacher_acknowledgment_message?: string | null
          teacher_compensated?: boolean | null
          teacher_confirmed?: boolean | null
          teacher_confirmed_at?: string | null
          teacher_id?: string
          teacher_join_nudge_sent?: boolean
          teacher_joined_at?: string | null
          teacher_rate_at_booking?: number | null
          teacher_room_code?: string | null
          total_cost_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      madrasa_attendance: {
        Row: {
          learner_id: string
          marked_at: string
          marked_by: string | null
          session_id: string
          status: string
        }
        Insert: {
          learner_id: string
          marked_at?: string
          marked_by?: string | null
          session_id: string
          status: string
        }
        Update: {
          learner_id?: string
          marked_at?: string
          marked_by?: string | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_attendance_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_attendance_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "madrasa_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_class_enrolments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          learner_id: string
          status: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          learner_id: string
          status?: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          learner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_class_enrolments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "madrasa_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_class_enrolments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_class_enrolments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_class_schedule: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_provisional: boolean
          start_time: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_provisional?: boolean
          start_time: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_provisional?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_class_schedule_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "madrasa_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_classes: {
        Row: {
          academic_year: string | null
          age_band: string
          created_at: string
          id: string
          is_active: boolean
          learner_type: string
          name: string
          organisation_id: string
          subject_id: string | null
          syllabus_reference: string | null
          teacher_id: string | null
          term: string | null
          term_end: string | null
          term_start: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          age_band: string
          created_at?: string
          id?: string
          is_active?: boolean
          learner_type?: string
          name: string
          organisation_id: string
          subject_id?: string | null
          syllabus_reference?: string | null
          teacher_id?: string | null
          term?: string | null
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          age_band?: string
          created_at?: string
          id?: string
          is_active?: boolean
          learner_type?: string
          name?: string
          organisation_id?: string
          subject_id?: string | null
          syllabus_reference?: string | null
          teacher_id?: string | null
          term?: string | null
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_classes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "madrasa_organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_org_members: {
        Row: {
          created_at: string
          id: string
          organisation_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organisation_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organisation_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_org_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "madrasa_organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_organisations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      madrasa_session_materials: {
        Row: {
          ai_model: string | null
          created_at: string
          edited_at: string | null
          generated_at: string | null
          homework: string | null
          id: string
          parent_notes: string | null
          parents_notified_at: string | null
          published_at: string | null
          published_by: string | null
          session_id: string
          status: string
          teacher_activities: Json
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          edited_at?: string | null
          generated_at?: string | null
          homework?: string | null
          id?: string
          parent_notes?: string | null
          parents_notified_at?: string | null
          published_at?: string | null
          published_by?: string | null
          session_id: string
          status?: string
          teacher_activities?: Json
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          edited_at?: string | null
          generated_at?: string | null
          homework?: string | null
          id?: string
          parent_notes?: string | null
          parents_notified_at?: string | null
          published_at?: string | null
          published_by?: string | null
          session_id?: string
          status?: string
          teacher_activities?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_session_materials_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_session_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "madrasa_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_session_units: {
        Row: {
          session_id: string
          unit_id: string
        }
        Insert: {
          session_id: string
          unit_id: string
        }
        Update: {
          session_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_session_units_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "madrasa_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_session_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "madrasa_units"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_sessions: {
        Row: {
          class_id: string
          closed_at: string | null
          created_at: string
          end_time: string
          id: string
          session_date: string
          start_time: string
          status: string
          taught_by: string | null
          teacher_emphasis: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          closed_at?: string | null
          created_at?: string
          end_time: string
          id?: string
          session_date: string
          start_time: string
          status?: string
          taught_by?: string | null
          teacher_emphasis?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          closed_at?: string | null
          created_at?: string
          end_time?: string
          id?: string
          session_date?: string
          start_time?: string
          status?: string
          taught_by?: string | null
          teacher_emphasis?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "madrasa_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_sessions_taught_by_fkey"
            columns: ["taught_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_unit_prep: {
        Row: {
          ai_model: string | null
          generated_at: string
          generated_by: string | null
          id: string
          teacher_activities: Json
          unit_id: string
        }
        Insert: {
          ai_model?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          teacher_activities?: Json
          unit_id: string
        }
        Update: {
          ai_model?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          teacher_activities?: Json
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_unit_prep_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_unit_prep_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "madrasa_units"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_unit_progress: {
        Row: {
          catchup_assigned_at: string | null
          catchup_completed_at: string | null
          catchup_mode: string | null
          class_id: string
          covered_at: string | null
          learner_id: string
          session_id: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          catchup_assigned_at?: string | null
          catchup_completed_at?: string | null
          catchup_mode?: string | null
          class_id: string
          covered_at?: string | null
          learner_id: string
          session_id?: string | null
          status: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          catchup_assigned_at?: string | null
          catchup_completed_at?: string | null
          catchup_mode?: string | null
          class_id?: string
          covered_at?: string | null
          learner_id?: string
          session_id?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_unit_progress_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "madrasa_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_unit_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_unit_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_unit_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "madrasa_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madrasa_unit_progress_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "madrasa_units"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasa_units: {
        Row: {
          book_reference: string | null
          class_id: string
          created_at: string
          description: string | null
          id: string
          page_from: number | null
          page_to: number | null
          title: string
          unit_number: number
          updated_at: string
        }
        Insert: {
          book_reference?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          id?: string
          page_from?: number | null
          page_to?: number | null
          title: string
          unit_number: number
          updated_at?: string
        }
        Update: {
          book_reference?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          page_from?: number | null
          page_to?: number | null
          title?: string
          unit_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "madrasa_units_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "madrasa_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_profiles: {
        Row: {
          admin_notes: string | null
          character_references: string[] | null
          created_at: string | null
          id: string
          profile_data: Json
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          character_references?: string[] | null
          created_at?: string | null
          id?: string
          profile_data: Json
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          character_references?: string[] | null
          created_at?: string | null
          id?: string
          profile_data?: Json
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mcf_analyses: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          result: string | null
          session_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          result?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          result?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcf_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mcf_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcf_journal: {
        Row: {
          created_at: string | null
          entry: string
          id: string
          linked_question_id: string | null
          person: string
          session_id: string | null
          structured: Json | null
        }
        Insert: {
          created_at?: string | null
          entry: string
          id?: string
          linked_question_id?: string | null
          person: string
          session_id?: string | null
          structured?: Json | null
        }
        Update: {
          created_at?: string | null
          entry?: string
          id?: string
          linked_question_id?: string | null
          person?: string
          session_id?: string | null
          structured?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mcf_journal_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mcf_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcf_profiles: {
        Row: {
          about_tags: Json | null
          about_text: string | null
          age_range: string | null
          country_of_origin: string | null
          currently_living: string | null
          dob: string | null
          email: string | null
          has_children: string | null
          height_cm: number | null
          id: string
          ideal_situation_text: string | null
          know_tags: Json | null
          know_text: string | null
          last_viewed_at: string | null
          looking_tags: Json | null
          looking_text: string | null
          nationality: string | null
          person: string
          phone: string | null
          photo_urls: Json | null
          place_of_birth: string | null
          profession: string | null
          session_id: string | null
          updated_at: string | null
          value_tags: Json | null
          values_text: string | null
          video_url: string | null
          wants_children: string | null
        }
        Insert: {
          about_tags?: Json | null
          about_text?: string | null
          age_range?: string | null
          country_of_origin?: string | null
          currently_living?: string | null
          dob?: string | null
          email?: string | null
          has_children?: string | null
          height_cm?: number | null
          id?: string
          ideal_situation_text?: string | null
          know_tags?: Json | null
          know_text?: string | null
          last_viewed_at?: string | null
          looking_tags?: Json | null
          looking_text?: string | null
          nationality?: string | null
          person: string
          phone?: string | null
          photo_urls?: Json | null
          place_of_birth?: string | null
          profession?: string | null
          session_id?: string | null
          updated_at?: string | null
          value_tags?: Json | null
          values_text?: string | null
          video_url?: string | null
          wants_children?: string | null
        }
        Update: {
          about_tags?: Json | null
          about_text?: string | null
          age_range?: string | null
          country_of_origin?: string | null
          currently_living?: string | null
          dob?: string | null
          email?: string | null
          has_children?: string | null
          height_cm?: number | null
          id?: string
          ideal_situation_text?: string | null
          know_tags?: Json | null
          know_text?: string | null
          last_viewed_at?: string | null
          looking_tags?: Json | null
          looking_text?: string | null
          nationality?: string | null
          person?: string
          phone?: string | null
          photo_urls?: Json | null
          place_of_birth?: string | null
          profession?: string | null
          session_id?: string | null
          updated_at?: string | null
          value_tags?: Json | null
          values_text?: string | null
          video_url?: string | null
          wants_children?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcf_profiles_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mcf_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcf_questions: {
        Row: {
          archived: boolean
          chapter_id: number
          chapter_subtitle: string | null
          chapter_title: string
          created_at: string | null
          id: string
          note: string | null
          options: Json
          person: string
          sort_order: number
          stage: number
          text: string
          type: string
        }
        Insert: {
          archived?: boolean
          chapter_id: number
          chapter_subtitle?: string | null
          chapter_title: string
          created_at?: string | null
          id: string
          note?: string | null
          options: Json
          person?: string
          sort_order: number
          stage?: number
          text: string
          type: string
        }
        Update: {
          archived?: boolean
          chapter_id?: number
          chapter_subtitle?: string | null
          chapter_title?: string
          created_at?: string | null
          id?: string
          note?: string | null
          options?: Json
          person?: string
          sort_order?: number
          stage?: number
          text?: string
          type?: string
        }
        Relationships: []
      }
      mcf_reflections: {
        Row: {
          chapter_id: number
          id: number
          sort_order: number
          text: string
        }
        Insert: {
          chapter_id: number
          id?: number
          sort_order?: number
          text: string
        }
        Update: {
          chapter_id?: number
          id?: number
          sort_order?: number
          text?: string
        }
        Relationships: []
      }
      mcf_responses: {
        Row: {
          amber_tags: string[]
          answers: string[]
          id: string
          note: string | null
          person: string
          question_id: string
          red_tags: string[]
          session_id: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          amber_tags?: string[]
          answers?: string[]
          id?: string
          note?: string | null
          person: string
          question_id: string
          red_tags?: string[]
          session_id?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          amber_tags?: string[]
          answers?: string[]
          id?: string
          note?: string | null
          person?: string
          question_id?: string
          red_tags?: string[]
          session_id?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcf_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mcf_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcf_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mcf_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcf_sessions: {
        Row: {
          code: string
          created_at: string | null
          her_name: string | null
          his_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          her_name?: string | null
          his_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          her_name?: string | null
          his_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_audit_log: {
        Row: {
          attempted_message: string | null
          created_at: string | null
          flagged_reason: string
          id: string
          ip_address: string | null
          lesson_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempted_message?: string | null
          created_at?: string | null
          flagged_reason: string
          id?: string
          ip_address?: string | null
          lesson_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempted_message?: string | null
          created_at?: string | null
          flagged_reason?: string
          id?: string
          ip_address?: string | null
          lesson_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_audit_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_audit_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "message_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "lesson_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          requires_data: Json | null
          requires_response: boolean | null
          sender_role: string
          template_code: string
          template_text: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          requires_data?: Json | null
          requires_response?: boolean | null
          sender_role: string
          template_code: string
          template_text: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          requires_data?: Json | null
          requires_response?: boolean | null
          sender_role?: string
          template_code?: string
          template_text?: string
        }
        Relationships: []
      }
      monthly_khutbah_usage: {
        Row: {
          created_at: string | null
          id: string
          khutbahs_generated: number
          month_year: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          khutbahs_generated?: number
          month_year: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          khutbahs_generated?: number
          month_year?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_khutbah_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_checklist_items: {
        Row: {
          check_type: string
          description: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          check_type: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          check_type?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      onboarding_resources: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          description_arabic: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          language: string
          resource_type: string
          sort_order: number | null
          title: string
          title_arabic: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_arabic?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          language?: string
          resource_type: string
          sort_order?: number | null
          title: string
          title_arabic?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_arabic?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          language?: string
          resource_type?: string
          sort_order?: number | null
          title?: string
          title_arabic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_children: {
        Row: {
          account_id: string | null
          child_age: number | null
          child_dob: string | null
          child_gender: string | null
          child_id: string | null
          child_name: string | null
          created_at: string
          has_account: boolean | null
          id: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          child_age?: number | null
          child_dob?: string | null
          child_gender?: string | null
          child_id?: string | null
          child_name?: string | null
          created_at?: string
          has_account?: boolean | null
          id?: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          child_age?: number | null
          child_dob?: string | null
          child_gender?: string | null
          child_id?: string | null
          child_name?: string | null
          created_at?: string
          has_account?: boolean | null
          id?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount: number | null
          checkout_session_id: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          lesson_id: string | null
          payment_intent_id: string | null
          payment_status: string | null
          raw_event_data: Json | null
          stripe_event_id: string | null
        }
        Insert: {
          amount?: number | null
          checkout_session_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          lesson_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          raw_event_data?: Json | null
          stripe_event_id?: string | null
        }
        Update: {
          amount?: number | null
          checkout_session_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          lesson_id?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          raw_event_data?: Json | null
          stripe_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      pending_bookings: {
        Row: {
          booking_data: Json
          created_at: string | null
          expires_at: string | null
          id: string
          session_count: number
          status: string | null
          stripe_session_id: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_data: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_count: number
          status?: string | null
          stripe_session_id?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_data?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_count?: number
          status?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          auto_generate_insights: boolean | null
          auto_record_lessons: boolean | null
          cancellation_window_hours: number | null
          created_at: string | null
          daily_login_reward_xp: number | null
          default_lesson_duration: number | null
          default_lesson_price_per_credit: number | null
          email_notifications_enabled: boolean | null
          id: number
          lesson_reminder_hours: number | null
          maintenance_mode: boolean | null
          max_booking_days_ahead: number | null
          min_credits_purchase: number | null
          platform_name: string | null
          recording_retention_days: number | null
          referral_reward_credits: number | null
          support_email: string | null
          updated_at: string | null
          video_provider: string | null
          xp_per_lesson_completed: number | null
          xp_per_streak_day: number | null
        }
        Insert: {
          auto_generate_insights?: boolean | null
          auto_record_lessons?: boolean | null
          cancellation_window_hours?: number | null
          created_at?: string | null
          daily_login_reward_xp?: number | null
          default_lesson_duration?: number | null
          default_lesson_price_per_credit?: number | null
          email_notifications_enabled?: boolean | null
          id?: number
          lesson_reminder_hours?: number | null
          maintenance_mode?: boolean | null
          max_booking_days_ahead?: number | null
          min_credits_purchase?: number | null
          platform_name?: string | null
          recording_retention_days?: number | null
          referral_reward_credits?: number | null
          support_email?: string | null
          updated_at?: string | null
          video_provider?: string | null
          xp_per_lesson_completed?: number | null
          xp_per_streak_day?: number | null
        }
        Update: {
          auto_generate_insights?: boolean | null
          auto_record_lessons?: boolean | null
          cancellation_window_hours?: number | null
          created_at?: string | null
          daily_login_reward_xp?: number | null
          default_lesson_duration?: number | null
          default_lesson_price_per_credit?: number | null
          email_notifications_enabled?: boolean | null
          id?: number
          lesson_reminder_hours?: number | null
          maintenance_mode?: boolean | null
          max_booking_days_ahead?: number | null
          min_credits_purchase?: number | null
          platform_name?: string | null
          recording_retention_days?: number | null
          referral_reward_credits?: number | null
          support_email?: string | null
          updated_at?: string | null
          video_provider?: string | null
          xp_per_lesson_completed?: number | null
          xp_per_streak_day?: number | null
        }
        Relationships: []
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anchor_completed: boolean | null
          arabic_font_style: string | null
          attends_cheadle_masjid: boolean
          avatar_url: string | null
          created_at: string | null
          dashboard_widgets: Json | null
          date_of_birth: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          diagnostic_assessment_id: string | null
          diagnostic_completed_at: string | null
          email: string | null
          email_notifications: boolean | null
          explore_completed: boolean | null
          explore_progress: Json | null
          full_name: string | null
          gender: string | null
          hard_delete_at: string | null
          has_completed_diagnostic: boolean | null
          has_used_free_trial: boolean | null
          how_heard_about_us: string | null
          id: string
          is_admin: boolean | null
          is_legacy_student: boolean | null
          linked_parent_id: string | null
          location: string | null
          new_muslim_progress: Json | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          phone_country_code: string | null
          phone_number: string | null
          preferred_contact: string | null
          referral_code: string | null
          referred_by: string | null
          role: string | null
          roles: string[] | null
          timezone: string | null
          unlimited_credits: boolean | null
        }
        Insert: {
          anchor_completed?: boolean | null
          arabic_font_style?: string | null
          attends_cheadle_masjid?: boolean
          avatar_url?: string | null
          created_at?: string | null
          dashboard_widgets?: Json | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          diagnostic_assessment_id?: string | null
          diagnostic_completed_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          explore_completed?: boolean | null
          explore_progress?: Json | null
          full_name?: string | null
          gender?: string | null
          hard_delete_at?: string | null
          has_completed_diagnostic?: boolean | null
          has_used_free_trial?: boolean | null
          how_heard_about_us?: string | null
          id: string
          is_admin?: boolean | null
          is_legacy_student?: boolean | null
          linked_parent_id?: string | null
          location?: string | null
          new_muslim_progress?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          preferred_contact?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          roles?: string[] | null
          timezone?: string | null
          unlimited_credits?: boolean | null
        }
        Update: {
          anchor_completed?: boolean | null
          arabic_font_style?: string | null
          attends_cheadle_masjid?: boolean
          avatar_url?: string | null
          created_at?: string | null
          dashboard_widgets?: Json | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          diagnostic_assessment_id?: string | null
          diagnostic_completed_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          explore_completed?: boolean | null
          explore_progress?: Json | null
          full_name?: string | null
          gender?: string | null
          hard_delete_at?: string | null
          has_completed_diagnostic?: boolean | null
          has_used_free_trial?: boolean | null
          how_heard_about_us?: string | null
          id?: string
          is_admin?: boolean | null
          is_legacy_student?: boolean | null
          linked_parent_id?: string | null
          location?: string | null
          new_muslim_progress?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          preferred_contact?: string | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          roles?: string[] | null
          timezone?: string | null
          unlimited_credits?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_linked_parent_id_fkey"
            columns: ["linked_parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usage: {
        Row: {
          created_at: string
          discount_applied: number
          id: string
          lesson_id: string | null
          promo_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_applied: number
          id?: string
          lesson_id?: string | null
          promo_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: number
          id?: string
          lesson_id?: string | null
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          first_lesson_only: boolean
          id: string
          is_active: boolean
          max_uses: number | null
          min_cart_value: number
          restricted_to_user_id: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value?: number
          first_lesson_only?: boolean
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_cart_value?: number
          restricted_to_user_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_lesson_only?: boolean
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_cart_value?: number
          restricted_to_user_id?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_restricted_to_user_id_fkey"
            columns: ["restricted_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_bookmarks: {
        Row: {
          ayah_number: number
          created_at: string
          id: string
          learner_id: string
          note: string | null
          surah_number: number
          updated_at: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          id?: string
          learner_id: string
          note?: string | null
          surah_number: number
          updated_at?: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          id?: string
          learner_id?: string
          note?: string | null
          surah_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quran_bookmarks_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quran_bookmarks_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_progress: {
        Row: {
          ayah_number: number
          created_at: string | null
          fluency_completed: boolean | null
          fluency_confidence: number | null
          fluency_last_practiced: string | null
          fluency_level: string | null
          id: string
          memorization_completed: boolean | null
          memorization_confidence: number | null
          memorization_last_practiced: string | null
          memorization_level: string | null
          memorization_next_review: string | null
          memorization_review_frequency: string | null
          notes: string | null
          student_id: string
          surah_name: string
          surah_number: number
          understanding_completed: boolean | null
          understanding_confidence: number | null
          understanding_last_practiced: string | null
          understanding_level: string | null
          updated_at: string | null
        }
        Insert: {
          ayah_number: number
          created_at?: string | null
          fluency_completed?: boolean | null
          fluency_confidence?: number | null
          fluency_last_practiced?: string | null
          fluency_level?: string | null
          id?: string
          memorization_completed?: boolean | null
          memorization_confidence?: number | null
          memorization_last_practiced?: string | null
          memorization_level?: string | null
          memorization_next_review?: string | null
          memorization_review_frequency?: string | null
          notes?: string | null
          student_id: string
          surah_name: string
          surah_number: number
          understanding_completed?: boolean | null
          understanding_confidence?: number | null
          understanding_last_practiced?: string | null
          understanding_level?: string | null
          updated_at?: string | null
        }
        Update: {
          ayah_number?: number
          created_at?: string | null
          fluency_completed?: boolean | null
          fluency_confidence?: number | null
          fluency_last_practiced?: string | null
          fluency_level?: string | null
          id?: string
          memorization_completed?: boolean | null
          memorization_confidence?: number | null
          memorization_last_practiced?: string | null
          memorization_level?: string | null
          memorization_next_review?: string | null
          memorization_review_frequency?: string | null
          notes?: string | null
          student_id?: string
          surah_name?: string
          surah_number?: number
          understanding_completed?: boolean | null
          understanding_confidence?: number | null
          understanding_last_practiced?: string | null
          understanding_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ramadan_daily_log: {
        Row: {
          created_at: string | null
          fasted: boolean | null
          habits_maintained: Json | null
          id: string
          log_date: string
          masjid_prayers: number | null
          masjid_prayers_list: Json | null
          quran_pages_read: number | null
          sadaqah_given: number | null
          taraweeh_attended: boolean | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          fasted?: boolean | null
          habits_maintained?: Json | null
          id?: string
          log_date: string
          masjid_prayers?: number | null
          masjid_prayers_list?: Json | null
          quran_pages_read?: number | null
          sadaqah_given?: number | null
          taraweeh_attended?: boolean | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          fasted?: boolean | null
          habits_maintained?: Json | null
          id?: string
          log_date?: string
          masjid_prayers?: number | null
          masjid_prayers_list?: Json | null
          quran_pages_read?: number | null
          sadaqah_given?: number | null
          taraweeh_attended?: boolean | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      ramadan_plans: {
        Row: {
          created_at: string | null
          habits_to_cut: Json | null
          id: string
          masjid_prayer_daily_target: number | null
          notes: string | null
          quran_goal_pages_per_day: number | null
          quran_reading_time: string | null
          sadaqah_currency: string | null
          sadaqah_daily_amount: number | null
          taraweeh_target_nights: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          habits_to_cut?: Json | null
          id?: string
          masjid_prayer_daily_target?: number | null
          notes?: string | null
          quran_goal_pages_per_day?: number | null
          quran_reading_time?: string | null
          sadaqah_currency?: string | null
          sadaqah_daily_amount?: number | null
          taraweeh_target_nights?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          habits_to_cut?: Json | null
          id?: string
          masjid_prayer_daily_target?: number | null
          notes?: string | null
          quran_goal_pages_per_day?: number | null
          quran_reading_time?: string | null
          sadaqah_currency?: string | null
          sadaqah_daily_amount?: number | null
          taraweeh_target_nights?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      recruitment_email_log: {
        Row: {
          candidate_id: string
          email_log_id: string | null
          id: string
          sent_at: string | null
          sent_by: string | null
          template_name: string | null
          variables_used: Json | null
        }
        Insert: {
          candidate_id: string
          email_log_id?: string | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          template_name?: string | null
          variables_used?: Json | null
        }
        Update: {
          candidate_id?: string
          email_log_id?: string | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          template_name?: string | null
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_email_log_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_email_log_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "admin_email_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_email_log_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_interviews: {
        Row: {
          ai_model: string | null
          ai_summary: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          candidate_id: string
          communication_rating: number | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number
          hms_room_id: string | null
          id: string
          interview_notes: string | null
          interviewer_id: string | null
          knowledge_rating: number | null
          overall_rating: number | null
          personality_rating: number | null
          recording_enabled: boolean | null
          recording_url: string | null
          room_code_admin: string | null
          room_code_candidate: string | null
          scheduled_date: string
          scheduled_time: string
          slot_id: string | null
          status: string
          teaching_demo_rating: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_summary?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          candidate_id: string
          communication_rating?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          hms_room_id?: string | null
          id?: string
          interview_notes?: string | null
          interviewer_id?: string | null
          knowledge_rating?: number | null
          overall_rating?: number | null
          personality_rating?: number | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          room_code_admin?: string | null
          room_code_candidate?: string | null
          scheduled_date: string
          scheduled_time: string
          slot_id?: string | null
          status?: string
          teaching_demo_rating?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_summary?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          candidate_id?: string
          communication_rating?: number | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          hms_room_id?: string | null
          id?: string
          interview_notes?: string | null
          interviewer_id?: string | null
          knowledge_rating?: number | null
          overall_rating?: number | null
          personality_rating?: number | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          room_code_admin?: string | null
          room_code_candidate?: string | null
          scheduled_date?: string
          scheduled_time?: string
          slot_id?: string | null
          status?: string
          teaching_demo_rating?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_interviews_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "admin_interview_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_pipeline: {
        Row: {
          admin_notes: string | null
          approval_date: string | null
          assigned_admin: string | null
          assigned_tier: string | null
          bio: string | null
          certificates: Json | null
          character_references: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          cv_url: string | null
          dbs_expiry_date: string | null
          dbs_reference: string | null
          dbs_status: string | null
          education_level: string | null
          email: string
          expected_hourly_rate: number | null
          full_name: string
          id: string
          interview_id: string | null
          languages: string[] | null
          nationality: string | null
          pay_region: string | null
          phone: string | null
          pipeline_stage: string
          pipeline_stage_updated_at: string | null
          prospect_id: string | null
          qualifications_summary: string | null
          references_status: string | null
          rejection_date: string | null
          rejection_reason: string | null
          source: string | null
          subjects: string[] | null
          teacher_profile_id: string | null
          teacher_type: string | null
          trial_lesson_id: string | null
          trial_lesson_notes: string | null
          trial_lesson_rating: number | null
          updated_at: string | null
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          approval_date?: string | null
          assigned_admin?: string | null
          assigned_tier?: string | null
          bio?: string | null
          certificates?: Json | null
          character_references?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          cv_url?: string | null
          dbs_expiry_date?: string | null
          dbs_reference?: string | null
          dbs_status?: string | null
          education_level?: string | null
          email: string
          expected_hourly_rate?: number | null
          full_name: string
          id?: string
          interview_id?: string | null
          languages?: string[] | null
          nationality?: string | null
          pay_region?: string | null
          phone?: string | null
          pipeline_stage?: string
          pipeline_stage_updated_at?: string | null
          prospect_id?: string | null
          qualifications_summary?: string | null
          references_status?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          source?: string | null
          subjects?: string[] | null
          teacher_profile_id?: string | null
          teacher_type?: string | null
          trial_lesson_id?: string | null
          trial_lesson_notes?: string | null
          trial_lesson_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          approval_date?: string | null
          assigned_admin?: string | null
          assigned_tier?: string | null
          bio?: string | null
          certificates?: Json | null
          character_references?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          cv_url?: string | null
          dbs_expiry_date?: string | null
          dbs_reference?: string | null
          dbs_status?: string | null
          education_level?: string | null
          email?: string
          expected_hourly_rate?: number | null
          full_name?: string
          id?: string
          interview_id?: string | null
          languages?: string[] | null
          nationality?: string | null
          pay_region?: string | null
          phone?: string | null
          pipeline_stage?: string
          pipeline_stage_updated_at?: string | null
          prospect_id?: string | null
          qualifications_summary?: string | null
          references_status?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          source?: string | null
          subjects?: string[] | null
          teacher_profile_id?: string | null
          teacher_type?: string | null
          trial_lesson_id?: string | null
          trial_lesson_notes?: string | null
          trial_lesson_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pipeline_interview"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "recruitment_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_assigned_admin_fkey"
            columns: ["assigned_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_assigned_tier_fkey"
            columns: ["assigned_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "recruitment_pipeline_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "recruitment_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_trial_lesson_id_fkey"
            columns: ["trial_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_trial_lesson_id_fkey"
            columns: ["trial_lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_pipeline_history: {
        Row: {
          candidate_id: string
          changed_by: string | null
          created_at: string | null
          from_stage: string | null
          id: string
          notes: string | null
          to_stage: string
        }
        Insert: {
          candidate_id: string
          changed_by?: string | null
          created_at?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage: string
        }
        Update: {
          candidate_id?: string
          changed_by?: string | null
          created_at?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_pipeline_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_prospects: {
        Row: {
          contacted_at: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          expected_hourly_rate: number | null
          first_identified_at: string | null
          full_name: string
          id: string
          languages: string[] | null
          moved_to_pipeline_at: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          pipeline_candidate_id: string | null
          platform_source: string | null
          responded_at: string | null
          source_url: string | null
          sourcing_status: string
          subjects: string[] | null
          updated_at: string | null
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expected_hourly_rate?: number | null
          first_identified_at?: string | null
          full_name: string
          id?: string
          languages?: string[] | null
          moved_to_pipeline_at?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_candidate_id?: string | null
          platform_source?: string | null
          responded_at?: string | null
          source_url?: string | null
          sourcing_status?: string
          subjects?: string[] | null
          updated_at?: string | null
        }
        Update: {
          contacted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expected_hourly_rate?: number | null
          first_identified_at?: string | null
          full_name?: string
          id?: string
          languages?: string[] | null
          moved_to_pipeline_at?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_candidate_id?: string | null
          platform_source?: string | null
          responded_at?: string | null
          source_url?: string | null
          sourcing_status?: string
          subjects?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_prospects_pipeline"
            columns: ["pipeline_candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_prospects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_achievements: {
        Row: {
          achievement_description: string | null
          achievement_icon: string | null
          achievement_name: string
          achievement_type: string | null
          created_at: string | null
          credits_reward: number | null
          id: string
          is_hidden: boolean | null
          points_reward: number | null
          requirement_value: number | null
        }
        Insert: {
          achievement_description?: string | null
          achievement_icon?: string | null
          achievement_name: string
          achievement_type?: string | null
          created_at?: string | null
          credits_reward?: number | null
          id?: string
          is_hidden?: boolean | null
          points_reward?: number | null
          requirement_value?: number | null
        }
        Update: {
          achievement_description?: string | null
          achievement_icon?: string | null
          achievement_name?: string
          achievement_type?: string | null
          created_at?: string | null
          credits_reward?: number | null
          id?: string
          is_hidden?: boolean | null
          points_reward?: number | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      referral_credits: {
        Row: {
          active_referrals: number | null
          available_balance: number | null
          available_hours: number | null
          created_at: string | null
          earned_hours: number | null
          id: string
          last_transfer_reset: string | null
          referred_hours: number | null
          tier: string | null
          tier_unlocked_at: string | null
          total_earned: number | null
          total_referrals: number | null
          total_used: number | null
          transfer_limit_monthly: number | null
          transferred_hours: number | null
          transfers_this_month: number | null
          updated_at: string | null
          used_hours: number | null
          user_id: string | null
        }
        Insert: {
          active_referrals?: number | null
          available_balance?: number | null
          available_hours?: number | null
          created_at?: string | null
          earned_hours?: number | null
          id?: string
          last_transfer_reset?: string | null
          referred_hours?: number | null
          tier?: string | null
          tier_unlocked_at?: string | null
          total_earned?: number | null
          total_referrals?: number | null
          total_used?: number | null
          transfer_limit_monthly?: number | null
          transferred_hours?: number | null
          transfers_this_month?: number | null
          updated_at?: string | null
          used_hours?: number | null
          user_id?: string | null
        }
        Update: {
          active_referrals?: number | null
          available_balance?: number | null
          available_hours?: number | null
          created_at?: string | null
          earned_hours?: number | null
          id?: string
          last_transfer_reset?: string | null
          referred_hours?: number | null
          tier?: string | null
          tier_unlocked_at?: string | null
          total_earned?: number | null
          total_referrals?: number | null
          total_used?: number | null
          transfer_limit_monthly?: number | null
          transferred_hours?: number | null
          transfers_this_month?: number | null
          updated_at?: string | null
          used_hours?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "referral_tiers"
            referencedColumns: ["tier"]
          },
        ]
      }
      referral_rewards_history: {
        Row: {
          created_at: string | null
          id: string
          referral_id: string | null
          reward_amount: number | null
          reward_description: string | null
          reward_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_id?: string | null
          reward_amount?: number | null
          reward_description?: string | null
          reward_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_id?: string | null
          reward_amount?: number | null
          reward_description?: string | null
          reward_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_history_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tiers: {
        Row: {
          badge_image: string | null
          benefits: Json | null
          color: string | null
          conversion_bonus: number
          created_at: string | null
          hourly_multiplier: number | null
          icon: string | null
          max_referrals: number | null
          min_referrals: number
          tier: string
          transfer_limit_monthly: number | null
          unlock_bonus: number | null
        }
        Insert: {
          badge_image?: string | null
          benefits?: Json | null
          color?: string | null
          conversion_bonus: number
          created_at?: string | null
          hourly_multiplier?: number | null
          icon?: string | null
          max_referrals?: number | null
          min_referrals: number
          tier: string
          transfer_limit_monthly?: number | null
          unlock_bonus?: number | null
        }
        Update: {
          badge_image?: string | null
          benefits?: Json | null
          color?: string | null
          conversion_bonus?: number
          created_at?: string | null
          hourly_multiplier?: number | null
          icon?: string | null
          max_referrals?: number | null
          min_referrals?: number
          tier?: string
          transfer_limit_monthly?: number | null
          unlock_bonus?: number | null
        }
        Relationships: []
      }
      referral_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          hours_amount: number
          id: string
          referral_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hours_amount: number
          id?: string
          referral_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hours_amount?: number
          id?: string
          referral_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_lessons: number | null
          conversion_paid: boolean | null
          created_at: string | null
          credits_earned: number | null
          email_verified_at: string | null
          hours_completed: number | null
          id: string
          last_lesson_date: string | null
          last_reward_date: string | null
          milestone_reached: number | null
          notification_sent: boolean | null
          points_earned: number | null
          referral_rank: number | null
          referred_id: string | null
          referred_user_id: string | null
          referrer_id: string | null
          reward_amount: number | null
          reward_granted: boolean | null
          status: string | null
          tier_id: string | null
          total_hours: number | null
          total_impact_hours: number | null
        }
        Insert: {
          completed_lessons?: number | null
          conversion_paid?: boolean | null
          created_at?: string | null
          credits_earned?: number | null
          email_verified_at?: string | null
          hours_completed?: number | null
          id?: string
          last_lesson_date?: string | null
          last_reward_date?: string | null
          milestone_reached?: number | null
          notification_sent?: boolean | null
          points_earned?: number | null
          referral_rank?: number | null
          referred_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_amount?: number | null
          reward_granted?: boolean | null
          status?: string | null
          tier_id?: string | null
          total_hours?: number | null
          total_impact_hours?: number | null
        }
        Update: {
          completed_lessons?: number | null
          conversion_paid?: boolean | null
          created_at?: string | null
          credits_earned?: number | null
          email_verified_at?: string | null
          hours_completed?: number | null
          id?: string
          last_lesson_date?: string | null
          last_reward_date?: string | null
          milestone_reached?: number | null
          notification_sent?: boolean | null
          points_earned?: number | null
          referral_rank?: number | null
          referred_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_amount?: number | null
          reward_granted?: boolean | null
          status?: string | null
          tier_id?: string | null
          total_hours?: number | null
          total_impact_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sadaqah_allocations: {
        Row: {
          allocated_by: string | null
          created_at: string | null
          credits_amount: number
          id: string
          reason: string | null
          recipient_id: string | null
        }
        Insert: {
          allocated_by?: string | null
          created_at?: string | null
          credits_amount: number
          id?: string
          reason?: string | null
          recipient_id?: string | null
        }
        Update: {
          allocated_by?: string | null
          created_at?: string | null
          credits_amount?: number
          id?: string
          reason?: string | null
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sadaqah_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sadaqah_allocations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sadaqah_donations: {
        Row: {
          created_at: string | null
          credits_amount: number
          donor_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          credits_amount: number
          donor_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          credits_amount?: number
          donor_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sadaqah_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sadaqah_pool: {
        Row: {
          created_at: string | null
          id: number
          total_allocated: number | null
          total_credits: number | null
          total_donated: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          total_allocated?: number | null
          total_credits?: number | null
          total_donated?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          total_allocated?: number | null
          total_credits?: number | null
          total_donated?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      salah_daily_record: {
        Row: {
          created_at: string | null
          id: string
          location: string
          prayer_name: string
          record_date: string
          status: string
          sunnah_completed: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string
          prayer_name: string
          record_date?: string
          status?: string
          sunnah_completed?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string
          prayer_name?: string
          record_date?: string
          status?: string
          sunnah_completed?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      salah_tracker_settings: {
        Row: {
          auto_mark_enabled: boolean
          auto_mark_enabled_at: string | null
          auto_mark_sunnah_enabled: boolean
          created_at: string
          last_nudge_shown_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_mark_enabled?: boolean
          auto_mark_enabled_at?: string | null
          auto_mark_sunnah_enabled?: boolean
          created_at?: string
          last_nudge_shown_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_mark_enabled?: boolean
          auto_mark_enabled_at?: string | null
          auto_mark_sunnah_enabled?: boolean
          created_at?: string
          last_nudge_shown_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_duas: {
        Row: {
          allah_names_used: string[] | null
          arabic_text: string
          audio_url_arabic: string | null
          audio_url_english: string | null
          category_id: string | null
          created_at: string
          english_text: string
          id: string
          is_favorite: boolean | null
          library_dua_id: string | null
          notes: string | null
          source: string | null
          title: string
          transliteration: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allah_names_used?: string[] | null
          arabic_text: string
          audio_url_arabic?: string | null
          audio_url_english?: string | null
          category_id?: string | null
          created_at?: string
          english_text: string
          id?: string
          is_favorite?: boolean | null
          library_dua_id?: string | null
          notes?: string | null
          source?: string | null
          title: string
          transliteration?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allah_names_used?: string[] | null
          arabic_text?: string
          audio_url_arabic?: string | null
          audio_url_english?: string | null
          category_id?: string | null
          created_at?: string
          english_text?: string
          id?: string
          is_favorite?: boolean | null
          library_dua_id?: string | null
          notes?: string | null
          source?: string | null
          title?: string
          transliteration?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_duas_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dua_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_duas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_khutbahs: {
        Row: {
          audience: string
          content: Json
          created_at: string
          duration: string
          id: string
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          content: Json
          created_at?: string
          duration?: string
          id?: string
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          content?: Json
          created_at?: string
          duration?: string
          id?: string
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_khutbahs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shahada_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone_country_code: string | null
          phone_number: string
          shahada_date: string | null
          shahada_taken: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone_country_code?: string | null
          phone_number: string
          shahada_date?: string | null
          shahada_taken?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone_country_code?: string | null
          phone_number?: string
          shahada_date?: string | null
          shahada_taken?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_curriculum_progress: {
        Row: {
          created_at: string | null
          current_phase_id: string | null
          current_stage_id: string | null
          id: string
          last_activity_at: string | null
          overall_progress_percentage: number | null
          started_at: string | null
          student_id: string
          subject_id: string
          total_hours_studied: number | null
          total_lessons_completed: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_phase_id?: string | null
          current_stage_id?: string | null
          id?: string
          last_activity_at?: string | null
          overall_progress_percentage?: number | null
          started_at?: string | null
          student_id: string
          subject_id: string
          total_hours_studied?: number | null
          total_lessons_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_phase_id?: string | null
          current_stage_id?: string | null
          id?: string
          last_activity_at?: string | null
          overall_progress_percentage?: number | null
          started_at?: string | null
          student_id?: string
          subject_id?: string
          total_hours_studied?: number | null
          total_lessons_completed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_curriculum_progress_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "curriculum_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_curriculum_progress_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "curriculum_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_curriculum_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_homework: {
        Row: {
          assigned_by: string
          ayat_end: number | null
          ayat_start: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          homework_type: string
          id: string
          lesson_id: string | null
          rating: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          surah_number: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          ayat_end?: number | null
          ayat_start?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          homework_type: string
          id?: string
          lesson_id?: string | null
          rating?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          surah_number?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          ayat_end?: number | null
          ayat_start?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          homework_type?: string
          id?: string
          lesson_id?: string | null
          rating?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          surah_number?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_homework_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_homework_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      student_milestone_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          milestone_id: string
          progress_percentage: number | null
          started_at: string | null
          status: string
          student_id: string
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_id: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_milestone_progress_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "curriculum_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      student_onboarding_items: {
        Row: {
          created_at: string
          hook: string
          icon: string
          id: string
          is_active: boolean
          item_key: string
          parent_hook: string | null
          parent_title: string | null
          route: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          hook: string
          icon?: string
          id?: string
          is_active?: boolean
          item_key: string
          parent_hook?: string | null
          parent_title?: string | null
          route: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          hook?: string
          icon?: string
          id?: string
          is_active?: boolean
          item_key?: string
          parent_hook?: string | null
          parent_title?: string | null
          route?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      student_onboarding_progress: {
        Row: {
          completed_at: string
          id: string
          item_key: string
          source: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          item_key: string
          source?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          item_key?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_teacher_pricing: {
        Row: {
          created_at: string | null
          current_hourly_price: number
          id: string
          initial_booking_date: string
          initial_teacher_tier: string | null
          is_price_locked: boolean | null
          last_price_update: string | null
          locked_hourly_price: number
          price_locked_until: string
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_hourly_price: number
          id?: string
          initial_booking_date: string
          initial_teacher_tier?: string | null
          is_price_locked?: boolean | null
          last_price_update?: string | null
          locked_hourly_price: number
          price_locked_until: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_hourly_price?: number
          id?: string
          initial_booking_date?: string
          initial_teacher_tier?: string | null
          is_price_locked?: boolean | null
          last_price_update?: string | null
          locked_hourly_price?: number
          price_locked_until?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_teacher_pricing_initial_teacher_tier_fkey"
            columns: ["initial_teacher_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "student_teacher_pricing_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "student_teacher_pricing_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teacher_pricing_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "student_teacher_pricing_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      student_teacher_relationships: {
        Row: {
          created_at: string | null
          end_reason: string | null
          ended_at: string | null
          first_paid_lesson_date: string | null
          id: string
          is_bookmarked: boolean | null
          last_lesson_date: string | null
          paused_at: string | null
          primary_teacher: boolean | null
          status: string | null
          student_id: string
          subject_id: string | null
          teacher_general_notes: string | null
          teacher_id: string
          teacher_notes: string | null
          total_hours: number | null
          total_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_reason?: string | null
          ended_at?: string | null
          first_paid_lesson_date?: string | null
          id?: string
          is_bookmarked?: boolean | null
          last_lesson_date?: string | null
          paused_at?: string | null
          primary_teacher?: boolean | null
          status?: string | null
          student_id: string
          subject_id?: string | null
          teacher_general_notes?: string | null
          teacher_id: string
          teacher_notes?: string | null
          total_hours?: number | null
          total_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_reason?: string | null
          ended_at?: string | null
          first_paid_lesson_date?: string | null
          id?: string
          is_bookmarked?: boolean | null
          last_lesson_date?: string | null
          paused_at?: string | null
          primary_teacher?: boolean | null
          status?: string | null
          student_id?: string
          subject_id?: string | null
          teacher_general_notes?: string | null
          teacher_id?: string
          teacher_notes?: string | null
          total_hours?: number | null
          total_lessons?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_teacher_relationships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teacher_relationships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teacher_relationships_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teacher_relationships_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "student_teacher_relationships_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teacher_relationships_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "student_teacher_relationships_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      student_teachers: {
        Row: {
          assigned_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_teachers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "student_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "student_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      subjects: {
        Row: {
          ai_prompt_template: string | null
          allowed_durations: number[] | null
          id: string
          minimum_rate: number | null
          name: string
          platform_fee_amount: number | null
          platform_fee_percentage: number | null
          platform_fee_type: string | null
          slug: string
          syllabus_url: string | null
        }
        Insert: {
          ai_prompt_template?: string | null
          allowed_durations?: number[] | null
          id?: string
          minimum_rate?: number | null
          name: string
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          platform_fee_type?: string | null
          slug: string
          syllabus_url?: string | null
        }
        Update: {
          ai_prompt_template?: string | null
          allowed_durations?: number[] | null
          id?: string
          minimum_rate?: number | null
          name?: string
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          platform_fee_type?: string | null
          slug?: string
          syllabus_url?: string | null
        }
        Relationships: []
      }
      surah_data: {
        Row: {
          created_at: string | null
          id: string
          revelation_type: string | null
          surah_name_arabic: string | null
          surah_name_english: string | null
          surah_name_transliteration: string | null
          surah_number: number
          tafsir_ibn_kathir: Json | null
          themes: string[] | null
          total_ayahs: number | null
          updated_at: string | null
          verses: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          revelation_type?: string | null
          surah_name_arabic?: string | null
          surah_name_english?: string | null
          surah_name_transliteration?: string | null
          surah_number: number
          tafsir_ibn_kathir?: Json | null
          themes?: string[] | null
          total_ayahs?: number | null
          updated_at?: string | null
          verses?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          revelation_type?: string | null
          surah_name_arabic?: string | null
          surah_name_english?: string | null
          surah_name_transliteration?: string | null
          surah_number?: number
          tafsir_ibn_kathir?: Json | null
          themes?: string[] | null
          total_ayahs?: number | null
          updated_at?: string | null
          verses?: Json | null
        }
        Relationships: []
      }
      surah_retention_tracker: {
        Row: {
          consecutive_correct: number
          created_at: string
          days_since_memorized: number | null
          ease_factor: number
          fluency_complete: boolean
          id: string
          last_review_quality: number | null
          last_reviewed_at: string | null
          learner_id: string
          memorization_completed_at: string | null
          memorization_status: string
          next_review_date: string
          retention_score: number | null
          review_interval_days: number
          surah_number: number
          total_reviews: number
          understanding_complete: boolean
          updated_at: string
        }
        Insert: {
          consecutive_correct?: number
          created_at?: string
          days_since_memorized?: number | null
          ease_factor?: number
          fluency_complete?: boolean
          id?: string
          last_review_quality?: number | null
          last_reviewed_at?: string | null
          learner_id: string
          memorization_completed_at?: string | null
          memorization_status?: string
          next_review_date?: string
          retention_score?: number | null
          review_interval_days?: number
          surah_number: number
          total_reviews?: number
          understanding_complete?: boolean
          updated_at?: string
        }
        Update: {
          consecutive_correct?: number
          created_at?: string
          days_since_memorized?: number | null
          ease_factor?: number
          fluency_complete?: boolean
          id?: string
          last_review_quality?: number | null
          last_reviewed_at?: string | null
          learner_id?: string
          memorization_completed_at?: string | null
          memorization_status?: string
          next_review_date?: string
          retention_score?: number | null
          review_interval_days?: number
          surah_number?: number
          total_reviews?: number
          understanding_complete?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surah_retention_tracker_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surah_retention_tracker_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      talbiyah_insights: {
        Row: {
          full_transcript: string | null
          homework_tasks: string[] | null
          id: string
          key_concepts: string[] | null
          lesson_id: string
          reflection_questions: string[] | null
          summary: string | null
        }
        Insert: {
          full_transcript?: string | null
          homework_tasks?: string[] | null
          id?: string
          key_concepts?: string[] | null
          lesson_id: string
          reflection_questions?: string[] | null
          summary?: string | null
        }
        Update: {
          full_transcript?: string | null
          homework_tasks?: string[] | null
          id?: string
          key_concepts?: string[] | null
          lesson_id?: string
          reflection_questions?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talbiyah_insights_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talbiyah_insights_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      teacher_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          subjects: string[] | null
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          subjects?: string[] | null
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          subjects?: string[] | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_availability_one_off: {
        Row: {
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          subjects: string[] | null
          teacher_id: string
        }
        Insert: {
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          subjects?: string[] | null
          teacher_id: string
        }
        Update: {
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          subjects?: string[] | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_one_off_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_availability_one_off_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_one_off_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_availability_one_off_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_availability_recurring: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          teacher_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          teacher_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_recurring_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_availability_recurring_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_recurring_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_availability_recurring_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_booking_settings: {
        Row: {
          auto_acknowledge: boolean | null
          created_at: string | null
          email_on_new_booking: boolean | null
          id: string
          max_lessons_per_day: number | null
          min_hours_notice: number | null
          sms_on_new_booking: boolean | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          auto_acknowledge?: boolean | null
          created_at?: string | null
          email_on_new_booking?: boolean | null
          id?: string
          max_lessons_per_day?: number | null
          min_hours_notice?: number | null
          sms_on_new_booking?: boolean | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          auto_acknowledge?: boolean | null
          created_at?: string | null
          email_on_new_booking?: boolean | null
          id?: string
          max_lessons_per_day?: number | null
          min_hours_notice?: number | null
          sms_on_new_booking?: boolean | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_booking_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_booking_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_booking_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_booking_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_earnings: {
        Row: {
          amount_earned: number
          cleared_at: string | null
          created_at: string | null
          currency: string
          hold_period_days: number
          id: string
          is_referral_commission: boolean | null
          lesson_completed_at: string | null
          lesson_id: string
          notes: string | null
          paid_at: string | null
          payout_id: string | null
          platform_fee: number
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          source_teacher_id: string | null
          status: string
          teacher_id: string
          total_lesson_cost: number
          updated_at: string | null
        }
        Insert: {
          amount_earned: number
          cleared_at?: string | null
          created_at?: string | null
          currency?: string
          hold_period_days?: number
          id?: string
          is_referral_commission?: boolean | null
          lesson_completed_at?: string | null
          lesson_id: string
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          platform_fee: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          source_teacher_id?: string | null
          status?: string
          teacher_id: string
          total_lesson_cost: number
          updated_at?: string | null
        }
        Update: {
          amount_earned?: number
          cleared_at?: string | null
          created_at?: string | null
          currency?: string
          hold_period_days?: number
          id?: string
          is_referral_commission?: boolean | null
          lesson_completed_at?: string | null
          lesson_id?: string
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          platform_fee?: number
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          source_teacher_id?: string | null
          status?: string
          teacher_id?: string
          total_lesson_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_earnings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_earnings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "teacher_earnings_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "teacher_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_earnings_source_teacher_id_fkey"
            columns: ["source_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_earnings_source_teacher_id_fkey"
            columns: ["source_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_earnings_source_teacher_id_fkey"
            columns: ["source_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_earnings_source_teacher_id_fkey"
            columns: ["source_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_earnings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_earnings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_earnings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_earnings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_onboarding_calls: {
        Row: {
          admin_room_code: string | null
          created_at: string
          hms_room_id: string | null
          id: string
          invited_by: string | null
          status: string
          teacher_id: string
          teacher_joined_at: string | null
          teacher_room_code: string | null
        }
        Insert: {
          admin_room_code?: string | null
          created_at?: string
          hms_room_id?: string | null
          id?: string
          invited_by?: string | null
          status?: string
          teacher_id: string
          teacher_joined_at?: string | null
          teacher_room_code?: string | null
        }
        Update: {
          admin_room_code?: string | null
          created_at?: string
          hms_room_id?: string | null
          id?: string
          invited_by?: string | null
          status?: string
          teacher_id?: string
          teacher_joined_at?: string | null
          teacher_room_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_onboarding_calls_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_onboarding_calls_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_onboarding_completions: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_onboarding_completions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_onboarding_completions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_onboarding_completions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_onboarding_completions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_onboarding_progress: {
        Row: {
          id: string
          read_at: string | null
          resource_id: string
          teacher_id: string
        }
        Insert: {
          id?: string
          read_at?: string | null
          resource_id: string
          teacher_id: string
        }
        Update: {
          id?: string
          read_at?: string | null
          resource_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_onboarding_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "onboarding_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_onboarding_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_onboarding_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_onboarding_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_onboarding_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_payment_settings: {
        Row: {
          auto_payout_enabled: boolean | null
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_country: string | null
          bank_currency: string | null
          bank_iban: string | null
          bank_name: string | null
          bank_sort_code: string | null
          bank_swift_bic: string | null
          created_at: string | null
          id: string
          minimum_payout_amount: number | null
          payout_schedule: string | null
          paypal_email: string | null
          preferred_payout_method: string | null
          revolut_detail: string | null
          stripe_account_id: string | null
          stripe_onboarding_completed: boolean | null
          taptap_phone: string | null
          tax_id: string | null
          teacher_id: string
          updated_at: string | null
          vat_number: string | null
          vat_registered: boolean | null
        }
        Insert: {
          auto_payout_enabled?: boolean | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_country?: string | null
          bank_currency?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bank_sort_code?: string | null
          bank_swift_bic?: string | null
          created_at?: string | null
          id?: string
          minimum_payout_amount?: number | null
          payout_schedule?: string | null
          paypal_email?: string | null
          preferred_payout_method?: string | null
          revolut_detail?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean | null
          taptap_phone?: string | null
          tax_id?: string | null
          teacher_id: string
          updated_at?: string | null
          vat_number?: string | null
          vat_registered?: boolean | null
        }
        Update: {
          auto_payout_enabled?: boolean | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_country?: string | null
          bank_currency?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bank_sort_code?: string | null
          bank_swift_bic?: string | null
          created_at?: string | null
          id?: string
          minimum_payout_amount?: number | null
          payout_schedule?: string | null
          paypal_email?: string | null
          preferred_payout_method?: string | null
          revolut_detail?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean | null
          taptap_phone?: string | null
          tax_id?: string | null
          teacher_id?: string
          updated_at?: string | null
          vat_number?: string | null
          vat_registered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_payment_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_payment_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_payment_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_payment_settings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_payouts: {
        Row: {
          completed_at: string | null
          created_at: string | null
          currency: string
          earnings_count: number
          external_payout_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          initiated_at: string | null
          notes: string | null
          payment_details: Json | null
          payout_method: string
          processed_by: string | null
          processing_at: string | null
          retry_count: number | null
          status: string
          teacher_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          earnings_count?: number
          external_payout_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string | null
          notes?: string | null
          payment_details?: Json | null
          payout_method?: string
          processed_by?: string | null
          processing_at?: string | null
          retry_count?: number | null
          status?: string
          teacher_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          earnings_count?: number
          external_payout_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          initiated_at?: string | null
          notes?: string | null
          payment_details?: Json | null
          payout_method?: string
          processed_by?: string | null
          processing_at?: string | null
          retry_count?: number | null
          status?: string
          teacher_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_payouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_payouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_payouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_payouts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          agreement_accepted_at: string | null
          agreement_signed_name: string | null
          agreement_version: string | null
          audio_intro_url: string | null
          average_rating: number | null
          bio: string | null
          completed_lessons: number | null
          created_at: string | null
          current_tier: string | null
          education_level: string | null
          group_lesson_enabled: boolean | null
          group_lesson_hourly_rate: number | null
          group_lesson_tier: string | null
          hourly_rate: number
          hours_taught: number | null
          id: string
          independent_rate: number | null
          is_accepting_bookings: boolean | null
          is_legacy_teacher: boolean | null
          is_referrer: boolean | null
          is_talbiyah_certified: boolean | null
          islamic_teaching_interests: string[] | null
          manual_tier_override: boolean | null
          pay_region: string | null
          payment_collection: string | null
          rate_override: number | null
          rate_override_at: string | null
          rate_override_by: string | null
          rate_override_reason: string | null
          referral_hourly_rate: number | null
          referred_by: string | null
          retention_rate: number | null
          returning_students: number | null
          status: string | null
          teacher_type: string | null
          tier: string | null
          tier_assigned_at: string | null
          tier_assigned_by: string | null
          tier_progression_eligible: boolean | null
          total_lessons: number | null
          total_unique_students: number | null
          updated_at: string | null
          user_id: string
          video_intro_url: string | null
          youtube_intro_url: string | null
        }
        Insert: {
          agreement_accepted_at?: string | null
          agreement_signed_name?: string | null
          agreement_version?: string | null
          audio_intro_url?: string | null
          average_rating?: number | null
          bio?: string | null
          completed_lessons?: number | null
          created_at?: string | null
          current_tier?: string | null
          education_level?: string | null
          group_lesson_enabled?: boolean | null
          group_lesson_hourly_rate?: number | null
          group_lesson_tier?: string | null
          hourly_rate: number
          hours_taught?: number | null
          id?: string
          independent_rate?: number | null
          is_accepting_bookings?: boolean | null
          is_legacy_teacher?: boolean | null
          is_referrer?: boolean | null
          is_talbiyah_certified?: boolean | null
          islamic_teaching_interests?: string[] | null
          manual_tier_override?: boolean | null
          pay_region?: string | null
          payment_collection?: string | null
          rate_override?: number | null
          rate_override_at?: string | null
          rate_override_by?: string | null
          rate_override_reason?: string | null
          referral_hourly_rate?: number | null
          referred_by?: string | null
          retention_rate?: number | null
          returning_students?: number | null
          status?: string | null
          teacher_type?: string | null
          tier?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          tier_progression_eligible?: boolean | null
          total_lessons?: number | null
          total_unique_students?: number | null
          updated_at?: string | null
          user_id: string
          video_intro_url?: string | null
          youtube_intro_url?: string | null
        }
        Update: {
          agreement_accepted_at?: string | null
          agreement_signed_name?: string | null
          agreement_version?: string | null
          audio_intro_url?: string | null
          average_rating?: number | null
          bio?: string | null
          completed_lessons?: number | null
          created_at?: string | null
          current_tier?: string | null
          education_level?: string | null
          group_lesson_enabled?: boolean | null
          group_lesson_hourly_rate?: number | null
          group_lesson_tier?: string | null
          hourly_rate?: number
          hours_taught?: number | null
          id?: string
          independent_rate?: number | null
          is_accepting_bookings?: boolean | null
          is_legacy_teacher?: boolean | null
          is_referrer?: boolean | null
          is_talbiyah_certified?: boolean | null
          islamic_teaching_interests?: string[] | null
          manual_tier_override?: boolean | null
          pay_region?: string | null
          payment_collection?: string | null
          rate_override?: number | null
          rate_override_at?: string | null
          rate_override_by?: string | null
          rate_override_reason?: string | null
          referral_hourly_rate?: number | null
          referred_by?: string | null
          retention_rate?: number | null
          returning_students?: number | null
          status?: string | null
          teacher_type?: string | null
          tier?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          tier_progression_eligible?: boolean | null
          total_lessons?: number | null
          total_unique_students?: number | null
          updated_at?: string | null
          user_id?: string
          video_intro_url?: string | null
          youtube_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_current_tier_fkey"
            columns: ["current_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "teacher_profiles_rate_override_by_fkey"
            columns: ["rate_override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_profiles_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_qualifications: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          id: string
          issuing_institution: string | null
          qualification_name: string
          qualification_type: string
          teacher_id: string | null
          verification_notes: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          year_obtained: number | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          id?: string
          issuing_institution?: string | null
          qualification_name: string
          qualification_type: string
          teacher_id?: string | null
          verification_notes?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          year_obtained?: number | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          id?: string
          issuing_institution?: string | null
          qualification_name?: string
          qualification_type?: string
          teacher_id?: string | null
          verification_notes?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          year_obtained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_qualifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_qualifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_qualifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_qualifications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_ratings: {
        Row: {
          communication: number
          created_at: string | null
          flagged_inappropriate: boolean | null
          goal_progress: number
          id: string
          improvement_feedback: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          lesson_count_at_rating: number
          milestone_type: string
          overall_rating: number
          positive_feedback: string | null
          punctuality: number
          student_id: string
          teacher_id: string
          teaching_quality: number
          updated_at: string | null
          would_recommend: boolean
        }
        Insert: {
          communication: number
          created_at?: string | null
          flagged_inappropriate?: boolean | null
          goal_progress: number
          id?: string
          improvement_feedback?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lesson_count_at_rating: number
          milestone_type: string
          overall_rating: number
          positive_feedback?: string | null
          punctuality: number
          student_id: string
          teacher_id: string
          teaching_quality: number
          updated_at?: string | null
          would_recommend: boolean
        }
        Update: {
          communication?: number
          created_at?: string | null
          flagged_inappropriate?: boolean | null
          goal_progress?: number
          id?: string
          improvement_feedback?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lesson_count_at_rating?: number
          milestone_type?: string
          overall_rating?: number
          positive_feedback?: string | null
          punctuality?: number
          student_id?: string
          teacher_id?: string
          teaching_quality?: number
          updated_at?: string | null
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          subject_id: string
          teacher_id: string
        }
        Insert: {
          subject_id: string
          teacher_id: string
        }
        Update: {
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_tier_applications: {
        Row: {
          application_reason: string | null
          assigned_rate: number | null
          assigned_tier: string | null
          certificates: Json | null
          created_at: string | null
          english_proficiency: string | null
          id: string
          interview_completed_at: string | null
          interview_notes: string | null
          interview_scheduled_at: string | null
          intro_video_url: string | null
          recitation_sample_url: string | null
          requested_rate: number | null
          requested_tier: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          teacher_id: string | null
          years_experience: number | null
        }
        Insert: {
          application_reason?: string | null
          assigned_rate?: number | null
          assigned_tier?: string | null
          certificates?: Json | null
          created_at?: string | null
          english_proficiency?: string | null
          id?: string
          interview_completed_at?: string | null
          interview_notes?: string | null
          interview_scheduled_at?: string | null
          intro_video_url?: string | null
          recitation_sample_url?: string | null
          requested_rate?: number | null
          requested_tier?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          teacher_id?: string | null
          years_experience?: number | null
        }
        Update: {
          application_reason?: string | null
          assigned_rate?: number | null
          assigned_tier?: string | null
          certificates?: Json | null
          created_at?: string | null
          english_proficiency?: string | null
          id?: string
          interview_completed_at?: string | null
          interview_notes?: string | null
          interview_scheduled_at?: string | null
          intro_video_url?: string | null
          recitation_sample_url?: string | null
          requested_rate?: number | null
          requested_tier?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          teacher_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_tier_applications_assigned_tier_fkey"
            columns: ["assigned_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "teacher_tier_applications_requested_tier_fkey"
            columns: ["requested_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "teacher_tier_applications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_tier_applications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_tier_applications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_tier_applications_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teacher_tier_history: {
        Row: {
          from_tier: string | null
          hours_at_promotion: number | null
          id: string
          promoted_at: string | null
          promoted_by: string | null
          promotion_reason: string | null
          promotion_type: string
          rating_at_promotion: number | null
          teacher_id: string | null
          to_tier: string | null
        }
        Insert: {
          from_tier?: string | null
          hours_at_promotion?: number | null
          id?: string
          promoted_at?: string | null
          promoted_by?: string | null
          promotion_reason?: string | null
          promotion_type: string
          rating_at_promotion?: number | null
          teacher_id?: string | null
          to_tier?: string | null
        }
        Update: {
          from_tier?: string | null
          hours_at_promotion?: number | null
          id?: string
          promoted_at?: string | null
          promoted_by?: string | null
          promotion_reason?: string | null
          promotion_type?: string
          rating_at_promotion?: number | null
          teacher_id?: string | null
          to_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_tier_history_from_tier_fkey"
            columns: ["from_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "teacher_tier_history_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "teacher_tier_history_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_tier_history_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_tier_history_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_tier_history_to_tier_fkey"
            columns: ["to_tier"]
            isOneToOne: false
            referencedRelation: "teacher_tiers"
            referencedColumns: ["tier"]
          },
        ]
      }
      teacher_tiers: {
        Row: {
          badge_color: string | null
          benefits: Json | null
          color: string | null
          created_at: string | null
          international_teacher_hourly_rate: number | null
          margin_percentage: number
          min_hours_taught: number
          min_rating: number
          min_retention_rate: number | null
          min_students_for_retention: number | null
          platform_margin: number
          qualifications_required: string[] | null
          requires_manual_approval: boolean | null
          student_hourly_price: number
          teacher_hourly_rate: number
          tier: string
          tier_icon: string
          tier_level: number
          tier_name: string
          uk_teacher_hourly_rate: number | null
        }
        Insert: {
          badge_color?: string | null
          benefits?: Json | null
          color?: string | null
          created_at?: string | null
          international_teacher_hourly_rate?: number | null
          margin_percentage: number
          min_hours_taught: number
          min_rating: number
          min_retention_rate?: number | null
          min_students_for_retention?: number | null
          platform_margin: number
          qualifications_required?: string[] | null
          requires_manual_approval?: boolean | null
          student_hourly_price: number
          teacher_hourly_rate: number
          tier: string
          tier_icon: string
          tier_level: number
          tier_name: string
          uk_teacher_hourly_rate?: number | null
        }
        Update: {
          badge_color?: string | null
          benefits?: Json | null
          color?: string | null
          created_at?: string | null
          international_teacher_hourly_rate?: number | null
          margin_percentage?: number
          min_hours_taught?: number
          min_rating?: number
          min_retention_rate?: number | null
          min_students_for_retention?: number | null
          platform_margin?: number
          qualifications_required?: string[] | null
          requires_manual_approval?: boolean | null
          student_hourly_price?: number
          teacher_hourly_rate?: number
          tier?: string
          tier_icon?: string
          tier_level?: number
          tier_name?: string
          uk_teacher_hourly_rate?: number | null
        }
        Relationships: []
      }
      token_purchases: {
        Row: {
          completed_at: string | null
          created_at: string | null
          currency: string
          id: string
          package_type: string
          price_paid: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          tokens_amount: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          package_type: string
          price_paid: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tokens_amount: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          package_type?: string
          price_paid?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tokens_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          created_at: string | null
          feature: string | null
          id: string
          notes: string | null
          tokens_after: number
          tokens_change: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature?: string | null
          id?: string
          notes?: string | null
          tokens_after: number
          tokens_change: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string | null
          id?: string
          notes?: string | null
          tokens_after?: number
          tokens_change?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          notified: boolean | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          notified?: boolean | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          notified?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "referral_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          action: string | null
          browser: string | null
          component: string | null
          created_at: string | null
          device_type: string | null
          duration_ms: number | null
          event_category: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          page_title: string | null
          referrer: string | null
          screen_size: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          browser?: string | null
          component?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          event_category: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          screen_size?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          browser?: string | null
          component?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          event_category?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          page_title?: string | null
          referrer?: string | null
          screen_size?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits_remaining: number
          id: string
          total_credits_purchased: number
          total_credits_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          total_credits_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          total_credits_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dua_compositions: {
        Row: {
          admission_block_id: string | null
          audio_url: string | null
          category_id: string | null
          closing_block_id: string | null
          created_at: string | null
          custom_text: string | null
          hamd_block_id: string | null
          id: string
          is_favorite: boolean | null
          notes: string | null
          others_block_id: string | null
          request_block_ids: string[] | null
          salawat_block_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admission_block_id?: string | null
          audio_url?: string | null
          category_id?: string | null
          closing_block_id?: string | null
          created_at?: string | null
          custom_text?: string | null
          hamd_block_id?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          others_block_id?: string | null
          request_block_ids?: string[] | null
          salawat_block_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admission_block_id?: string | null
          audio_url?: string | null
          category_id?: string | null
          closing_block_id?: string | null
          created_at?: string | null
          custom_text?: string | null
          hamd_block_id?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          others_block_id?: string | null
          request_block_ids?: string[] | null
          salawat_block_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_dua_compositions_admission_block_id_fkey"
            columns: ["admission_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dua_compositions_closing_block_id_fkey"
            columns: ["closing_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dua_compositions_hamd_block_id_fkey"
            columns: ["hamd_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dua_compositions_others_block_id_fkey"
            columns: ["others_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dua_compositions_salawat_block_id_fkey"
            columns: ["salawat_block_id"]
            isOneToOne: false
            referencedRelation: "dua_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dua_compositions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          created_at: string | null
          id: string
          tokens_remaining: number
          total_tokens_from_bonuses: number
          total_tokens_purchased: number
          total_tokens_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tokens_remaining?: number
          total_tokens_from_bonuses?: number
          total_tokens_purchased?: number
          total_tokens_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tokens_remaining?: number
          total_tokens_from_bonuses?: number
          total_tokens_purchased?: number
          total_tokens_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_mastery: {
        Row: {
          correct_streak: number | null
          created_at: string
          id: string
          last_reviewed_at: string | null
          learner_id: string
          mastery_level: number
          next_review_at: string | null
          source_ayah: number | null
          source_lesson_id: string | null
          source_surah: number | null
          total_attempts: number | null
          total_correct: number | null
          updated_at: string
          word_arabic: string
          word_english: string
          word_transliteration: string | null
          word_type: string | null
        }
        Insert: {
          correct_streak?: number | null
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          learner_id: string
          mastery_level?: number
          next_review_at?: string | null
          source_ayah?: number | null
          source_lesson_id?: string | null
          source_surah?: number | null
          total_attempts?: number | null
          total_correct?: number | null
          updated_at?: string
          word_arabic: string
          word_english: string
          word_transliteration?: string | null
          word_type?: string | null
        }
        Update: {
          correct_streak?: number | null
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          learner_id?: string
          mastery_level?: number
          next_review_at?: string | null
          source_ayah?: number | null
          source_lesson_id?: string | null
          source_surah?: number | null
          total_attempts?: number | null
          total_correct?: number | null
          updated_at?: string
          word_arabic?: string
          word_english?: string
          word_transliteration?: string | null
          word_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_mastery_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_mastery_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_mastery_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_mastery_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "payment_overview"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          whatsapp_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          whatsapp_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          whatsapp_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      feature_usage: {
        Row: {
          action: string | null
          component: string | null
          days_used: number | null
          unique_users: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      learners_with_age: {
        Row: {
          age: number | null
          age_group: string | null
          current_age: number | null
          current_level: number | null
          current_school_year: string | null
          current_streak: number | null
          date_of_birth: string | null
          first_name: string | null
          gamification_points: number | null
          gender: string | null
          id: string | null
          last_login_date: string | null
          learning_credits: number | null
          learning_goals: string[] | null
          login_streak: number | null
          name: string | null
          parent_id: string | null
          referral_code: string | null
          referred_by: string | null
          school_year: string | null
          total_points: number | null
          total_xp: number | null
        }
        Insert: {
          age?: number | null
          age_group?: never
          current_age?: never
          current_level?: number | null
          current_school_year?: never
          current_streak?: number | null
          date_of_birth?: string | null
          first_name?: string | null
          gamification_points?: number | null
          gender?: string | null
          id?: string | null
          last_login_date?: string | null
          learning_credits?: number | null
          learning_goals?: string[] | null
          login_streak?: number | null
          name?: string | null
          parent_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          school_year?: string | null
          total_points?: number | null
          total_xp?: number | null
        }
        Update: {
          age?: number | null
          age_group?: never
          current_age?: never
          current_level?: number | null
          current_school_year?: never
          current_streak?: number | null
          date_of_birth?: string | null
          first_name?: string | null
          gamification_points?: number | null
          gender?: string | null
          id?: string | null
          last_login_date?: string | null
          learning_credits?: number | null
          learning_goals?: string[] | null
          login_streak?: number | null
          name?: string | null
          parent_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          school_year?: string | null
          total_points?: number | null
          total_xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learners_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_overview: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          event_count: number | null
          learner_id: string | null
          lesson_id: string | null
          lesson_status: string | null
          paid_at: string | null
          payment_events: Json | null
          payment_id: string | null
          payment_status: string | null
          price: number | null
          scheduled_time: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          student_id: string | null
          student_name: string | null
          teacher_id: string | null
          teacher_name: string | null
          teacher_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_earnings_overview"
            referencedColumns: ["teacher_profile_id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_rating_summary"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_tier_stats"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_pages: {
        Row: {
          avg_duration_ms: number | null
          page_path: string | null
          page_title: string | null
          unique_users: number | null
          view_count: number | null
        }
        Relationships: []
      }
      teacher_earnings_overview: {
        Row: {
          cleared_earnings: number | null
          cleared_lessons: number | null
          eligible_for_payout: boolean | null
          held_earnings: number | null
          held_lessons: number | null
          minimum_payout_amount: number | null
          paid_earnings: number | null
          paid_lessons: number | null
          pending_earnings: number | null
          pending_lessons: number | null
          preferred_payout_method: string | null
          stripe_account_id: string | null
          teacher_email: string | null
          teacher_name: string | null
          teacher_profile_id: string | null
          teacher_user_id: string | null
          total_lifetime_earnings: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_rating_summary: {
        Row: {
          avg_communication: number | null
          avg_goal_progress: number | null
          avg_lessons_per_student: number | null
          avg_punctuality: number | null
          avg_rating: number | null
          avg_teaching_quality: number | null
          completion_rate: number | null
          rebook_rate: number | null
          recommendation_rate: number | null
          teacher_id: string | null
          teacher_name: string | null
          thumbs_up_percentage: number | null
          total_detailed_ratings: number | null
          total_lessons_completed: number | null
          total_quick_feedback: number | null
          total_unique_students: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_tier_stats: {
        Row: {
          average_rating: number | null
          completed_lessons: number | null
          hours_taught: number | null
          next_auto_tier: string | null
          student_hourly_price: number | null
          teacher_hourly_rate: number | null
          teacher_id: string | null
          tier: string | null
          tier_icon: string | null
          tier_name: string | null
          total_students: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_credits: {
        Args: {
          p_credits: number
          p_notes?: string
          p_purchase_id: string
          p_user_id: string
        }
        Returns: number
      }
      add_user_tokens: {
        Args: {
          p_notes?: string
          p_tokens: number
          p_transaction_type: string
          p_user_id: string
        }
        Returns: Json
      }
      allocate_sadaqah: {
        Args: {
          p_admin_id: string
          p_credits: number
          p_reason?: string
          p_recipient_id: string
        }
        Returns: Json
      }
      analyze_quiz_for_gaps: {
        Args: {
          p_learner_id: string
          p_lesson_insight_id: string
          p_quiz_results: Json
        }
        Returns: {
          category: string
          confidence_score: number | null
          created_at: string
          evidence: Json | null
          external_practice_tips: Json | null
          first_identified_at: string | null
          id: string
          improvement_rate: number | null
          last_assessed_at: string | null
          learner_id: string
          resolved_at: string | null
          severity: string
          source_id: string | null
          source_type: string
          status: string
          subcategory: string | null
          times_targeted: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "knowledge_gaps"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      auto_acknowledge_pending_lessons: {
        Args: never
        Returns: {
          lesson_id: string
          scheduled_time: string
          student_id: string
          student_name: string
          teacher_id: string
          teacher_name: string
        }[]
      }
      book_lesson_with_credits: {
        Args: {
          p_duration_minutes: number
          p_is_trial?: boolean
          p_learner_id: string
          p_price: number
          p_scheduled_date: string
          p_scheduled_time: string
          p_subject_id: string
          p_teacher_id: string
        }
        Returns: string
      }
      calculate_age: { Args: { dob: string }; Returns: number }
      calculate_school_year: { Args: { dob: string }; Returns: string }
      calculate_user_tier: { Args: { user_id_param: string }; Returns: string }
      can_access_lesson: { Args: { p_lesson_id: string }; Returns: boolean }
      check_achievements: {
        Args: { user_id_param: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          credits_reward: number
          points_reward: number
        }[]
      }
      check_khutbah_usage: { Args: { p_user_id: string }; Returns: Json }
      check_message_rate_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          reset_at: string
        }[]
      }
      check_tier_progression: {
        Args: { teacher_id_param: string }
        Returns: {
          current_tier: string
          eligible: boolean
          hours_needed: number
          next_tier: string
          rating_needed: number
          reason: string
        }[]
      }
      cleanup_expired_cart_items: { Args: never; Returns: undefined }
      cleanup_expired_pending_bookings: { Args: never; Returns: undefined }
      cleanup_old_messages: { Args: never; Returns: number }
      cleanup_rate_limits: { Args: never; Returns: number }
      clear_held_earnings: { Args: never; Returns: number }
      deduct_user_credits: {
        Args: {
          p_credits: number
          p_lesson_id?: string
          p_notes?: string
          p_user_id: string
        }
        Returns: number
      }
      deduct_user_tokens: {
        Args: {
          p_feature: string
          p_notes?: string
          p_tokens: number
          p_user_id: string
        }
        Returns: Json
      }
      delete_old_recordings: { Args: { days_old?: number }; Returns: number }
      donate_as_sadaqah: {
        Args: { p_credits: number; p_notes?: string; p_user_id: string }
        Returns: Json
      }
      generate_group_sessions: {
        Args: { p_num_weeks?: number; p_template_id: string }
        Returns: number
      }
      generate_referral_code: { Args: never; Returns: string }
      get_activity_dashboard_stats: { Args: never; Returns: Json }
      get_admin_users_list: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          date_of_birth: string
          deleted_at: string
          deletion_reason: string
          email: string
          full_name: string
          gender: string
          hard_delete_at: string
          id: string
          is_admin: boolean
          is_legacy_student: boolean
          is_legacy_teacher: boolean
          last_sign_in_at: string
          location: string
          phone: string
          phone_number: string
          roles: string[]
          teacher_profile_id: string
          teacher_status: string
          teacher_type: string
          timezone: string
          unlimited_credits: boolean
        }[]
      }
      get_category_progress: {
        Args: { p_category_id: string; p_user_id: string }
        Returns: {
          passed_exams: number
          progress_percent: number
          total_videos: number
          watched_videos: number
        }[]
      }
      get_financial_analytics: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_learning_analytics: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_lessons_requiring_teacher_compensation: {
        Args: never
        Returns: {
          is_late_cancellation: boolean
          lesson_id: string
          lesson_price: number
          scheduled_time: string
          status: string
          student_id: string
          teacher_id: string
        }[]
      }
      get_parent_children: {
        Args: { parent_id: string }
        Returns: {
          child_age: number
          child_id: string
          child_name: string
          progress: Json
          upcoming_sessions: Json
        }[]
      }
      get_student_teacher_price: {
        Args: { student_id_param: string; teacher_id_param: string }
        Returns: number
      }
      get_student_teachers: {
        Args: { p_student_id: string }
        Returns: {
          first_lesson_date: string
          last_lesson_date: string
          next_lesson_time: string
          relationship_id: string
          status: string
          subject_name: string
          teacher_avatar: string
          teacher_email: string
          teacher_id: string
          teacher_name: string
          total_hours: number
          total_lessons: number
        }[]
      }
      get_teacher_acknowledgment_stats: {
        Args: { p_teacher_id: string }
        Returns: {
          acknowledgment_rate: number
          auto_acknowledged_count: number
          avg_response_hours: number
          total_bookings: number
        }[]
      }
      get_teacher_balance: { Args: { p_teacher_id: string }; Returns: number }
      get_teacher_earnings_summary: {
        Args: { p_teacher_id: string }
        Returns: {
          cleared_amount: number
          held_amount: number
          lessons_cleared: number
          lessons_held: number
          lessons_paid: number
          lessons_pending: number
          paid_amount: number
          pending_amount: number
          total_lifetime_earnings: number
        }[]
      }
      get_teacher_pending_lessons: {
        Args: { p_teacher_id: string }
        Returns: {
          duration_minutes: number
          hours_until_lesson: number
          lesson_id: string
          requested_hours_ago: number
          scheduled_time: string
          student_id: string
          student_name: string
          subject_name: string
        }[]
      }
      get_teacher_profile_id: { Args: never; Returns: string }
      get_teacher_rating_display: {
        Args: { p_teacher_id: string }
        Returns: Json
      }
      get_teacher_student_ids: { Args: never; Returns: string[] }
      get_teachers_eligible_for_auto_payout: {
        Args: never
        Returns: {
          cleared_balance: number
          earning_ids: string[]
          earnings_count: number
          stripe_account_id: string
          teacher_id: string
        }[]
      }
      get_transferable_credits: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_unread_message_count: { Args: { p_user_id: string }; Returns: number }
      get_user_activity_analytics: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_user_credits: { Args: { p_user_id: string }; Returns: number }
      get_user_engagement_summary: {
        Args: { p_user_id?: string }
        Returns: {
          active_days: number
          first_seen: string
          full_name: string
          last_active: string
          most_used_feature: string
          most_visited_page: string
          total_events: number
          total_sessions: number
          user_id: string
        }[]
      }
      get_user_full_profile: { Args: { p_user_id: string }; Returns: Json }
      get_user_learner_ids: { Args: never; Returns: string[] }
      get_user_tokens: { Args: { p_user_id: string }; Returns: number }
      get_users_with_emails: {
        Args: never
        Returns: {
          email: string
          id: string
        }[]
      }
      increment_khutbah_usage: { Args: { p_user_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      link_child_to_parent: {
        Args: { p_child_id: string; p_parent_id: string }
        Returns: string
      }
      log_payment_event: {
        Args: {
          p_amount?: number
          p_checkout_session_id?: string
          p_currency?: string
          p_customer_id?: string
          p_error_code?: string
          p_error_message?: string
          p_event_type: string
          p_lesson_id: string
          p_payment_intent_id?: string
          p_payment_status?: string
          p_raw_event_data?: Json
          p_stripe_event_id?: string
        }
        Returns: string
      }
      madrasa_apply_session_progress: {
        Args: { p_session: string }
        Returns: undefined
      }
      madrasa_can_manage_class: { Args: { p_class: string }; Returns: boolean }
      madrasa_can_view_class: { Args: { p_class: string }; Returns: boolean }
      madrasa_class_roster: {
        Args: { p_class_id: string }
        Returns: {
          first_name: string
          learner_id: string
          status: string
        }[]
      }
      madrasa_erase_learner: { Args: { p_learner: string }; Returns: Json }
      madrasa_is_org_admin: { Args: { p_org: string }; Returns: boolean }
      madrasa_is_org_member: { Args: { p_org: string }; Returns: boolean }
      madrasa_is_parent_in_class: {
        Args: { p_class: string }
        Returns: boolean
      }
      madrasa_is_parent_of: { Args: { p_learner: string }; Returns: boolean }
      madrasa_session_class: { Args: { p_session: string }; Returns: string }
      manually_add_teacher_relationship: {
        Args: {
          p_student_id: string
          p_subject_id: string
          p_teacher_id: string
        }
        Returns: string
      }
      mark_messages_as_read: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_teacher_compensated: {
        Args: { p_compensation_amount: number; p_lesson_id: string }
        Returns: undefined
      }
      should_request_detailed_rating: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: string
      }
      transfer_credits: {
        Args: {
          p_credits: number
          p_from_user_id: string
          p_notes?: string
          p_to_user_id: string
        }
        Returns: Json
      }
      update_login_streak: {
        Args: { learner_id_param: string }
        Returns: undefined
      }
      update_vocabulary_mastery: {
        Args: { p_is_correct: boolean; p_vocab_id: string }
        Returns: {
          correct_streak: number | null
          created_at: string
          id: string
          last_reviewed_at: string | null
          learner_id: string
          mastery_level: number
          next_review_at: string | null
          source_ayah: number | null
          source_lesson_id: string | null
          source_surah: number | null
          total_attempts: number | null
          total_correct: number | null
          updated_at: string
          word_arabic: string
          word_english: string
          word_transliteration: string | null
          word_type: string | null
        }
        SetofOptions: {
          from: "*"
          to: "vocabulary_mastery"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      use_promo_code: { Args: { p_code: string }; Returns: boolean }
      validate_promo_code: {
        Args: {
          p_cart_value?: number
          p_code: string
          p_is_first_lesson?: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      subject_type: "quran" | "arabic" | "islamic_studies"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subject_type: ["quran", "arabic", "islamic_studies"],
    },
  },
} as const
