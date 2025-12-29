import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types/db';

/**
 * Check if user has a specific role
 */
export function hasRole(roles: string[] | null | undefined, role: UserRole): boolean {
  if (!roles) return false;
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: string[] | null | undefined, checkRoles: UserRole[]): boolean {
  if (!roles) return false;
  return checkRoles.some(role => roles.includes(role));
}

/**
 * Add a role to user's profile
 */
export async function addRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // Get current roles
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentRoles = profile?.roles || [];
    if (currentRoles.includes(role)) return true; // Already has role

    // Add new role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ roles: [...currentRoles, role] })
      .eq('id', userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error adding role:', error);
    return false;
  }
}

/**
 * Remove a role from user's profile
 */
export async function removeRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentRoles = profile?.roles || [];
    const newRoles = currentRoles.filter((r: string) => r !== role);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ roles: newRoles })
      .eq('id', userId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
}

/**
 * Mark Explore journey as complete
 */
export async function markExploreComplete(userId: string): Promise<boolean> {
  try {
    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({ explore_completed: true })
      .eq('id', userId);

    if (error) throw error;

    // Update explore_progress
    await supabase
      .from('explore_progress')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Error marking explore complete:', error);
    return false;
  }
}

/**
 * Mark Anchor journey as complete and upgrade to student role
 */
export async function markAnchorComplete(userId: string): Promise<boolean> {
  try {
    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({ anchor_completed: true })
      .eq('id', userId);

    if (error) throw error;

    // Update anchor_progress
    await supabase
      .from('anchor_progress')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Upgrade to student role (they've completed their faith journey)
    await addRole(userId, 'student');

    return true;
  } catch (error) {
    console.error('Error marking anchor complete:', error);
    return false;
  }
}

/**
 * Get user's journey status
 */
export async function getJourneyStatus(userId: string): Promise<{
  exploreCompleted: boolean;
  anchorCompleted: boolean;
  currentRole: UserRole | null;
}> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('roles, explore_completed, anchor_completed')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const roles = profile?.roles || [];
    let currentRole: UserRole | null = null;

    // Determine primary role (in order of priority)
    if (roles.includes('admin')) currentRole = 'admin';
    else if (roles.includes('teacher')) currentRole = 'teacher';
    else if (roles.includes('student')) currentRole = 'student';
    else if (roles.includes('new_muslim')) currentRole = 'new_muslim';
    else if (roles.includes('non_muslim')) currentRole = 'non_muslim';

    return {
      exploreCompleted: profile?.explore_completed || false,
      anchorCompleted: profile?.anchor_completed || false,
      currentRole
    };
  } catch (error) {
    console.error('Error getting journey status:', error);
    return {
      exploreCompleted: false,
      anchorCompleted: false,
      currentRole: null
    };
  }
}

/**
 * Save explore progress
 */
export async function saveExploreProgress(
  userId: string,
  currentStep: number,
  axiomsAgreed: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('explore_progress')
      .upsert({
        user_id: userId,
        current_step: currentStep,
        axioms_agreed: axiomsAgreed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving explore progress:', error);
    return false;
  }
}

/**
 * Save anchor progress
 */
export async function saveAnchorProgress(
  userId: string,
  currentStep: number,
  factsVerified: string[],
  probabilityScore: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('anchor_progress')
      .upsert({
        user_id: userId,
        current_step: currentStep,
        facts_verified: factsVerified,
        probability_score: probabilityScore,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving anchor progress:', error);
    return false;
  }
}

/**
 * Get explore progress for a user
 */
export async function getExploreProgress(userId: string): Promise<{
  currentStep: number;
  axiomsAgreed: string[];
} | null> {
  try {
    const { data, error } = await supabase
      .from('explore_progress')
      .select('current_step, axioms_agreed')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return {
      currentStep: data.current_step,
      axiomsAgreed: data.axioms_agreed || []
    };
  } catch (error) {
    console.error('Error getting explore progress:', error);
    return null;
  }
}

/**
 * Get anchor progress for a user
 */
export async function getAnchorProgress(userId: string): Promise<{
  currentStep: number;
  factsVerified: string[];
  probabilityScore: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('anchor_progress')
      .select('current_step, facts_verified, probability_score')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return {
      currentStep: data.current_step,
      factsVerified: data.facts_verified || [],
      probabilityScore: data.probability_score || 0
    };
  } catch (error) {
    console.error('Error getting anchor progress:', error);
    return null;
  }
}
