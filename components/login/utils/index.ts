import type { SupabaseClient } from '@supabase/supabase-js';
import type { Provider } from '@supabase/supabase-js';

export const handleEmailPasswordSignIn = async (
  supabase: SupabaseClient,
  email: string,
  password: string
) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const handleOAuthSignIn = async (
  supabase: SupabaseClient,
  provider: Provider
) => {
  const redirectTo = new URL("/api/auth/callback", window.location.origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo.toString(),
    },
  });
  return { data, error };
};