import { addDays, addYears } from './dates'
import type { Chapter, Life } from './life'
import type { PigmentKey } from './pigments'

export type PersonaId = '10' | '30' | '39' | '65'

export interface Persona {
  id: PersonaId
  age: number
  label: string
  /** Parent's age when their child was born; seeds the Times Left presets. */
  kidBornAge: number
}

export const PERSONAS: Persona[] = [
  { id: '10', age: 10, label: 'Age 10', kidBornAge: 32 },
  { id: '30', age: 30, label: 'Age 30', kidBornAge: 31 },
  { id: '39', age: 39, label: 'Age 39', kidBornAge: 33 },
  { id: '65', age: 65, label: 'Age 65', kidBornAge: 28 },
]

export const DEFAULT_PERSONA: PersonaId = '39'

type Spec = [label: string, from: number, to: number | null, pigment: PigmentKey]

const SPECS: Record<PersonaId, Spec[]> = {
  '10': [
    ['Early childhood', 0, 5, 'ochre'],
    ['School years', 5, null, 'slate'],
  ],
  '30': [
    ['Childhood in a hometown', 0, 18, 'ochre'],
    ['University & first city', 18, 23, 'slate'],
    ['Settling in', 23, null, 'sage'],
  ],
  '39': [
    ['Childhood in a seaside hometown', 0, 18, 'ochre'],
    ['University & first city', 18, 23, 'slate'],
    ['Living abroad', 23, 33, 'terracotta'],
    ['Present chapter', 33, null, 'sage'],
  ],
  '65': [
    ['Childhood in a hometown', 0, 18, 'ochre'],
    ['University & first city', 18, 24, 'slate'],
    ['Raising a family', 24, 45, 'terracotta'],
    ['Building a career', 45, 62, 'plum'],
    ['Present chapter', 62, null, 'teal'],
  ],
}

export function getPersona(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[2]
}

/** A sample life whose current week sits about twenty weeks into the persona's age row. */
export function personaLife(id: PersonaId, today: string): Life {
  const persona = getPersona(id)
  const birthISO = addDays(addYears(today, -persona.age), -140)
  const chapters: Chapter[] = SPECS[id].map(([label, from, to, pigment], i) => ({
    id: `p${id}-${i}`,
    label,
    startISO: addYears(birthISO, from),
    endISO: to === null ? undefined : addDays(addYears(birthISO, to), -1),
    pigment,
  }))
  return { birthISO, chapters }
}
