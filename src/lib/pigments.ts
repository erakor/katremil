// Muted chapter pigments plus the single warm accent. Hex values are needed as raw
// strings because the grid is painted on a canvas.

export const PIGMENTS = [
  { key: 'slate', name: 'Slate blue', hex: '#5F7BA6' },
  { key: 'sage', name: 'Sage', hex: '#7E9A7C' },
  { key: 'terracotta', name: 'Terracotta', hex: '#C0705A' },
  { key: 'ochre', name: 'Ochre', hex: '#B58A3F' },
  { key: 'plum', name: 'Plum', hex: '#8C5E86' },
  { key: 'teal', name: 'Smoke teal', hex: '#5E8F92' },
] as const

export type PigmentKey = (typeof PIGMENTS)[number]['key']

export const PIGMENT_KEYS: string[] = PIGMENTS.map((p) => p.key)

export const AMBER = '#F2B544'
export const GHOST = '#262B37'
export const OUTLINE = 'rgba(236, 230, 218, 0.17)'
export const INK = '#ECE6DA'

export function pigmentHex(key: PigmentKey): string {
  return PIGMENTS.find((p) => p.key === key)?.hex ?? GHOST
}

export function isPigmentKey(v: unknown): v is PigmentKey {
  return typeof v === 'string' && PIGMENT_KEYS.includes(v)
}
