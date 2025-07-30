interface FormatAmountOptions {
  currency: string
  amount: number
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatAmount({
  currency,
  amount,
  locale = 'en-US',
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
}: FormatAmountOptions): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}

export function formatJobType(jobType: string): string {
  const typeMap: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
  }
  return typeMap[jobType] || jobType
}

export function formatExperienceLevel(level: string): string {
  const levelMap: Record<string, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior Level',
    lead: 'Lead',
    executive: 'Executive',
  }
  return levelMap[level] || level
}

export function formatJobStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
