-- Email Notification System
-- Automatically sends emails for key events

-- Function to send welcome email when user signs up
CREATE OR REPLACE FUNCTION send_welcome_email_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Call Edge Function to send welcome email (async, don't wait)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'email', user_email,
      'full_name', COALESCE(NEW.full_name, 'Student')
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send welcome email
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON profiles;
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_on_signup();


-- Function to send lesson booked confirmation
CREATE OR REPLACE FUNCTION send_lesson_booked_email_on_create()
RETURNS TRIGGER AS $$
DECLARE
  student_email TEXT;
  student_name TEXT;
  teacher_name TEXT;
  subject_name TEXT;
BEGIN
  -- Only send for confirmed lessons (not pending)
  IF NEW.status != 'pending' THEN
    -- Get student info
    SELECT u.email, p.full_name INTO student_email, student_name
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = NEW.learner_id;

    -- Get teacher name
    SELECT full_name INTO teacher_name
    FROM profiles
    WHERE id = NEW.teacher_id;

    -- Get subject name
    SELECT name INTO subject_name
    FROM subjects
    WHERE id = NEW.subject_id;

    -- Call Edge Function to send lesson booked email
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-lesson-booked-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'lesson_id', NEW.id,
        'student_email', student_email,
        'student_name', student_name,
        'teacher_name', teacher_name,
        'subject', subject_name,
        'scheduled_time', NEW.scheduled_time,
        'duration_minutes', NEW.duration_minutes,
        'lesson_url', 'https://talbiyah.netlify.app/lesson/' || NEW.id
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send lesson booked email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send lesson booked email
DROP TRIGGER IF EXISTS trigger_send_lesson_booked_email ON lessons;
CREATE TRIGGER trigger_send_lesson_booked_email
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION send_lesson_booked_email_on_create();


-- Function to send lesson time changed email
CREATE OR REPLACE FUNCTION send_lesson_time_changed_email_on_update()
RETURNS TRIGGER AS $$
DECLARE
  student_email TEXT;
  student_name TEXT;
  teacher_name TEXT;
  subject_name TEXT;
BEGIN
  -- Only send if scheduled_time changed
  IF OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN
    -- Get student info
    SELECT u.email, p.full_name INTO student_email, student_name
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = NEW.learner_id;

    -- Get teacher name
    SELECT full_name INTO teacher_name
    FROM profiles
    WHERE id = NEW.teacher_id;

    -- Get subject name
    SELECT name INTO subject_name
    FROM subjects
    WHERE id = NEW.subject_id;

    -- Call Edge Function to send time changed email
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'lesson_time_changed',
        'recipient_email', student_email,
        'recipient_name', student_name,
        'data', jsonb_build_object(
          'teacher_name', teacher_name,
          'old_time', OLD.scheduled_time,
          'new_time', NEW.scheduled_time,
          'subject', subject_name
        )
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send lesson time changed email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lesson time changed
DROP TRIGGER IF EXISTS trigger_send_lesson_time_changed_email ON lessons;
CREATE TRIGGER trigger_send_lesson_time_changed_email
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION send_lesson_time_changed_email_on_update();


-- Function to send lesson cancelled email
CREATE OR REPLACE FUNCTION send_lesson_cancelled_email_on_update()
RETURNS TRIGGER AS $$
DECLARE
  student_email TEXT;
  student_name TEXT;
  teacher_name TEXT;
  subject_name TEXT;
BEGIN
  -- Only send if status changed to cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Get student info
    SELECT u.email, p.full_name INTO student_email, student_name
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = NEW.learner_id;

    -- Get teacher name
    SELECT full_name INTO teacher_name
    FROM profiles
    WHERE id = NEW.teacher_id;

    -- Get subject name
    SELECT name INTO subject_name
    FROM subjects
    WHERE id = NEW.subject_id;

    -- Call Edge Function to send cancelled email
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'lesson_cancelled',
        'recipient_email', student_email,
        'recipient_name', student_name,
        'data', jsonb_build_object(
          'teacher_name', teacher_name,
          'scheduled_time', NEW.scheduled_time,
          'subject', subject_name,
          'reason', NULL
        )
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send lesson cancelled email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lesson cancelled
DROP TRIGGER IF EXISTS trigger_send_lesson_cancelled_email ON lessons;
CREATE TRIGGER trigger_send_lesson_cancelled_email
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION send_lesson_cancelled_email_on_update();


-- Function to send teacher message notification
CREATE OR REPLACE FUNCTION send_teacher_message_email_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  recipient_email TEXT;
  recipient_name TEXT;
  teacher_name TEXT;
  lesson_subject TEXT;
BEGIN
  -- Only send if message is from teacher to student
  IF NEW.sender_role = 'teacher' THEN
    -- Get student (recipient) info
    SELECT u.email, p.full_name INTO recipient_email, recipient_name
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    JOIN lessons l ON l.learner_id = u.id
    WHERE l.id = NEW.lesson_id;

    -- Get teacher name
    SELECT p.full_name INTO teacher_name
    FROM profiles p
    JOIN lessons l ON l.teacher_id = p.id
    WHERE l.id = NEW.lesson_id;

    -- Get lesson subject
    SELECT s.name INTO lesson_subject
    FROM subjects s
    JOIN lessons l ON l.subject_id = s.id
    WHERE l.id = NEW.lesson_id;

    -- Call Edge Function to send message notification
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'teacher_message',
        'recipient_email', recipient_email,
        'recipient_name', recipient_name,
        'data', jsonb_build_object(
          'teacher_name', teacher_name,
          'message_preview', LEFT(NEW.message, 100),
          'lesson_subject', lesson_subject
        )
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send teacher message email: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for teacher messages
DROP TRIGGER IF EXISTS trigger_send_teacher_message_email ON lesson_messages;
CREATE TRIGGER trigger_send_teacher_message_email
  AFTER INSERT ON lesson_messages
  FOR EACH ROW
  EXECUTE FUNCTION send_teacher_message_email_on_insert();

-- Set up app settings for the functions to use
-- These need to be configured in your Supabase project settings:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://boyrjgivpepjiboekwuu.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'your-service-role-key';
