export const AUTH_COOKIE_NAME = 'vault_auth_token';

/**
 * Returns the configured master admin password from environment.
 * Defaults to 'vault2026' if not explicitly configured in .env.
 */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'vault2026';
}

/**
 * Generates a deterministic SHA-256 token from the admin password.
 * Uses the Web Crypto API, compatible with both Node and Edge runtimes.
 */
export async function getExpectedAuthToken(): Promise<string> {
  const password = getAdminPassword();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '-vault-outreach-os-session-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
