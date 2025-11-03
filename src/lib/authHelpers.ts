import { supabase } from './supabaseClient';

export async function getDashboardRoute(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return '/';

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      return '/admin';
    }

    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (teacher) {
      return '/teacher-dashboard';
    }

    return '/dashboard';
  } catch (error) {
    console.error('Error determining dashboard route:', error);
    return '/dashboard';
  }
}
