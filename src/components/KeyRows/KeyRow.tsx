import type { KeyScore } from '../../theory/keyDetection'
import type { SelectedChord, KeyContext } from '../../store/useAppStore'
import { getKeyContext } from '../../theory/descriptions'
import PaletteCard from './PaletteCard'

// ── Colour map keyed by KeyContext ────────────────────────────────────────────
const COLOURS: Record<KeyContext, { h: string; dk: string; bg: string; border: string }> = {
  major: {
    h:      'var(--key-major-h)',
    dk:     'var(--key-major-dk)',
    bg:     'var(--key-major-bg)',
    border: 'var(--key-major-border)',
  },
  minor: {
    h:      'var(--key-minor-h)',
    dk:     'var(--key-minor-dk)',
    bg:     'var(--key-minor-bg)',
    border: 'var(--key-minor-border)',
  },
  mixo: {
    h:      'var(--key-mixo-h)',
    dk:     'var(--key-mixo-dk)',
    bg:     'var(--key-mixo-bg)',
    border: 'var(--key-mixo-border)',
  },
}

// ── Feel label lookup (mirrors keyDetection.ts ch field, uses mode primary name) ──
const FEEL_LABELS: Record<string, string> = {
  Major:      'Bright & resolved',
  Lydian:     'Bright with a raised fourth — ethereal',
  Mixolydian: 'Bluesy',
  Minor:      'Dark & introspective',
  Dorian:     'Minor with raised sixth — soulful',
  Phrygian:   'Dark, Spanish feel',
  Locrian:    'Unstable, tense',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface KeyRowProps {
  keyScore:      KeyScore
  progressionChordNames: string[]
  selectedChord: SelectedChord | null
  onChordTap:    (chord: SelectedChord) => void
  isPrimary?:    boolean   // false = partial match row, show score badge
}

export default function KeyRow({ keyScore, progressionChordNames, selectedChord, onChordTap, isPrimary = true }: KeyRowProps) {
  const ctx     = getKeyContext(keyScore.modeName) as KeyContext
  const colours = COLOURS[ctx]
  const feel    = FEEL_LABELS[keyScore.modeName] ?? keyScore.modeName
  const keyName = `${keyScore.rootName} ${keyScore.modeName}`

  const isPartial = keyScore.tot > 0 && keyScore.score < keyScore.tot

  return (
    <div
      style={{
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        borderLeft: `4px solid ${isPrimary ? colours.border : colours.border + '88'}`,
        flexShrink: 0,
        opacity: isPrimary ? 1 : 0.82,
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px 10px 10px',
          gap: 8,
          background: colours.bg,
        }}
      >
        {/* Colour dot */}
        <svg width="10" height="10" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="5" r="5" fill={colours.h} />
        </svg>

        {/* Feel label */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            color: colours.dk,
            flex: 1,
          }}
        >
          {feel}
        </span>

        {/* Partial-match badge */}
        {isPartial && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: colours.h,
              background: colours.bg,
              border: `0.5px solid ${colours.border}`,
              borderRadius: 3,
              padding: '2px 5px',
              flexShrink: 0,
            }}
          >
            {keyScore.score}/{keyScore.tot}
          </span>
        )}

        {/* Key name */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: colours.h,
            flexShrink: 0,
          }}
        >
          {keyName}
        </span>
      </div>

      {/* Chord palette */}
      <div
        style={{
          display: 'flex',
          gap: 5,
          padding: '8px 12px 12px',
        }}
      >
        {keyScore.kc.map(chord => {
          const inProg = progressionChordNames.includes(chord.name)
          const isSel  = selectedChord?.name === chord.name && selectedChord?.keyName === keyName

          return (
            <PaletteCard
              key={chord.name + chord.roman}
              chord={chord}
              inProgression={inProg}
              isSelected={isSel}
              keyContext={ctx}
              keyName={keyName}
              onTap={onChordTap}
            />
          )
        })}
      </div>
    </div>
  )
}
