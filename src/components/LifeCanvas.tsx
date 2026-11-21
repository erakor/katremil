'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { COLS, ROWS, TOTAL, rowOf } from '@/lib/life'
import { drawScene, cellRect } from '@/lib/render'
import type { Scene, StampMark } from '@/lib/render'
import { rowAtY, rowOffsets } from '@/lib/warp'
import type { XrayFlags } from '@/lib/xray'

export interface LifeCanvasProps {
  current: number
  chapterIdx: Int16Array
  chapterHex: string[]
  lastWeeks: Map<number, number>
  times: Uint8Array | null
  lens: 'chapters' | 'times'
  warp: number
  xray: XrayFlags
  stamps: StampMark[]
  hover: number | null
  onHover: (cell: number | null) => void
  onCell: (cell: number) => void
  onClear: () => void
}

const DECADES = [0, 10, 20, 30, 40, 50, 60, 70, 79]
const MIN_TICK_GAP = 14

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function LifeCanvas(props: LifeCanvasProps) {
  const { current, warp, hover, onHover, onCell, onClear } = props
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const offsets = useMemo(() => rowOffsets(warp, size.h), [warp, size.h])

  // ---- sizing
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      const h = Math.round(entry.contentRect.height)
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // ---- drawing: one rAF loop that tweens lens / x-ray alphas and paints the canvas
  const latest = useRef({ props, offsets, size })
  const anim = useRef({ lens: 0, forgotten: 0, sleep: 0, work: 0, last: 0, raf: 0 })

  const tick = useCallback(function frame(now: number) {
    const a = anim.current
    a.raf = 0
    const { props: p, offsets: off, size: sz } = latest.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || sz.w === 0 || sz.h === 0) return

    const dt = a.last ? Math.min(64, now - a.last) : 16
    a.last = now
    const k = prefersReducedMotion() ? 1 : 1 - Math.exp(-dt / 70)
    const target = {
      lens: p.lens === 'times' ? 1 : 0,
      forgotten: p.xray.forgotten ? 1 : 0,
      sleep: p.xray.sleep ? 1 : 0,
      work: p.xray.work ? 1 : 0,
    }
    let settled = true
    for (const key of ['lens', 'forgotten', 'sleep', 'work'] as const) {
      const diff = target[key] - a[key]
      if (Math.abs(diff) < 0.004) a[key] = target[key]
      else {
        a[key] += diff * k
        settled = false
      }
    }

    const dpr = Math.min(3, window.devicePixelRatio || 1)
    const bw = Math.round(sz.w * dpr)
    const bh = Math.round(sz.h * dpr)
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw
      canvas.height = bh
    }
    const scene: Scene = {
      w: sz.w,
      h: sz.h,
      dpr,
      offsets: off,
      current: p.current,
      chapterIdx: p.chapterIdx,
      chapterHex: p.chapterHex,
      lastWeeks: p.lastWeeks,
      times: p.times,
      lensT: a.lens,
      xray: { forgotten: a.forgotten, sleep: a.sleep, work: a.work },
      stamps: p.stamps,
      hover: p.hover,
    }
    drawScene(ctx, scene)

    if (!settled) a.raf = requestAnimationFrame(frame)
    else a.last = 0
  }, [])

  useEffect(() => {
    latest.current = { props, offsets, size }
    if (!anim.current.raf) anim.current.raf = requestAnimationFrame(tick)
  })

  useEffect(() => {
    const a = anim.current
    return () => {
      if (a.raf) cancelAnimationFrame(a.raf)
      a.raf = 0
    }
  }, [])

  // ---- hit-testing
  const cellAt = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current
      if (!canvas || size.w === 0) return null
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      if (x < 0 || y < 0 || x >= size.w || y >= size.h) return null
      const col = Math.min(COLS - 1, Math.floor(x / (size.w / COLS)))
      return rowAtY(offsets, y) * COLS + col
    },
    [offsets, size],
  )

  const onMove = (e: PointerEvent) => {
    const cell = cellAt(e.clientX, e.clientY)
    if (cell !== hover) onHover(cell)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClear()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      onCell(hover ?? current)
      return
    }
    const step = e.shiftKey
    const delta =
      e.key === 'ArrowLeft'
        ? step
          ? -10
          : -1
        : e.key === 'ArrowRight'
          ? step
            ? 10
            : 1
          : e.key === 'ArrowUp'
            ? COLS * (step ? -10 : -1)
            : e.key === 'ArrowDown'
              ? COLS * (step ? 10 : 1)
              : 0
    if (!delta) return
    e.preventDefault()
    onHover(Math.min(TOTAL - 1, Math.max(0, (hover ?? current) + delta)))
  }

  // ---- axis ticks and the current-week glow, positioned from the same offsets
  const curRow = rowOf(current)
  const rowMid = (r: number) => (offsets[r] + offsets[r + 1]) / 2
  const curY = rowMid(curRow)
  const ticks = DECADES.filter((age) => Math.abs(rowMid(age) - curY) >= MIN_TICK_GAP)
  const glow = size.w > 0 ? cellRect({ w: size.w, offsets }, current) : null

  return (
    <div className="flex h-full">
      <div className="relative w-9 shrink-0 select-none" aria-hidden="true">
        {size.h > 0 &&
          ticks.map((age) => (
            <span
              key={age}
              className="num absolute right-2 text-[11px] leading-none text-muted"
              style={{ top: 0, transform: `translateY(${rowMid(age) - 6}px)` }}
            >
              {age}
            </span>
          ))}
        {size.h > 0 && (
          <span
            className="num absolute right-2 text-[11px] leading-none font-semibold text-amber"
            style={{ top: 0, transform: `translateY(${curY - 6}px)` }}
          >
            {curRow}
          </span>
        )}
      </div>
      {/* a single focusable stop that exposes the whole grid to the keyboard */}
      {/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div
        ref={boxRef}
        role="application"
        tabIndex={0}
        aria-label={`Life in weeks: ${ROWS} rows of ${COLS}. Arrow keys inspect a week, Shift jumps further, Enter places the chosen stamp, Escape clears.`}
        onKeyDown={onKeyDown}
        onBlur={() => onHover(null)}
        className="relative min-w-0 flex-1 touch-pan-y"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair"
          style={{ width: size.w, height: size.h }}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => onHover(null)}
          onClick={(e) => {
            const cell = cellAt(e.clientX, e.clientY)
            if (cell !== null) onCell(cell)
          }}
        />
        {glow && (
          <div
            className="pulse"
            style={{ left: glow.x, top: glow.y, width: glow.w, height: glow.h }}
          />
        )}
      </div>
      {/* oxlint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </div>
  )
}
