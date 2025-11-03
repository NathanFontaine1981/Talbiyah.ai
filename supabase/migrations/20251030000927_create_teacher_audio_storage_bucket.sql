/*
  # Create teacher_audio Storage Bucket

  1. New Storage Bucket
    - `teacher_audio` - For storing teacher audio introductions
    - Public bucket to allow authenticated users to upload

  2. Security
    - Enable RLS on storage.objects
    - Add policy for authenticated users to upload their own audio files
    - Add policy for public read access to audio files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher_audio',
  'teacher_audio',
  true,
  10485760,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload audio files'
  ) THEN
    CREATE POLICY "Authenticated users can upload audio files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'teacher_audio');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can read audio files'
  ) THEN
    CREATE POLICY "Public can read audio files"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'teacher_audio');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own audio files'
  ) THEN
    CREATE POLICY "Users can update their own audio files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'teacher_audio');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own audio files'
  ) THEN
    CREATE POLICY "Users can delete their own audio files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'teacher_audio');
  END IF;
END $$;
