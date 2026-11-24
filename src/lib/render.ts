import { AMBER, GHOST, INK, OUTLINE } from './pigments'
import { COLS, ROWS, TOTAL } from './life'
import { MARK_CELLS } from './milestones'
import { FROSTED_ROWS, SLEEP_FRAC, WORK_FRAC, isWorkRow } from './xray'

export interface StampMark {
  anchor: number
  n: number
  kind: 'hover' | 'pinned'
}

export interface Scene {
  w: number
  h: number
  dpr: number
  offsets: Float32Array
  current: number
  chapterIdx: Int16Array
  chapterHex: string[]
  lastWeeks: Map<number, number>
  /** 1 where the Times Left lens counts an occurrence. */
  times: Uint8Array | null
  /** 0 = Chapters lens, 1 = Times Left lens (tweened). */
  lensT: number
  xray: { forgotten: number; sleep: number; work: number }
  stamps: StampMark[]
  hover: number | null
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function cellRect(s: Pick<Scene, 'w' | 'offsets'>, cell: number): Rect {
  const cw = s.w / COLS
  const gap = cw > 6 ? 1.5 : 1
  const r = Math.floor(cell / COLS)
  const c = cell % COLS
  const y0 = s.offsets[r]
  return {
    x: c * cw + gap / 2,
    y: y0 + gap / 2,
    w: cw - gap,
    h: Math.max(0.6, s.offsets[r + 1] - y0 - gap),
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, s: Scene): void {
  const { dpr, w, h } = s
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const chaptersAlpha = 1 - s.lensT
  let fill = ''
  const setFill = (c: string) => {
    if (c !== fill) {
      ctx.fillStyle = c
      fill = c
    }
  }

  // Past cells: ghost base, chapter pigment faded by the lens.
  ctx.globalAlpha = 1
  setFill(GHOST)
  for (let i = 0; i < s.current; i++) {
    const r = cellRect(s, i)
    ctx.fillRect(r.x, r.y, r.w, r.h)
  }
  if (chaptersAlpha > 0.003) {
    ctx.globalAlpha = chaptersAlpha
    for (let i = 0; i < s.current; i++) {
      const ci = s.chapterIdx[i]
      if (ci < 0) continue
      setFill(s.chapterHex[ci] ?? GHOST)
      const r = cellRect(s, i)
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
    ctx.globalAlpha = 1
  }

  // Future cells: one batched hairline path.
  ctx.beginPath()
  for (let i = s.current + 1; i < TOTAL; i++) {
    const r = cellRect(s, i)
    ctx.rect(r.x + 0.5, r.y + 0.5, Math.max(0.5, r.w - 1), Math.max(0.1, r.h - 1))
  }
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 1
  ctx.stroke()

  // X-ray layers: sleep at the bottom of each cell, work above it, forgotten years frosted.
  const bands = (
    alpha: number,
    color: string,
    from: number,
    size: number,
    rowOk: (r: number) => boolean,
  ) => {
    if (alpha < 0.003) return
    ctx.globalAlpha = alpha
    setFill(color)
    for (let r = 0; r < ROWS; r++) {
      if (!rowOk(r)) continue
      for (let c = 0; c < COLS; c++) {
        const rc = cellRect(s, r * COLS + c)
        ctx.fillRect(rc.x, rc.y + rc.h * (1 - from - size), rc.w, rc.h * size)
      }
    }
    ctx.globalAlpha = 1
  }
  bands(s.xray.sleep, 'rgb(70, 80, 150)', 0, SLEEP_FRAC, () => true)
  bands(s.xray.work, 'rgb(196, 204, 226)', SLEEP_FRAC, WORK_FRAC, isWorkRow)
  if (s.xray.forgotten > 0.003) {
    ctx.globalAlpha = s.xray.forgotten * 0.5
    setFill(INK)
    for (let i = 0; i < Math.min(s.current, FROSTED_ROWS * COLS); i++) {
      const r = cellRect(s, i)
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
    ctx.globalAlpha = 1
  }

  // Last-week markers.
  if (chaptersAlpha > 0.003 && s.lastWeeks.size > 0) {
    ctx.globalAlpha = chaptersAlpha * 0.6
    setFill(INK)
    for (const cell of s.lastWeeks.keys()) {
      const r = cellRect(s, cell)
      const rad = Math.min(1.4, r.w / 4, r.h / 2)
      ctx.beginPath()
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // 1,000-week marks: the cell is outlined, with a small diamond when the row is tall enough.
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  for (const cell of MARK_CELLS) {
    const r = cellRect(s, cell)
    ctx.globalAlpha = 0.8
    ctx.strokeRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1)
    if (r.h >= 6) {
      const cx = r.x + r.w / 2
      const cy = r.y + r.h / 2
      const d = Math.min(r.w, r.h) * 0.32
      setFill(INK)
      ctx.beginPath()
      ctx.moveTo(cx, cy - d)
      ctx.lineTo(cx + d, cy)
      ctx.lineTo(cx, cy + d)
      ctx.lineTo(cx - d, cy)
      ctx.closePath()
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1

  // Times Left occurrences: past ones are quiet, future ones are amber.
  if (s.times && s.lensT > 0.003) {
    for (let i = 0; i < TOTAL; i++) {
      if (!s.times[i]) continue
      const r = cellRect(s, i)
      ctx.globalAlpha = s.lensT * (i <= s.current ? 0.55 : 1)
      setFill(i <= s.current ? INK : AMBER)
      const rad = Math.max(0.8, Math.min(r.w, r.h) * 0.34)
      ctx.beginPath()
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // Stamps: tinted cells with a rectangle around each row segment.
  for (const st of s.stamps) {
    const end = Math.min(TOTAL, st.anchor + st.n)
    const hover = st.kind === 'hover'
    ctx.globalAlpha = hover ? 0.42 : 0.3
    setFill(hover ? AMBER : INK)
    for (let i = st.anchor; i < end; i++) {
      const r = cellRect(s, i)
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = hover ? AMBER : INK
    ctx.lineWidth = 1.5
    let i = st.anchor
    while (i < end) {
      const row = Math.floor(i / COLS)
      const last = Math.min(end - 1, row * COLS + COLS - 1)
      const a = cellRect(s, i)
      const b = cellRect(s, last)
      ctx.strokeRect(a.x, a.y, b.x + b.w - a.x, a.h)
      i = last + 1
    }
  }

  // Current week.
  {
    const r = cellRect(s, s.current)
    ctx.globalAlpha = 0.3
    setFill(AMBER)
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.globalAlpha = 1
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 1.5
    ctx.strokeRect(r.x, r.y, r.w, r.h)
  }

  // Hover: a last-week cell lifts off the grid; any other cell gets an outline.
  if (s.hover !== null) {
    const r = cellRect(s, s.hover)
    const lastIdx = s.lastWeeks.get(s.hover)
    if (lastIdx !== undefined && chaptersAlpha > 0.5) {
      const pad = 3
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4
      ctx.fillStyle = s.chapterHex[lastIdx] ?? GHOST
      ctx.fillRect(r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2)
      ctx.restore()
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.5
      ctx.strokeRect(r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2)
    } else {
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.25
      ctx.strokeRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1)
    }
  }
}
