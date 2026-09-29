import { isSupabaseConfigured, supabaseServer } from './supabase';

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface LockoutRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// In-memory fallback cache (used when Supabase is unconfigured or offline)
const inMemoryLockouts = new Map<string, LockoutRecord>();

/**
 * Extracts the real client IP address from request headers.
 * Works seamlessly with Google Cloud Run (x-forwarded-for), reverse proxies, and local development.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks if the given IP address is currently locked out.
 */
export async function checkIpLockout(ip: string): Promise<{
  isLocked: boolean;
  remainingHours?: number;
  remainingMinutes?: number;
  attempts: number;
}> {
  const now = Date.now();

  // Try reading from Supabase if configured
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('auth_lockouts')
        .select('*')
        .eq('ip', ip)
        .single();

      if (!error && data) {
        const lockedUntil = data.locked_until ? new Date(data.locked_until).getTime() : null;
        if (lockedUntil && lockedUntil > now) {
          const diffMs = lockedUntil - now;
          const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
          const remainingMinutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          return {
            isLocked: true,
            remainingHours,
            remainingMinutes,
            attempts: data.failed_attempts || MAX_FAILED_ATTEMPTS,
          };
        } else if (lockedUntil && lockedUntil <= now) {
          // Lockout period has elapsed, reset in DB
          await supabaseServer
            .from('auth_lockouts')
            .update({ failed_attempts: 0, locked_until: null })
            .eq('ip', ip);
          return { isLocked: false, attempts: 0 };
        }
        return { isLocked: false, attempts: data.failed_attempts || 0 };
      }
    } catch {
      // Fallback to in-memory below if table doesn't exist
    }
  }

  // In-memory fallback
  const record = inMemoryLockouts.get(ip);
  if (!record) {
    return { isLocked: false, attempts: 0 };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const diffMs = record.lockedUntil - now;
    const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
    const remainingMinutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      isLocked: true,
      remainingHours,
      remainingMinutes,
      attempts: record.attempts,
    };
  } else if (record.lockedUntil && record.lockedUntil <= now) {
    // Lockout expired
    inMemoryLockouts.delete(ip);
    return { isLocked: false, attempts: 0 };
  }

  return { isLocked: false, attempts: record.attempts };
}

/**
 * Records a failed password attempt for an IP.
 * If 3 consecutive failures occur, locks the IP out for 24 hours.
 */
export async function recordFailedAttempt(ip: string): Promise<{
  isNowLocked: boolean;
  attempts: number;
  remainingAttempts: number;
}> {
  const now = Date.now();
  let currentAttempts = 0;

  // Check current attempts
  const status = await checkIpLockout(ip);
  currentAttempts = status.attempts + 1;
  const isNowLocked = currentAttempts >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = isNowLocked ? new Date(now + LOCKOUT_DURATION_MS).toISOString() : null;

  // Persist to Supabase if configured
  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('auth_lockouts').upsert(
        {
          ip,
          failed_attempts: currentAttempts,
          locked_until: lockedUntil,
          last_attempt_at: new Date(now).toISOString(),
        },
        { onConflict: 'ip' }
      );
    } catch {
      // Fallback to memory
    }
  }

  // Update in-memory cache
  inMemoryLockouts.set(ip, {
    attempts: currentAttempts,
    lockedUntil: isNowLocked ? now + LOCKOUT_DURATION_MS : null,
    lastAttempt: now,
  });

  return {
    isNowLocked,
    attempts: currentAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - currentAttempts),
  };
}

/**
 * Clears failed attempts upon a successful login.
 */
export async function clearIpLockout(ip: string): Promise<void> {
  inMemoryLockouts.delete(ip);

  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer
        .from('auth_lockouts')
        .delete()
        .eq('ip', ip);
    } catch {
      // Ignore if DB is unreachable
    }
  }
}
