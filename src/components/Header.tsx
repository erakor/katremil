'use client'

import { PERSONAS } from '@/lib/personas'
import type { PersonaId } from '@/lib/personas'
import { Segmented } from '@/components/ui/Segmented'

export type PersonaChoice = PersonaId | 'custom'

export function Header({
  personaId,
  onPersona,
  birthISO,
  maxBirthISO,
  onBirth,
}: {
  personaId: PersonaChoice
  onPersona: (p: PersonaChoice) => void
  birthISO: string
  maxBirthISO: string
  onBirth: (iso: string) => void
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-hairline px-5 py-3">
      <h1 className="font-display text-xl tracking-tight">Four Thousand Weeks</h1>
      <div className="flex flex-wrap items-center gap-3">
        {personaId === 'custom' && (
          <label className="flex items-center gap-2 text-sm text-muted">
            Born
            <input
              type="date"
              value={birthISO}
              max={maxBirthISO}
              onChange={(e) => e.target.value && onBirth(e.target.value)}
              className="num rounded-md border border-hairline bg-white/[0.03] px-2 py-1 text-xs text-ink"
            />
          </label>
        )}
        <Segmented<PersonaChoice>
          ariaLabel="Whose life to show"
          value={personaId}
          onChange={onPersona}
          options={[
            ...PERSONAS.map((p) => ({ value: p.id as PersonaChoice, label: p.label })),
            {
              value: 'custom',
              label: 'Yours',
              title: 'Your own birth date and chapters, saved in this browser',
            },
          ]}
        />
      </div>
    </header>
  )
}
