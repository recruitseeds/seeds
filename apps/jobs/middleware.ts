import { updateSession } from '@seeds/supabase/client/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Don't run middleware on static files
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Update the session using the shared auth middleware
  const response = NextResponse.next()
  const updatedResponse = await updateSession(request, response)

  return updatedResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle auth differently)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)',
  ],
}
