import { supabase } from './supabaseClient';

export async function getDashboardRoute(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return '/';

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (profile?.roles && profile.roles.includes('admin')) {
      return '/admin';
    }

    // Everyone goes to the main dashboard
    // Teachers can access Teacher Hub from the navigation menu
    return '/dashboard';
  } catch (error) {
    console.error('Error determining dashboard route:', error);
    return '/dashboard';
  }
}
