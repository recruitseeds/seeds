import type { Provider, SupabaseClient } from '@supabase/supabase-js'

/**
 * Handles signing up a new user with email and password.
 * Sets the user's role ('candidate' or 'organization') in the user metadata,
 * which is typically used by a database trigger to create a corresponding profile entry.
 * Specifies the URL to redirect to after email confirmation (if enabled).
 *
 * @param supabase - The Supabase client instance.
 * @param email - The email address for the new user account.
 * @param password - The password for the new user account.
 * @param userRole - The role to assign to the user ('candidate' or 'organization').
 * @returns A promise that resolves to an object containing the signup response data (including the user object on success) and any potential error.
 */
export const handleEmailPasswordSignUp = async (
  supabase: SupabaseClient,
  email: string,
  password: string,
  userRole: 'candidate' | 'organization'
) => {
  const emailRedirectTo = `${window.location.origin}/login?message=check-email`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: userRole,
      },
      emailRedirectTo: emailRedirectTo,
    },
  })
  return { data, error }
}

/**
 * Initiates the OAuth sign-up flow for a specific provider.
 * This function redirects the user to the selected OAuth provider's login page.
 * After successful authentication with the provider, the user is redirected back
 * to the specified `redirectTo` URL (`/api/auth/callback`), which includes
 * the chosen `userRole` and the `provider` name as query parameters.
 * The callback route then handles session creation and profile setup using this information.
 *
 * @param supabase - The Supabase client instance.
 * @param provider - The OAuth provider to use (e.g., 'google', 'azure', 'linkedin_oidc').
 * @param userRole - The role selected by the user during signup ('candidate' or 'organization'). This is passed to the callback.
 * @returns A promise that resolves to an object containing the initial OAuth data (which might be null if redirect happens immediately) and any potential error during the initiation phase. The main result (user session) is handled by the callback route.
 */
export const handleOAuthSignUp = async (
  supabase: SupabaseClient,
  provider: Provider,
  userRole: 'candidate' | 'organization'
) => {
  const redirectTo = new URL('/api/auth/callback', window.location.origin)
  redirectTo.searchParams.append('provider', provider)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        user_role: userRole,
      },
    },
  })
  return { data, error }
}

/**
 * Handles signing in an existing user using their email and password.
 *
 * @param supabase - The Supabase client instance.
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A promise that resolves to an object containing the sign-in response data (including the user and session object on success) and any potential error.
 */
export const handleEmailPasswordSignIn = async (supabase: SupabaseClient, email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * Initiates the OAuth sign-in flow for a specific provider for an existing user.
 * This function redirects the user to the selected OAuth provider's login page.
 * After successful authentication with the provider, the user is redirected back
 * to the specified `redirectTo` URL (`/api/auth/callback`), which includes
 * the `provider` name as a query parameter.
 * The callback route then handles session creation and determines the user's role/profile.
 *
 * @param supabase - The Supabase client instance.
 * @param provider - The OAuth provider to use (e.g., 'google', 'azure', 'linkedin_oidc').
 * @returns A promise that resolves to an object containing the initial OAuth data (which might be null if redirect happens immediately) and any potential error during the initiation phase. The main result (user session) is handled by the callback route.
 */
export const handleOAuthSignIn = async (supabase: SupabaseClient, provider: Provider) => {
  const redirectTo = new URL('/api/auth/callback', window.location.origin)
  redirectTo.searchParams.append('provider', provider)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo.toString(),
    },
  })
  return { data, error }
}
