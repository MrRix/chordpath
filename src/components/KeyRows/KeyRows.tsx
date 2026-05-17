import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { SelectedChord } from '../../store/useAppStore'
import KeyRow from './KeyRow'

export default function KeyRows() {
  const topKeys      = useAppStore(s => s.topKeys)
  const progression  = useAppStore(s => s.progression)
  const selectedChord = useAppStore(s => s.selectedChord)
  const setSelectedChord   = useAppStore(s => s.setSelectedChord)
  const clearSelectedChord = useAppStore(s => s.clearSelectedChord)

  const [expanded, setExpanded] = useState(false)

  const chordNames = progression.map(s => s.chordName).filter(Boolean) as string[]
  const hasChords  = chordNames.length > 0

  const primaryKeys = topKeys.slice(0, 3)
  const moreKeys    = topKeys.slice(3)
  const topScore    = topKeys[0]?.score ?? 0

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
      {/* ── Primary key rows (always visible) ──────────────────────── */}
      {primaryKeys.map(ks => (
        <KeyRow
          key={ks.key}
          keyScore={ks}
          progressionChordNames={chordNames}
          selectedChord={selectedChord}
          onChordTap={handleChordTap}
          isPrimary
        />
      ))}

      {/* ── Expanded partial-match rows ──────────────────────────────── */}
      {expanded && moreKeys.length > 0 && (
        <>
          {/* Section divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px 4px',
            }}
          >
            <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
            <span
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '.7px',
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              }}
            >
              Partial matches
            </span>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
          </div>

          {moreKeys.map(ks => (
            <KeyRow
              key={ks.key}
              keyScore={ks}
              progressionChordNames={chordNames}
              selectedChord={selectedChord}
              onChordTap={handleChordTap}
              isPrimary={ks.score === topScore}
            />
          ))}
        </>
      )}

      {/* ── Show more / less toggle ──────────────────────────────────── */}
      {moreKeys.length > 0 && (
        <div style={{ padding: '8px 14px 14px' }}>
          <button
            onClick={() => setExpanded(e => !e)}
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
            {expanded
              ? 'Show less ↑'
              : `Show ${moreKeys.length} more matched key${moreKeys.length !== 1 ? 's' : ''} →`}
          </button>
        </div>
      )}
    </div>
  )
}
