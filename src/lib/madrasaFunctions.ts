import { supabase } from './supabaseClient';

export interface GenerationChecks { hard: string[]; warnings: string[] }

/** Call generate-madrasa-materials and turn HTTP errors into readable messages. */
export async function invokeGenerate<T = unknown>(body: Record<string, unknown>): Promise<{ data?: T; error?: string; status?: number }> {
  const { data, error } = await supabase.functions.invoke('generate-madrasa-materials', { body });
  if (!error) return { data: data as T };
  let message = error.message;
  let status: number | undefined;
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === 'function') {
    status = ctx.status;
    try { message = (await ctx.json()).error ?? message; } catch { /* keep default */ }
  }
  return { error: message, status };
}

/** "Today" in UK masjid time, as YYYY-MM-DD. */
export function ukToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
