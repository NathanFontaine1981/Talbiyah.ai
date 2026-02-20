import { supabase } from './supabaseClient';

let cachedGender: string | null = null;
let fetched = false;

export async function getUserGender(): Promise<string | undefined> {
  if (fetched) return cachedGender || undefined;
  fetched = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;
    const { data } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', user.id)
      .maybeSingle();
    cachedGender = data?.gender || null;
  } catch {
    // Silently fail — voice will default to male
  }
  return cachedGender || undefined;
}

export async function generateTTSAudio(
  text: string,
  language?: string
): Promise<Response> {
  const gender = await getUserGender();
  return fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-dua-audio`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text,
        language,
        gender,
      }),
    }
  );
}
