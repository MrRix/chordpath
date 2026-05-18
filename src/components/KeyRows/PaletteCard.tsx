import type { DiatonicChordDef } from '../../theory/keyDetection'
import type { SelectedChord, KeyContext } from '../../store/useAppStore'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Scale degree colouring ────────────────────────────────────────────────────
// I / iii / V (scale degrees 1, 3, 5) → accent teal — the primary structural
// chords. Everything else (ii, IV, vi, vii°) → muted — secondary colour.
function romanColour(roman: string): string {
  const r = roman.replace(/[°+]/g, '').toLowerCase()
  const isPrimary = r === 'i' || r === 'iii' || r === 'v'
  return isPrimary ? 'var(--accent-dark)' : 'var(--color-text-tertiary)'
}

interface PaletteCardProps {
  chord:            DiatonicChordDef
  inProgression:    boolean
  isSelected:       boolean
  keyContext:       KeyContext
  keyName:          string
  onTap:            (chord: SelectedChord) => void
  progressionName?: string   // e.g. "D/F#" — if set, clicking opens this inversion's diagram
}

export default function PaletteCard({
  chord,
  inProgression,
  isSelected,
  keyContext,
  keyName,
  onTap,
  progressionName,
}: PaletteCardProps) {
  const isMobile = useIsMobile()
  let bg        = 'var(--card-bg)'
  let border    = '0.5px solid var(--color-border-tertiary)'
  let nameColor = 'var(--color-text-primary)'

  if (isSelected) {
    bg        = 'rgba(94,190,196,.18)'
    border    = '1px solid var(--accent)'
    nameColor = '#085041'
  } else if (inProgression) {
    bg        = 'rgba(94,190,196,.10)'
    border    = '1px solid rgba(94,190,196,.35)'
    nameColor = '#085041'
  }

  // Roman numeral: I/iii/V = accent, everything else = muted — same across all rows
  const romanColor = romanColour(chord.roman)

  const handleClick = () => {
    // If the user entered an inversion (e.g. D/F#), open that diagram — not plain D
    const name = progressionName ?? chord.name
    onTap({ name, roman: chord.roman, keyContext, keyName })
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
      style={{
        flex: isMobile ? '1 1 calc(25% - 5px)' : 1,
        padding: isMobile ? '12px 4px' : '8px 4px',
        minHeight: isMobile ? 44 : 'auto',
        borderRadius: 'var(--radius)',
        border,
        background: bg,
        textAlign: 'center',
        cursor: 'pointer',
        minWidth: 0,
        transition: 'all .12s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => {
        if (!isSelected && !inProgression)
          e.currentTarget.style.border = '0.5px solid var(--color-border-secondary)'
      }}
      onMouseLeave={e => {
        if (!isSelected && !inProgression)
          e.currentTarget.style.border = '0.5px solid var(--color-border-tertiary)'
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isMobile ? 14 : 13,
          fontWeight: 500,
          color: nameColor,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {progressionName ?? chord.name}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isMobile ? 10 : 9,
          marginTop: 2,
          color: romanColor,
          lineHeight: 1,
        }}
      >
        {chord.roman}
      </div>
    </div>
  )
}
