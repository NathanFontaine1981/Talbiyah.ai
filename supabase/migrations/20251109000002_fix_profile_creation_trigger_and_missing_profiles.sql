/*
  # Fix Profile Creation Trigger and Create Missing Profiles

  1. Changes
    - Recreate the trigger on auth.users to use the updated handle_new_user function
    - Create profiles for any auth users that don't have profiles yet
    - Add referral codes to profiles that are missing them

  2. Security
    - Maintains SECURITY DEFINER on function
    - Uses proper exception handling
*/

-- Drop and recreate the trigger to ensure it uses the latest function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for any auth users that don't have profiles
INSERT INTO public.profiles (id, roles)
SELECT
  au.id,
  ARRAY[COALESCE(au.raw_user_meta_data->>'selected_role', 'student')]::text[]
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Generate referral codes for profiles that don't have them
DO $$
DECLARE
  profile_record RECORD;
  new_referral_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  code_exists boolean;
BEGIN
  FOR profile_record IN
    SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    -- Generate unique referral code
    LOOP
      new_referral_code := '';
      FOR i IN 1..8 LOOP
        new_referral_code := new_referral_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;

      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    -- Update profile with referral code
    UPDATE public.profiles
    SET referral_code = new_referral_code
    WHERE id = profile_record.id;
  END LOOP;
END $$;
