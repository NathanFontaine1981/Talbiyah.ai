/*
  # Optimize RLS Policies - Part 3: Chat and Khutbah

  1. Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
  
  2. Tables Updated
    - chat_conversations
    - khutbah_reflections
*/

-- Chat Conversations policies
DROP POLICY IF EXISTS "Admins can read all chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create chat conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can read own chat conversations" ON public.chat_conversations;

CREATE POLICY "Admins can read all chat conversations"
  ON public.chat_conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );

CREATE POLICY "Users can create chat conversations"
  ON public.chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR user_id IS NULL
  );

CREATE POLICY "Users can read own chat conversations"
  ON public.chat_conversations
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR user_id IS NULL
  );

-- Khutbah Reflections policies
DROP POLICY IF EXISTS "Admins can manage khutbah reflections" ON public.khutbah_reflections;

CREATE POLICY "Admins can manage khutbah reflections"
  ON public.khutbah_reflections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND 'admin' = ANY(profiles.roles)
    )
  );
