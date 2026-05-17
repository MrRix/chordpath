import { useEffect, useRef } from 'react'
import { SVGuitarChord } from 'svguitar'
import { useAppStore } from '../../store/useAppStore'
import { getChordVoicings } from '../../theory/chordsDb'
import { getChordDescription } from '../../theory/descriptions'

// ── Colour map by key context for the role line ───────────────────────────────
const ROLE_COLOURS: Record<string, string> = {
  major: 'var(--key-major-h)',
  minor: 'var(--key-minor-h)',
  mixo:  'var(--key-mixo-h)',
}

// ── Decorative fret grid for empty state ─────────────────────────────────────
function EmptyFretGrid() {
  return (
    <svg width="52" height="46" viewBox="0 0 52 46" fill="none" style={{ opacity: 0.12 }}>
      {/* 5 vertical string lines */}
      {[4, 16, 26, 36, 48].map(x => (
        <line key={`s${x}`} x1={x} y1="0" x2={x} y2="46" stroke="currentColor" strokeWidth=".8"/>
      ))}
      {/* 4 horizontal fret lines */}
      {[0, 14, 28, 42].map(y => (
        <line key={`f${y}`} x1="0" y1={y} x2="52" y2={y} stroke="currentColor" strokeWidth=".8"/>
      ))}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DiagramPanel() {
  const selectedChord    = useAppStore(s => s.selectedChord)
  const clearSelected    = useAppStore(s => s.clearSelectedChord)
  const diagramRef       = useRef<HTMLDivElement>(null)

  const voicings = selectedChord ? getChordVoicings(selectedChord.name) : []
  const voicing  = voicings[0] ?? null

  // Render SVGuitarChord into the diagram ref whenever the selection changes
  useEffect(() => {
    if (!diagramRef.current) return
    diagramRef.current.innerHTML = ''
    if (!voicing) return

    const cs = getComputedStyle(document.documentElement)
    try {
      new SVGuitarChord(diagramRef.current)
        .configure({
          fingerColor:     cs.getPropertyValue('--dot-color').trim()    || '#5EBEC4',
          fretColor:       cs.getPropertyValue('--fret-color').trim()   || '#E2D9B8',
          stringColor:     cs.getPropertyValue('--string-color').trim() || '#9A8E7A',
          backgroundColor: 'transparent',
          color:           cs.getPropertyValue('--text').trim()         || '#2D2926',
          fontFamily:      "'JetBrains Mono', monospace",
          frets:           5,
          position:        voicing.baseFret,
        })
        .chord({
          // chords-db stores [E,A,D,G,B,e] (low→high); SVGuitarChord string 1
          // is the rightmost (high e), so reverse before mapping.
          fingers: [...voicing.frets].reverse().map((f, i) => [i + 1, f === -1 ? 'x' : f] as [number, number | 'x']),
          barres:  voicing.barres.map(b => ({ fret: b, fromString: 1, toString: 6 })),
        })
        .draw()
    } catch {
      // silently ignore if chord isn't in the DB
    }
  }, [voicing])

  const description = selectedChord
    ? getChordDescription(selectedChord.keyContext, selectedChord.roman)
    : ''

  const roleColour = selectedChord ? (ROLE_COLOURS[selectedChord.keyContext] ?? 'var(--accent)') : 'var(--accent)'

  // ── Container ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: 224,
        flexShrink: 0,
        background: 'var(--panel-bg)',
        borderLeft: '0.5px solid var(--color-border-secondary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '12px 14px 0',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '.8px',
            fontWeight: 500,
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-body)',
            flex: 1,
          }}
        >
          Chord
        </span>
        {selectedChord && (
          <button
            onClick={clearSelected}
            title="Close"
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              fontSize: 12,
              color: 'var(--color-text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'all .12s',
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
        )}
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!selectedChord && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 14,
          }}
        >
          <EmptyFretGrid />
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-tertiary)',
              lineHeight: 1.6,
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
            }}
          >
            Tap any chord to see its fingering and how it's used in that key
          </p>
        </div>
      )}

      {/* ── Filled state ─────────────────────────────────────────────────── */}
      {selectedChord && (
        <>
          {/* Chord name (large Fraunces) */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              padding: '4px 14px 2px',
              lineHeight: 1,
            }}
          >
            {selectedChord.name}
          </div>

          {/* Role line */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '0 14px 12px',
              color: roleColour,
            }}
          >
            {selectedChord.roman} in {selectedChord.keyName}
          </div>

          {/* Fingering diagram */}
          <div
            ref={diagramRef}
            style={{ padding: '0 14px' }}
          />

          {/* Divider */}
          <div
            style={{
              height: '0.5px',
              background: 'var(--color-border-tertiary)',
              margin: '12px 14px',
            }}
          />

          {/* Theory description */}
          <div
            style={{
              padding: '0 14px',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.65,
              flex: 1,
              fontFamily: 'var(--font-body)',
            }}
          >
            {description || (
              <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                No description available for this chord in this context.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
