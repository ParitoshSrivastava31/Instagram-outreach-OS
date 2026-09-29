import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('https://') && (supabaseServiceKey || supabaseAnonKey)
);

// Client for browser / public operations (respects RLS)
export const supabasePublic = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)
  : null;

// Server-only client using service role key (bypasses RLS for secure background/worker operations)
export const supabaseServer = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export function getSupabaseKeyRole(): 'service_role' | 'anon' | 'unknown' {
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!key) return 'unknown';
  try {
    const parts = key.split('.');
    if (parts.length >= 2) {
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      if (payload.role === 'service_role') return 'service_role';
      if (payload.role === 'anon') return 'anon';
    }
  } catch {
    // ignore decoding errors
  }
  return 'unknown';
}

export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  canRead: boolean;
  canWrite: boolean;
  keyRole: 'service_role' | 'anon' | 'unknown';
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabaseServer) {
    return {
      configured: false,
      canRead: false,
      canWrite: false,
      keyRole: 'unknown'
    };
  }

  const role = getSupabaseKeyRole();
  let canRead = false;
  let canWrite = false;
  let errorMsg: string | undefined;

  try {
    const readTest = await supabaseServer.from('leads').select('id').limit(1);
    if (!readTest.error) {
      canRead = true;
    } else {
      errorMsg = readTest.error.message;
    }
  } catch (e: any) {
    errorMsg = e.message;
  }

  // Test write permission probe
  try {
    const testId = '__health_probe__';
    const writeTest = await supabaseServer.from('leads').upsert({
      id: testId,
      instagram_username: '__probe_user__',
      instagram_url: 'https://instagram.com/__probe_user__',
      followers: 100,
      lead_score: 1,
      lead_tier: 'Tier C',
      status: 'DISQUALIFIED'
    }, { onConflict: 'instagram_username' }).select('id').single();

    if (!writeTest.error && writeTest.data) {
      canWrite = true;
      // Clean up probe
      await supabaseServer.from('leads').delete().eq('id', testId);
    } else if (writeTest.error) {
      errorMsg = writeTest.error.message;
      if (writeTest.error.code === '42501') {
        errorMsg = 'Supabase Row Level Security (RLS) is blocking database writes. Run the disable RLS SQL command or provide the service_role key.';
      }
    }
  } catch (e: any) {
    errorMsg = e.message;
  }

  return {
    configured: true,
    canRead,
    canWrite,
    keyRole: role,
    error: errorMsg
  };
}
