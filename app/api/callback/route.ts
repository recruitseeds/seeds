import { createClient } from '@/supabase/client/server'
import { addYears } from 'date-fns'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const Cookies = {
  PreferredSignInProvider: 'preferred_provider',
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('return_to')
  const provider = requestUrl.searchParams.get('provider')

  if (code) {
    try {
      const supabase = await createClient()

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        console.error('Auth Callback Error (Exchange):', exchangeError.message)
        const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login?error=auth_exchange_failed`)
        return errorResponse
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('Auth Callback Error (Get Session):', sessionError)
        const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login?error=session_fetch_failed`)
        return errorResponse
      }

      const userId = session.user.id
      const userRole = session.user.user_metadata?.role

      console.log(`User ${userId} logged in with role: ${userRole}`)

      let redirectUrl: URL
      if (returnTo && returnTo.startsWith('/')) {
        redirectUrl = new URL(returnTo, requestUrl.origin)
      } else if (userRole === 'candidate') {
        redirectUrl = new URL('/candidate/dashboard', requestUrl.origin)
      } else if (userRole === 'company') {
        redirectUrl = new URL('/company/dashboard', requestUrl.origin)
      } else {
        console.warn(`User ${userId} has missing or invalid role: ${userRole}`)
        redirectUrl = new URL('/dashboard', requestUrl.origin)
      }

      const response = NextResponse.redirect(redirectUrl)

      if (provider) {
        response.cookies.set(Cookies.PreferredSignInProvider, provider, {
          expires: addYears(new Date(), 1),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      }

      return response
    } catch (error) {
      console.error('Auth Callback Unexpected Error:', error)
      const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login?error=callback_unexpected_error`)
      return errorResponse
    }
  }

  console.warn('Auth Callback accessed without code parameter.')
  const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login?error=invalid_callback`)
  return errorResponse
}
