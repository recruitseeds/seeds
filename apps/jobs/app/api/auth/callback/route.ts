import { createClient } from '@seeds/supabase/client/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('return_to')

  if (code) {
    try {
      const supabase = await createClient()

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      // Get the user to check their role
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Redirect based on context
      if (returnTo && returnTo.startsWith('/')) {
        // If we have a return URL, use it
        return NextResponse.redirect(`${requestUrl.origin}${returnTo}`)
      } else if (user?.user_metadata?.role === 'candidate') {
        // If user is a candidate, redirect to their profile or applications
        return NextResponse.redirect(`${requestUrl.origin}/applications`)
      } else {
        // Default redirect to home page after successful auth
        return NextResponse.redirect(requestUrl.origin)
      }
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('return_to')

  if (code) {
    try {
      const supabase = await createClient()

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      // Get the user to check their role
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Redirect based on context
      if (returnTo && returnTo.startsWith('/')) {
        // If we have a return URL, use it
        return NextResponse.redirect(`${requestUrl.origin}${returnTo}`)
      } else if (user?.user_metadata?.role === 'candidate') {
        // If user is a candidate, redirect to their profile or applications
        return NextResponse.redirect(`${requestUrl.origin}/applications`)
      } else {
        // Default redirect to home page after successful auth
        return NextResponse.redirect(requestUrl.origin)
      }
    } catch (error) {
      console.error('Unexpected auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }
  }

  // No code provided, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
