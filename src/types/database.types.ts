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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          recall_score: number | null
          recall_attempts: number | null
          last_recall_at: string | null
          recall_correct_count: number | null
          recall_streak: number | null
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
          recall_score?: number | null
          recall_attempts?: number | null
          last_recall_at?: string | null
          recall_correct_count?: number | null
          recall_streak?: number | null
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
          recall_score?: number | null
          recall_attempts?: number | null
          last_recall_at?: string | null
          recall_correct_count?: number | null
          recall_streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ayah_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
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
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
          price: number | null
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
          price?: number | null
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
          price?: number | null
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
            referencedRelation: "teacher_profiles"
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
          {
            foreignKeyName: "group_session_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_participants: number
          description: string | null
          duration_minutes: number
          end_date: string | null
          id: string
          is_free: boolean
          level: string
          max_participants: number
          name: string
          price_per_session: number | null
          schedule_day: string
          schedule_time: string
          start_date: string
          status: string
          subject_id: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          id?: string
          is_free?: boolean
          level: string
          max_participants?: number
          name: string
          price_per_session?: number | null
          schedule_day: string
          schedule_time: string
          start_date: string
          status?: string
          subject_id?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          id?: string
          is_free?: boolean
          level?: string
          max_participants?: number
          name?: string
          price_per_session?: number | null
          schedule_day?: string
          schedule_time?: string
          start_date?: string
          status?: string
          subject_id?: string | null
          teacher_id?: string | null
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
            foreignKeyName: "group_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
          {
            foreignKeyName: "group_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
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
          {
            foreignKeyName: "imam_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      learners: {
        Row: {
          age: number | null
          current_level: number | null
          current_streak: number | null
          gamification_points: number | null
          gender: string | null
          id: string
          last_login_date: string | null
          learning_credits: number | null
          login_streak: number | null
          name: string | null
          parent_id: string
          referral_code: string | null
          referred_by: string | null
          total_points: number | null
          total_xp: number | null
        }
        Insert: {
          age?: number | null
          current_level?: number | null
          current_streak?: number | null
          gamification_points?: number | null
          gender?: string | null
          id?: string
          last_login_date?: string | null
          learning_credits?: number | null
          login_streak?: number | null
          name?: string | null
          parent_id: string
          referral_code?: string | null
          referred_by?: string | null
          total_points?: number | null
          total_xp?: number | null
        }
        Update: {
          age?: number | null
          current_level?: number | null
          current_streak?: number | null
          gamification_points?: number | null
          gender?: string | null
          id?: string
          last_login_date?: string | null
          learning_credits?: number | null
          login_streak?: number | null
          name?: string | null
          parent_id?: string
          referral_code?: string | null
          referred_by?: string | null
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
            foreignKeyName: "learners_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
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
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          lesson_id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lesson_id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lesson_id?: string
          message_text?: string
          receiver_id?: string
          sender_id?: string
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
            foreignKeyName: "lesson_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
            foreignKeyName: "lesson_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
          created_at: string | null
          duration_minutes: number
          id: string
          is_free_trial: boolean | null
          learner_id: string
          paid_at: string | null
          parent_id: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_status: string | null
          platform_fee: number | null
          recording_expires_at: string | null
          recording_url: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          scheduled_time: string
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          student_id: string | null
          student_room_code: string | null
          subject_id: string
          teacher_confirmed: boolean | null
          teacher_confirmed_at: string | null
          teacher_id: string
          teacher_rate_at_booking: number | null
          teacher_room_code: string | null
          total_cost_paid: number | null
        }
        Insert: {
          "100ms_room_id"?: string | null
          created_at?: string | null
          duration_minutes: number
          id?: string
          is_free_trial?: boolean | null
          learner_id: string
          paid_at?: string | null
          parent_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          recording_expires_at?: string | null
          recording_url?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          scheduled_time: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          student_room_code?: string | null
          subject_id: string
          teacher_confirmed?: boolean | null
          teacher_confirmed_at?: string | null
          teacher_id: string
          teacher_rate_at_booking?: number | null
          teacher_room_code?: string | null
          total_cost_paid?: number | null
        }
        Update: {
          "100ms_room_id"?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          is_free_trial?: boolean | null
          learner_id?: string
          paid_at?: string | null
          parent_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          recording_expires_at?: string | null
          recording_url?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          scheduled_time?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          student_room_code?: string | null
          subject_id?: string
          teacher_confirmed?: boolean | null
          teacher_confirmed_at?: string | null
          teacher_id?: string
          teacher_rate_at_booking?: number | null
          teacher_room_code?: string | null
          total_cost_paid?: number | null
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
            foreignKeyName: "lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_profiles: {
        Row: {
          admin_notes: string | null
          character_references: string[] | null
          id: string
          profile_data: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          character_references?: string[] | null
          id?: string
          profile_data?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          character_references?: string[] | null
          id?: string
          profile_data?: Json | null
          status?: string | null
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
          {
            foreignKeyName: "matchmaking_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_leaderboard"
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
            foreignKeyName: "parent_children_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
      profiles: {
        Row: {
          arabic_font_style: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          has_used_free_trial: boolean | null
          id: string
          is_admin: boolean | null
          linked_parent_id: string | null
          location: string | null
          phone_number: string | null
          referral_code: string | null
          referred_by: string | null
          roles: string[] | null
          timezone: string | null
        }
        Insert: {
          arabic_font_style?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_used_free_trial?: boolean | null
          id: string
          is_admin?: boolean | null
          linked_parent_id?: string | null
          location?: string | null
          phone_number?: string | null
          referral_code?: string | null
          referred_by?: string | null
          roles?: string[] | null
          timezone?: string | null
        }
        Update: {
          arabic_font_style?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_used_free_trial?: boolean | null
          id?: string
          is_admin?: boolean | null
          linked_parent_id?: string | null
          location?: string | null
          phone_number?: string | null
          referral_code?: string | null
          referred_by?: string | null
          roles?: string[] | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_linked_parent_id_fkey"
            columns: ["linked_parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_linked_parent_id_fkey"
            columns: ["linked_parent_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
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
          {
            foreignKeyName: "referral_rewards_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tiers: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          created_at: string | null
          id: string
          max_referrals: number | null
          min_referrals: number
          reward_multiplier: number
          tier_benefits: Json | null
          tier_level: number
          tier_name: string
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string | null
          id?: string
          max_referrals?: number | null
          min_referrals: number
          reward_multiplier?: number
          tier_benefits?: Json | null
          tier_level: number
          tier_name: string
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string | null
          id?: string
          max_referrals?: number | null
          min_referrals?: number
          reward_multiplier?: number
          tier_benefits?: Json | null
          tier_level?: number
          tier_name?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          hours_completed: number | null
          id: string
          last_reward_date: string | null
          milestone_reached: number | null
          points_earned: number | null
          referral_rank: number | null
          referred_id: string | null
          referrer_id: string | null
          reward_amount: number | null
          reward_granted: boolean | null
          status: string | null
          tier_id: string | null
          total_impact_hours: number | null
        }
        Insert: {
          created_at?: string | null
          hours_completed?: number | null
          id?: string
          last_reward_date?: string | null
          milestone_reached?: number | null
          points_earned?: number | null
          referral_rank?: number | null
          referred_id?: string | null
          referrer_id?: string | null
          reward_amount?: number | null
          reward_granted?: boolean | null
          status?: string | null
          tier_id?: string | null
          total_impact_hours?: number | null
        }
        Update: {
          created_at?: string | null
          hours_completed?: number | null
          id?: string
          last_reward_date?: string | null
          milestone_reached?: number | null
          points_earned?: number | null
          referral_rank?: number | null
          referred_id?: string | null
          referrer_id?: string | null
          reward_amount?: number | null
          reward_granted?: boolean | null
          status?: string | null
          tier_id?: string | null
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
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "referral_tiers"
            referencedColumns: ["id"]
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
            foreignKeyName: "student_teachers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          audio_intro_url: string | null
          bio: string | null
          created_at: string | null
          education_level: string | null
          hourly_rate: number
          id: string
          is_accepting_bookings: boolean | null
          is_talbiyah_certified: boolean | null
          islamic_learning_interests: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string
          video_intro_url: string | null
          youtube_intro_url: string | null
        }
        Insert: {
          audio_intro_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?: string | null
          hourly_rate: number
          id?: string
          is_accepting_bookings?: boolean | null
          is_talbiyah_certified?: boolean | null
          islamic_learning_interests?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          video_intro_url?: string | null
          youtube_intro_url?: string | null
        }
        Update: {
          audio_intro_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?: string | null
          hourly_rate?: number
          id?: string
          is_accepting_bookings?: boolean | null
          is_talbiyah_certified?: boolean | null
          islamic_learning_interests?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          video_intro_url?: string | null
          youtube_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
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
            referencedRelation: "teacher_profiles"
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
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
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
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["teacher_user_id"]
            isOneToOne: true
            referencedRelation: "referral_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_leaderboard: {
        Row: {
          avatar_url: string | null
          badge_color: string | null
          badge_icon: string | null
          full_name: string | null
          id: string | null
          rank: number | null
          tier_name: string | null
          total_achievements: number | null
          total_referrals: number | null
          total_rewards: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_user_tier: { Args: { user_id_param: string }; Returns: string }
      check_achievements: {
        Args: { user_id_param: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          credits_reward: number
          points_reward: number
        }[]
      }
      cleanup_expired_cart_items: { Args: never; Returns: undefined }
      cleanup_expired_pending_bookings: { Args: never; Returns: undefined }
      delete_old_recordings: { Args: { days_old?: number }; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
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
      get_users_with_emails: {
        Args: never
        Returns: {
          email: string
          id: string
        }[]
      }
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
      update_login_streak: {
        Args: { learner_id_param: string }
        Returns: undefined
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      subject_type: ["quran", "arabic", "islamic_studies"],
    },
  },
} as const
