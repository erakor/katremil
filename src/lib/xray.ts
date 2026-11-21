import { COLS, TOTAL } from './life'

/** Sleep: 8h of every 24, drawn as the bottom third of each cell. */
export const SLEEP_FRAC = 56 / 168
/** Work: a 40h week, drawn as a band above sleep. */
export const WORK_FRAC = 40 / 168
export const WORK_FIRST_ROW = 22
export const WORK_LAST_ROW = 61
/** Rows 0..2 are mostly forgotten. */
export const FROSTED_ROWS = 3

export interface XrayFlags {
  forgotten: boolean
  sleep: boolean
  work: boolean
}

export const isWorkRow = (row: number) => row >= WORK_FIRST_ROW && row <= WORK_LAST_ROW

export interface Unclaimed {
  remaining: number
  sleep: number
  work: number
  free: number
}

/** Weeks after the current one, split into sleep, work, and awake-and-unclaimed. */
export function awakeUnclaimedWeeks(
  current: number,
  flags: { sleep: boolean; work: boolean } = { sleep: true, work: true },
): Unclaimed {
  let sleep = 0
  let work = 0
  let remaining = 0
  for (let i = current + 1; i < TOTAL; i++) {
    remaining++
    if (flags.sleep) sleep += SLEEP_FRAC
    if (flags.work && isWorkRow(Math.floor(i / COLS))) work += WORK_FRAC
  }
  return { remaining, sleep, work, free: remaining - sleep - work }
}
