import { useEffect } from 'react'
import { Chord } from 'tonal'
import { useAppStore } from '../../store/useAppStore'
import { positionsToNotes } from '../../theory/fretboard'
import { Fretboard } from '../Fretboard/Fretboard'

// Tonal represents major chords as "GM", "CM", etc. Normalise to "G", "C".
function normalizeChordName(name: string): string {
  return /^[A-G][#b]?M$/.test(name) ? name.slice(0, -1) : name
}

interface FretboardPanelProps { isMobile?: boolean }

export default function FretboardPanel({ isMobile = false }: FretboardPanelProps) {
  const fretboardOpen          = useAppStore(s => s.fretboardPanelOpen)
  const setFretboardOpen       = useAppStore(s => s.setFretboardOpen)
  const globalFretPositions    = useAppStore(s => s.globalFretPositions)
  const globalDetectedChord    = useAppStore(s => s.globalDetectedChord)
  const tapGlobalFret          = useAppStore(s => s.tapGlobalFret)
  const clearGlobalFretboard   = useAppStore(s => s.clearGlobalFretboard)
  const setGlobalDetectedChord = useAppStore(s => s.setGlobalDetectedChord)
  const addChord               = useAppStore(s => s.addChordToProgression)
  const progression            = useAppStore(s => s.progression)

  // Clear to blank slate every time the panel opens (all muted, no detected chord)
  useEffect(() => {
    if (fretboardOpen) clearGlobalFretboard()
  }, [fretboardOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Convert FretPosition[] → strings array for Fretboard component
  // String 0 = low E (leftmost), string 5 = high e (rightmost)
  const strings = Array.from({ length: 6 }, (_, i) => {
    const pos = globalFretPositions.find(p => p.string === i)
    return pos !== undefined ? pos.fret : -1
  })

  // Detect chord whenever positions change
  useEffect(() => {
    // Sort by string index (low E first) so Chord.detect always sees notes in
    // low→high order. Without this, a muted-then-re-opened string gets appended
    // to the end of globalFretPositions, causing B to appear before E and
    // producing a spurious slash chord like EM/B instead of E.
    const positions = globalFretPositions
      .filter(p => p.fret >= 0)
      .sort((a, b) => a.string - b.string)
    if (!positions.length) {
      setGlobalDetectedChord(null)
      return
    }
    const notes = positionsToNotes(positions)
    if (notes.length < 2) {
      setGlobalDetectedChord(null)
      return
    }
    const detected = Chord.detect(notes)
    // Prefer non-slash chords (root-position spellings) for cleaner display
    const preferred = detected.find(c => !c.includes('/')) ?? detected[0] ?? null
    setGlobalDetectedChord(preferred ? normalizeChordName(preferred) : null)
  }, [globalFretPositions, setGlobalDetectedChord])

  const handleFretboardChange = (newStrings: number[]) => {
    newStrings.forEach((fret, i) => {
      if (fret !== strings[i]) tapGlobalFret(i, fret)
    })
  }

  const openCount = strings.filter(f => f >= 0).length
  const canAdd    = !!globalDetectedChord && progression.filter(s => s.chordName).length < 5

  const handleAdd = () => {
    if (!globalDetectedChord) return
    addChord(globalDetectedChord)
    clearGlobalFretboard()
    setFretboardOpen(false)
  }

  if (!fretboardOpen) return null

  // Mobile: slide-up full-width sheet. Desktop: centred modal.
  const panelStyle = isMobile
    ? {
        position: 'fixed' as const,
        left: 0, right: 0, bottom: 0,
        background: 'var(--panel-bg)',
        borderTop: '0.5px solid var(--color-border-secondary)',
        borderRadius: '14px 14px 0 0',
        padding: '14px 14px 28px',
        boxShadow: '0 -8px 32px rgba(0,0,0,.28)',
        zIndex: 30,
      }
    : {
        width: 300,
        background: 'var(--panel-bg)',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '14px 14px 12px',
        boxShadow: '0 12px 40px rgba(0,0,0,.28)',
      }

  return (
    /* Overlay backdrop */
    <div
      onClick={e => { if (e.target === e.currentTarget) setFretboardOpen(false) }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.32)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 29,
      }}
    >
      {/* Panel */}
      <div style={panelStyle}>
        {/* Drag handle on mobile */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-secondary)' }} />
          </div>
        )}
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
              flex: 1,
            }}
          >
            Identify a chord
          </span>
          <button
            onClick={() => setFretboardOpen(false)}
            style={{
              width: isMobile ? 36 : 22,
              height: isMobile ? 36 : 22,
              borderRadius: '50%',
              fontSize: isMobile ? 20 : 14,
              color: 'var(--color-text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-bg-secondary)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--color-text-tertiary)'
            }}
          >
            ×
          </button>
        </div>

        {/* ── Subtitle ─────────────────────────────────────────────────── */}
        <p
          style={{
            fontSize: 10.5,
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.5,
            marginBottom: 10,
            fontFamily: 'var(--font-body)',
          }}
        >
          Tap a fret to press it, tap again to mute. Tap ○ or × above to open a string.
        </p>

        {/* ── Fretboard ────────────────────────────────────────────────── */}
        <div
          style={{
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            background: 'var(--card-bg)',
            display: 'flex',
            justifyContent: 'center',
            padding: '6px 4px 4px',
          }}
        >
          <Fretboard
            strings={strings}
            onChange={handleFretboardChange}
          />
        </div>

        {/* ── Detected chord display ───────────────────────────────────── */}
        <div
          style={{
            marginTop: 10,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: globalDetectedChord
              ? 'rgba(94,190,196,.09)'
              : 'var(--color-bg-secondary)',
            border: `0.5px solid ${globalDetectedChord ? 'rgba(94,190,196,.28)' : 'var(--color-border-tertiary)'}`,
            borderRadius: 'var(--radius)',
            transition: 'all .18s',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '.7px',
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-body)',
                marginBottom: 2,
              }}
            >
              Detected
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: globalDetectedChord ? 20 : 14,
                fontWeight: 500,
                color: globalDetectedChord ? 'var(--accent-dark)' : 'var(--color-text-tertiary)',
                lineHeight: 1,
                transition: 'font-size .12s',
              }}
            >
              {globalDetectedChord ?? (openCount > 0 ? '…' : '—')}
            </div>
          </div>

          {/* Clear button */}
          {openCount > 0 && (
            <button
              onClick={clearGlobalFretboard}
              title="Reset to open strings"
              style={{
                fontSize: 10,
                color: 'var(--color-text-tertiary)',
                background: 'none',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 4,
                cursor: 'pointer',
                padding: '3px 7px',
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
                e.currentTarget.style.color = 'var(--color-text-secondary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'
                e.currentTarget.style.color = 'var(--color-text-tertiary)'
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 7 }}>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              flex: 1,
              padding: '8px 10px',
              background: canAdd ? 'var(--accent)' : 'var(--color-border-secondary)',
              color: canAdd ? '#fff' : 'var(--color-text-tertiary)',
              fontSize: 11.5,
              fontWeight: 500,
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: canAdd ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-body)',
              transition: 'background .12s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            onMouseEnter={e => { if (canAdd) e.currentTarget.style.background = 'var(--accent-dark)' }}
            onMouseLeave={e => { if (canAdd) e.currentTarget.style.background = 'var(--accent)' }}
          >
            {globalDetectedChord ? `Add ${globalDetectedChord}` : 'Add to progression'}
          </button>
          <button
            onClick={() => setFretboardOpen(false)}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: '0.5px solid var(--color-border-secondary)',
              color: 'var(--color-text-secondary)',
              fontSize: 11.5,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-primary)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
