/*
  # Create Saved Khutbahs Table

  1. New Table
    - `saved_khutbahs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `topic` (text)
      - `duration` (text)
      - `audience` (text)
      - `content` (jsonb - stores the full khutba content)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can CRUD their own khutbahs
*/

-- Create the saved_khutbahs table
CREATE TABLE IF NOT EXISTS public.saved_khutbahs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  topic text NOT NULL,
  duration text NOT NULL DEFAULT 'medium',
  audience text NOT NULL DEFAULT 'general',
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_khutbahs ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved khutbahs
CREATE POLICY "Users can read own khutbahs"
  ON public.saved_khutbahs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own khutbahs
CREATE POLICY "Users can create own khutbahs"
  ON public.saved_khutbahs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own khutbahs
CREATE POLICY "Users can update own khutbahs"
  ON public.saved_khutbahs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own khutbahs
CREATE POLICY "Users can delete own khutbahs"
  ON public.saved_khutbahs
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_khutbahs_user_id ON public.saved_khutbahs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_khutbahs_created_at ON public.saved_khutbahs(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_khutbahs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saved_khutbahs_updated_at ON public.saved_khutbahs;
CREATE TRIGGER update_saved_khutbahs_updated_at
  BEFORE UPDATE ON public.saved_khutbahs
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_khutbahs_updated_at();
