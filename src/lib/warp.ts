import { COLS, ROWS, TOTAL } from './life'

const FLOOR = 0.15

/** Row weights summing to 1. t = 0 is the clock (uniform); t = 1 is felt time (Janet's 1/age). */
export function rowWeights(t: number): Float64Array {
  const clamped = Math.min(1, Math.max(0, t))
  const janet = new Float64Array(ROWS)
  let sum = 0
  for (let a = 0; a < ROWS; a++) {
    janet[a] = 1 / Math.max(a + 1, 4) // infancy clamp
    sum += janet[a]
  }
  const out = new Float64Array(ROWS)
  for (let a = 0; a < ROWS; a++) {
    const felt = (1 - FLOOR) * (janet[a] / sum) + FLOOR / ROWS
    out[a] = (1 - clamped) / ROWS + clamped * felt
  }
  return out
}

/** Cumulative y offsets (ROWS + 1 entries) for a grid `height` px tall. */
export function rowOffsets(t: number, height: number): Float32Array {
  const w = rowWeights(t)
  const out = new Float32Array(ROWS + 1)
  let acc = 0
  for (let a = 0; a < ROWS; a++) {
    out[a] = acc * height
    acc += w[a]
  }
  out[ROWS] = height
  return out
}

/** Share of felt life (0..1) covered by `nCells` cells starting at `startCell`. */
export function feltShare(startCell: number, nCells: number): number {
  const w = rowWeights(1)
  const end = Math.min(TOTAL, startCell + nCells)
  let sum = 0
  for (let i = Math.max(0, startCell); i < end; i++) sum += w[Math.floor(i / COLS)] / COLS
  return sum
}

/** Row containing y, by binary search over the offsets. */
export function rowAtY(offsets: Float32Array, y: number): number {
  let lo = 0
  let hi = ROWS - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (offsets[mid] <= y) lo = mid
    else hi = mid - 1
  }
  return lo
}
