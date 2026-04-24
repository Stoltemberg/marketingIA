const PLACEHOLDER_SUPABASE_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_SUPABASE_ANON_KEY = 'placeholder-anon-key';

function isValidHttpUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isConfiguredValue(value: string | undefined) {
  return Boolean(value && !value.startsWith('YOUR_'));
}

export function isSupabaseConfigured() {
  return (
    isConfiguredValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isConfiguredValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseConfig() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: isValidHttpUrl(configuredUrl)
      ? configuredUrl
      : PLACEHOLDER_SUPABASE_URL,
    anonKey: isConfiguredValue(configuredAnonKey)
      ? configuredAnonKey
      : PLACEHOLDER_SUPABASE_ANON_KEY,
  } as { url: string; anonKey: string };
}
