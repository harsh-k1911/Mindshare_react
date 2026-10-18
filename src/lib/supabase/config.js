/** Only browser-safe Supabase keys are accepted here. */
export function validateSupabaseConfig({ url, publishableKey }) {
  if (!url && !publishableKey) {
    return { status: 'missing', message: 'Supabase is not configured. Add the public project URL and publishable key to .env.local.' };
  }
  if (!url || !publishableKey) {
    return { status: 'invalid', message: 'Both the Supabase project URL and publishable key are required.' };
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { status: 'invalid', message: 'The Supabase project URL must be a valid HTTPS URL.' };
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) {
    return { status: 'invalid', message: 'Use the HTTPS project API URL, without a path, credentials, query, or fragment.' };
  }
  if (!publishableKey.startsWith('sb_publishable_')) {
    // Legacy anon JWT keys are still accepted, but service-role keys must never reach the client.
    let role;
    try {
      const segment = publishableKey.split('.')[1];
      const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
      role = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))).role;
    } catch { /* Invalid or secret keys fall through to a safe configuration error. */ }
    if (role !== 'anon') {
      return { status: 'invalid', message: 'Use a publishable or legacy anon key. Secret and service-role keys must not be used in this app.' };
    }
  } else if (publishableKey.slice('sb_publishable_'.length).trim().length < 10) {
    return { status: 'invalid', message: 'The Supabase publishable key appears incomplete.' };
  }
  return { status: 'ready', url: parsed.origin, publishableKey };
}
