import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from '../types'

const conWarn = console.warn
const conLog = console.log

const IGNORE_WARNINGS = [
  'Using the user object as returned from supabase.auth.getSession()',
]

console.warn = (...args) => {
  const match = args.find((arg) =>
    typeof arg === 'string'
      ? IGNORE_WARNINGS.find((warning) => arg.includes(warning))
      : false
  )
  if (!match) {
    conWarn(...args)
  }
}

console.log = (...args) => {
  const match = args.find((arg) =>
    typeof arg === 'string'
      ? IGNORE_WARNINGS.find((warning) => arg.includes(warning))
      : false
  )
  if (!match) {
    conLog(...args)
  }
}

type CreateClientOptions = {
  admin?: boolean
  schema?: 'public' | 'storage'
}

export const createClient = async (options?: CreateClientOptions) => {
  const { admin = false, ...rest } = options ?? {}
  const cookieStore = await cookies()
  const headersList = await headers()

  const key = admin
    ? process.env.SUPABASE_SERVICE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const auth = admin
    ? {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    : {}

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      ...rest,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
      auth,
      global: {
        headers: {
          'user-agent': headersList.get('user-agent') ?? 'unknown',
          /**
           * TODO: Make use of read replicas when Supabase is upgraded to the pro plan
           * @see https://supabase.com/docs/guides/platform/read-replicas#experimental-routing
           */
          //   "sb-lb-routing-mode": "alpha-all-services",
        },
      },
    }
  )
}
