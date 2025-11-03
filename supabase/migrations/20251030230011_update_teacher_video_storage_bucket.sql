/*
  # Update Teacher Video Storage Bucket

  1. Updates to storage bucket
    - Update `teacher_audio` bucket to support video formats
    - Rename bucket purpose to handle both audio and video
    - Add video MIME types (mp4, webm, mov)
    - Increase file size limit to 100MB for videos
    
  2. Security
    - Maintain existing RLS policies for authenticated uploads
    - Keep public read access for media files
    
  3. Notes
    - Existing audio files remain accessible
    - Video files can now be uploaded and stored
    - Supports common video formats from mobile devices and browsers
*/

-- Update the teacher_audio bucket to support video formats
DO $$
BEGIN
  -- Update file size limit and allowed MIME types
  UPDATE storage.buckets
  SET 
    file_size_limit = 104857600, -- 100MB
    allowed_mime_types = ARRAY[
      'audio/mpeg', 
      'audio/mp4', 
      'audio/x-m4a',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]
  WHERE id = 'teacher_audio';
END $$;
