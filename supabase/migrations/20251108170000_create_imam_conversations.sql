-- Create imam_conversations table for Virtual Imam chat history
-- This table stores questions asked to the Virtual Imam and the AI-generated responses

CREATE TABLE IF NOT EXISTS imam_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_imam_conversations_user_id ON imam_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_imam_conversations_created_at ON imam_conversations(created_at DESC);

-- Enable RLS
ALTER TABLE imam_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
  ON imam_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON imam_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON imam_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON imam_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
CREATE TRIGGER update_imam_conversations_updated_at
  BEFORE UPDATE ON imam_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
