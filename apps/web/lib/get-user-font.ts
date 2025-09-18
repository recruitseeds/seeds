import { createClient } from '@seeds/supabase/client/server'
import { cookies } from 'next/headers'

export async function getUserFont(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return 'inter' 
    }

    const { data, error } = await supabase
      .from('organization_users')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    if (error || !data?.settings) {
      return 'inter' 
    }

    const settings = data.settings as Record<string, unknown>
    const appearance = settings.appearance as Record<string, unknown>
    
    return appearance?.font as string || 'inter'
  } catch (error) {
    console.error('Error fetching user font preference:', error)
    return 'inter' 
  }
}


export function getUserFontFromClient(): string {
  if (typeof window === 'undefined') return 'inter'
  return localStorage.getItem('font-preference') || 'inter'
}