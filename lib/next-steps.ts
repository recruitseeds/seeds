import type { Json } from '@/supabase/types/db'

export interface NextStep {
  id: string
  description: string
  date: string | null
  completed: boolean
}

export function parseNextSteps(nextStepsJson: Json | null): NextStep[] | null {
  if (!nextStepsJson) return null

  try {
    if (Array.isArray(nextStepsJson)) {
      return nextStepsJson
        .filter((step): step is NextStep => {
          return (
            typeof step === 'object' &&
            step !== null &&
            'id' in step &&
            'description' in step &&
            typeof step.id === 'string' &&
            typeof step.description === 'string'
          )
        })
        .map((step) => ({
          id: step.id,
          description: step.description,
          date: step.date || null,
          completed: Boolean(step.completed),
        }))
    }

    if (typeof nextStepsJson === 'string') {
      const parsed = JSON.parse(nextStepsJson)
      if (Array.isArray(parsed)) {
        return parseNextSteps(parsed)
      }
    }

    return null
  } catch (error) {
    console.error('Error parsing next_steps:', error)
    return null
  }
}

export function formatNextStepsForDb(
  nextSteps: Array<{
    id: string
    description: string
    date: Date | undefined
    completed: boolean
  }>
): Json {
  return nextSteps
    .filter((step) => step.description.trim() !== '')
    .map((step) => ({
      id: step.id,
      description: step.description,
      date: step.date?.toISOString() || null,
      completed: step.completed,
    }))
}
