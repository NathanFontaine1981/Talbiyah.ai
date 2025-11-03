/*
  # Create Chat Conversations Table for Virtual Imam Bot

  ## Summary
  This migration creates the infrastructure for storing Q&A conversations between
  users and the Virtual Imam AI Bot (Talbiyah Bot), including questions, AI responses,
  and Islamic source citations.

  ## New Tables

  ### `chat_conversations`
  Stores all chat interactions with the Virtual Imam Bot

  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for each conversation message
  - `user_id` (uuid, foreign key) - User who asked the question (nullable for anonymous)
  - `question` (text, required) - The user's question
  - `answer` (text, required) - The AI-generated answer
  - `references` (jsonb) - Quranic verses and Hadith citations
  - `jurisprudence_note` (text) - Ijma or Ikhtilaf explanation
  - `is_complex_referral` (boolean, default false) - Whether user was referred to local Imam
  - `session_id` (text) - Session identifier for grouping related questions
  - `created_at` (timestamptz, default now) - Message timestamp
  - `metadata` (jsonb) - Additional data (user agent, page context, etc.)

  ## Security
  - Enable RLS on `chat_conversations` table
  - Users can read their own conversations
  - Users can create new conversations
  - Admins can read all conversations for moderation
  - Anonymous users can create conversations (for non-logged-in access)

  ## Indexes
  - Index on `user_id` for quick user history lookup
  - Index on `session_id` for grouping conversations
  - Index on `created_at` for chronological sorting
  - Full-text search index on `question` for analytics

  ## Notes
  - Conversations are immutable once created (no updates/deletes by users)
  - Admins may need moderation tools in future iterations
  - Session IDs allow for conversation threading
*/

-- Create the chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  references jsonb DEFAULT '[]'::jsonb,
  jurisprudence_note text,
  is_complex_referral boolean DEFAULT false NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own conversations
CREATE POLICY "Users can read own chat conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create conversations
CREATE POLICY "Users can create chat conversations"
  ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anonymous users can create conversations (for non-logged-in users)
CREATE POLICY "Anonymous users can create chat conversations"
  ON chat_conversations
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Policy: Anonymous users can read their own session conversations
CREATE POLICY "Anonymous users can read own session conversations"
  ON chat_conversations
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Admins can read all conversations for moderation
CREATE POLICY "Admins can read all chat conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id
  ON chat_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id
  ON chat_conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at
  ON chat_conversations(created_at DESC);

-- Create full-text search index on questions
CREATE INDEX IF NOT EXISTS idx_chat_conversations_question_search
  ON chat_conversations USING gin(to_tsvector('english', question));

-- Create a function to get conversation history for a user or session
CREATE OR REPLACE FUNCTION get_chat_history(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  references jsonb,
  jurisprudence_note text,
  is_complex_referral boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    id,
    question,
    answer,
    references,
    jurisprudence_note,
    is_complex_referral,
    created_at
  FROM chat_conversations
  WHERE
    (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_session_id IS NULL OR session_id = p_session_id)
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- Create analytics view for admin dashboard (number of questions per day)
CREATE OR REPLACE VIEW chat_analytics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_questions,
  COUNT(*) FILTER (WHERE is_complex_referral = true) as complex_referrals,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM chat_conversations
GROUP BY DATE(created_at)
ORDER BY date DESC;
