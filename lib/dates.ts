import { format, isValid, parse, parseISO } from 'date-fns'

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = parseISO(dateString)
    return format(date, 'MMM d, yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

export const parseDateString = (
  dateStr: string | null | undefined
): Date | undefined => {
  if (!dateStr) return undefined
  try {
    let date = parse(dateStr, 'yyyy-MM-dd', new Date())
    if (isValid(date)) return date
    date = parse(dateStr, 'yyyy-MM', new Date())
    if (isValid(date)) return date
    return undefined
  } catch {
    return undefined
  }
}

export const formatDateToYYYYMMDD = (date: Date | null | undefined): string => {
  if (!date || !isValid(date)) return ''
  try {
    return format(date, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export const formatDisplayDate = (
  dateStr: string | null | undefined
): string => {
  if (!dateStr) return 'N/A'
  const date = parseDateString(dateStr)
  return date ? format(date, 'MMM yyyy') : dateStr
}

export const displayDateRange = (
  startDate: string | null,
  dbEndDate: string | null,
  isCurrentFlag: boolean | null | undefined
) => {
  const start = formatDisplayDate(startDate)
  const end = isCurrentFlag ? 'Present' : formatDisplayDate(dbEndDate)
  return `${start} - ${end}`
}
