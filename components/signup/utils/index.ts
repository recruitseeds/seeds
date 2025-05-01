import type { SupabaseClient } from '@supabase/supabase-js';
import type { Provider } from '@supabase/supabase-js';

export const handleEmailPasswordSignUp = async (
  supabase: SupabaseClient,
  email: string,
  password: string,
  userRole: 'candidate' | 'company'
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: userRole,
      },
      emailRedirectTo: `${window.location.origin}/api/callback`,
    },
  });
  return { data, error };
};

export const handleOAuthSignIn = async (
  supabase: SupabaseClient,
  provider: Provider,
  userRole: 'candidate' | 'company'
) => {
  const redirectTo = new URL("/api/callback", window.location.origin);
  redirectTo.searchParams.append("provider", provider);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        user_role: userRole,
      },
    },
  });
  return { data, error };
};
