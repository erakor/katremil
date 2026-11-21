// Pure UTC date helpers. Every calendar date is an ISO "YYYY-MM-DD" string and all
// arithmetic happens on UTC midnights, so DST and the viewer's time zone never shift a week.

const DAY_MS = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function utc(y: number, m: number, d: number): number {
  const dt = new Date(0)
  dt.setUTCFullYear(y, m, d)
  return dt.getTime()
}

function parseISO(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return NaN
  return utc(+m[1], +m[2] - 1, +m[3])
}

function toISO(ms: number): string {
  const d = new Date(ms)
  const y = String(d.getUTCFullYear()).padStart(4, '0')
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isValidISO(iso: unknown): iso is string {
  if (typeof iso !== 'string') return false
  const ms = parseISO(iso)
  return Number.isFinite(ms) && toISO(ms) === iso
}

export function addDays(iso: string, n: number): string {
  return toISO(parseISO(iso) + n * DAY_MS)
}

export function addWeeks(iso: string, n: number): string {
  return addDays(iso, n * 7)
}

/** Add calendar years (fractions become days). */
export function addYears(iso: string, years: number): string {
  const whole = Math.trunc(years)
  const frac = years - whole
  const d = new Date(parseISO(iso))
  d.setUTCFullYear(d.getUTCFullYear() + whole)
  return addDays(toISO(d.getTime()), Math.round(frac * 365.2425))
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b) - parseISO(a)) / DAY_MS)
}

/** Today's calendar date in the viewer's locale, then treated as UTC. */
export function todayISO(): string {
  const d = new Date()
  return toISO(utc(d.getFullYear(), d.getMonth(), d.getDate()))
}

export function formatDate(iso: string): string {
  const d = new Date(parseISO(iso))
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}
