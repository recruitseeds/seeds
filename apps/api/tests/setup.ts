import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

afterAll(async () => {})

beforeEach(async () => {})

afterEach(async () => {})
