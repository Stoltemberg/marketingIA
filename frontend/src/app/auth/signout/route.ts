import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig, isSupabaseConfigured } from '@/utils/supabase/config';

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseConfig();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.signOut();
  }

  const requestUrl = new URL(request.url);
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
