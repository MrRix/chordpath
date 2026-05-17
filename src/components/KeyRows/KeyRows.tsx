import { useAppStore } from '../../store/useAppStore'
import type { SelectedChord } from '../../store/useAppStore'
import KeyRow from './KeyRow'

export default function KeyRows() {
  const topKeys      = useAppStore(s => s.topKeys)
  const progression  = useAppStore(s => s.progression)
  const selectedChord = useAppStore(s => s.selectedChord)
  const setSelectedChord   = useAppStore(s => s.setSelectedChord)
  const clearSelectedChord = useAppStore(s => s.clearSelectedChord)

  const chordNames = progression.map(s => s.chordName).filter(Boolean) as string[]
  const hasChords  = chordNames.length > 0

  const handleChordTap = (chord: SelectedChord) => {
    // Toggle: tapping the same chord in the same key deselects
    if (selectedChord?.name === chord.name && selectedChord?.keyName === chord.keyName) {
      clearSelectedChord()
    } else {
      setSelectedChord(chord)
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!hasChords) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '32px 24px',
          color: 'var(--color-text-tertiary)',
          textAlign: 'center',
        }}
      >
        {/* Decorative five-line staff hint */}
        <svg width="80" height="40" viewBox="0 0 80 40" style={{ opacity: 0.12 }}>
          {[4, 12, 20, 28, 36].map(y => (
            <line key={y} x1="0" y1={y} x2="80" y2={y} stroke="currentColor" strokeWidth="1"/>
          ))}
          <circle cx="50" cy="12" r="6" fill="currentColor"/>
          <line x1="56" y1="12" x2="56" y2="-4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
          Type chords above to see the keys your progression lives in — and all the chords available to you in each key.
        </p>
      </div>
    )
  }

  // ── Key rows ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {topKeys.map(ks => (
        <KeyRow
          key={ks.key}
          keyScore={ks}
          progressionChordNames={chordNames}
          selectedChord={selectedChord}
          onChordTap={handleChordTap}
        />
      ))}

      {/* Show more link */}
      {topKeys.length > 0 && (
        <div
          style={{
            padding: '8px 14px 14px',
          }}
        >
          <button
            style={{
              fontSize: 11,
              color: 'var(--color-text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              padding: 0,
              transition: 'color .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
          >
            Show more matched keys →
          </button>
        </div>
      )}
    </div>
  )
}
