// Pure UTC date helpers. Every calendar date is an ISO "YYYY-MM-DD" string and all
// arithmetic happens on UTC midnights, so DST and the viewer's time zone never shift a week.

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
export const TOTAL_WEEKS = 4000;
export const WEEKS_PER_ROW = 52;
export const SOLAR_WEEKS_PER_YEAR = 365.2425 / 7;
export const DAYS_PER_MONTH = 365.2425 / 12;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function utc(y: number, m: number, d: number): number {
  const dt = new Date(0);
  dt.setUTCFullYear(y, m, d);
  return dt.getTime();
}

export function parseISO(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return NaN;
  return utc(+m[1], +m[2] - 1, +m[3]);
}

export function toISO(ms: number): string {
  const d = new Date(ms);
  const y = String(d.getUTCFullYear()).padStart(4, "0");
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isValidISO(iso: unknown): iso is string {
  if (typeof iso !== "string") return false;
  const ms = parseISO(iso);
  return Number.isFinite(ms) && toISO(ms) === iso;
}

export function addDays(iso: string, n: number): string {
  return toISO(parseISO(iso) + n * DAY_MS);
}

export function addWeeks(iso: string, n: number): string {
  return addDays(iso, n * 7);
}

/** Add calendar years (fractions become days). */
export function addYears(iso: string, years: number): string {
  const whole = Math.trunc(years);
  const frac = years - whole;
  const d = new Date(parseISO(iso));
  d.setUTCFullYear(d.getUTCFullYear() + whole);
  return addDays(toISO(d.getTime()), Math.round(frac * 365.2425));
}

export function mondayOf(iso: string): string {
  const d = new Date(parseISO(iso));
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return toISO(d.getTime() - dow * DAY_MS);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b) - parseISO(a)) / DAY_MS);
}

export function weeksBetween(a: string, b: string): number {
  return Math.floor((parseISO(b) - parseISO(a)) / WEEK_MS);
}

/** Absolute week number: Mondays counted from the first Monday of 1970 (1970-01-05). */
export function weekId(iso: string): number {
  return Math.round((parseISO(mondayOf(iso)) / DAY_MS - 4) / 7);
}

/** Today's calendar date in the viewer's locale, then treated as UTC. */
export function todayISO(): string {
  const d = new Date();
  return toISO(utc(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function formatDate(iso: string): string {
  const d = new Date(parseISO(iso));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "Mar 8–14, 2026", "Mar 30–Apr 5, 2026", "Dec 29, 2026–Jan 4, 2027". */
export function formatRange(startISO: string, endISO: string): string {
  const a = new Date(parseISO(startISO));
  const b = new Date(parseISO(endISO));
  const ay = a.getUTCFullYear();
  const by = b.getUTCFullYear();
  const am = MONTHS[a.getUTCMonth()];
  const bm = MONTHS[b.getUTCMonth()];
  if (ay !== by) return `${am} ${a.getUTCDate()}, ${ay}–${bm} ${b.getUTCDate()}, ${by}`;
  if (am !== bm) return `${am} ${a.getUTCDate()}–${bm} ${b.getUTCDate()}, ${ay}`;
  if (a.getUTCDate() === b.getUTCDate()) return `${am} ${a.getUTCDate()}, ${ay}`;
  return `${am} ${a.getUTCDate()}–${b.getUTCDate()}, ${ay}`;
}

/** Weeks to "Xy Yw" using the solar-year week count. */
export function formatYearsWeeks(weeks: number): string {
  const w = Math.max(0, Math.round(weeks));
  const y = Math.floor(w / SOLAR_WEEKS_PER_YEAR);
  const rest = Math.round(w - y * SOLAR_WEEKS_PER_YEAR);
  return `${y}y ${rest}w`;
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
