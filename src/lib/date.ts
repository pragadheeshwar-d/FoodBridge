export function parseBackendDate(value?: string | null): Date | null {
  if (!value) return null
  const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatBackendTime(value?: string | null, locale = 'en-IN') {
  const parsed = parseBackendDate(value)
  if (!parsed) return '—'
  return parsed.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}
