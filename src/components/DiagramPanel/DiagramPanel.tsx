import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getChordVoicings } from '../../theory/chordsDb'
import { keyChords, MODES, parseChord } from '../../theory/keyDetection'
import { drawDiagram } from '../../theory/diagramRenderer'
import { getQualityLabel, NOTE_TO_PC } from '../../theory/chordRegistry'

// ── Roman numeral derivation ──────────────────────────────────────────────────
// Uses pitch-class matching so enharmonics (F#/Gb) never cause a mismatch.
// For slash chords, derives from the chord root and appends inversion label.
function deriveRoman(chordName: string, keyName: string): string {
  const parsed = parseChord(chordName)
  if (!parsed) return '?'

  const parts    = keyName.split(' ')
  const modeName = parts.slice(1).join(' ')
  const modeIdx  = MODES.findIndex(m => m.name === modeName)
  if (modeIdx < 0) return '?'

  const rootParsed = parseChord(parts[0])
  if (!rootParsed) return '?'

  const kc = keyChords(rootParsed.ri, modeIdx)
  const match = kc.find(c => c.ni === parsed.ri && c.q === parsed.q)
  const baseRoman = match?.roman ?? '?'

  // For slash chords: append bass note's scale degree if diatonic,
  // or mark as non-diatonic bass.
  if (parsed.bass) {
    const bassPC  = NOTE_TO_PC[parsed.bass] ?? -1
    const scalePC = new Set(MODES[modeIdx].iv.map(i => (rootParsed.ri + i) % 12))
    if (bassPC >= 0 && scalePC.has(bassPC)) {
      // Find which scale degree the bass note is
      const bassDegree = kc.find(c => c.ni === bassPC)
      if (bassDegree) return `${baseRoman}/${bassDegree.roman}`
    }
    return `${baseRoman}/(♭bass)`
  }

  return baseRoman
}

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
      {[4, 16, 26, 36, 48].map(x => (
        <line key={`s${x}`} x1={x} y1="0" x2={x} y2="46" stroke="currentColor" strokeWidth=".8"/>
      ))}
      {[0, 14, 28, 42].map(y => (
        <line key={`f${y}`} x1="0" y1={y} x2="52" y2={y} stroke="currentColor" strokeWidth=".8"/>
      ))}
    </svg>
  )
}

// ── Voicing label helper ──────────────────────────────────────────────────────
import type { ChordPosition } from '../../theory/chordsDb'

function positionLabel(v: ChordPosition): string {
  // Use the pre-computed label from chordsDb if available
  if (v.label) return v.label
  // Fallback
  const hasOpen = v.frets.some(f => f === 0)
  if (v.baseFret <= 1 && hasOpen) return 'Open'
  return `${v.baseFret}fr`
}

// ── Main component ────────────────────────────────────────────────────────────
interface DiagramPanelProps { isMobile?: boolean }

export default function DiagramPanel({ isMobile = false }: DiagramPanelProps) {
  const selectedChord = useAppStore(s => s.selectedChord)
  const clearSelected = useAppStore(s => s.clearSelectedChord)
  const diagramRef    = useRef<HTMLDivElement>(null)
  const [voicingIdx, setVoicingIdx] = useState(0)

  const voicings = selectedChord ? getChordVoicings(selectedChord.name) : []
  const voicing  = voicings[voicingIdx] ?? voicings[0] ?? null

  useEffect(() => { setVoicingIdx(0) }, [selectedChord?.name])

  // Diagram-first layout: diagram is the visual hero at ~60% of panel width.
  // Heading text is scaled down so the diagram has the most visual weight.
  useEffect(() => {
    if (!diagramRef.current) return
    if (!voicing) { diagramRef.current.innerHTML = ''; return }

    const bassNote = selectedChord?.name.includes('/')
      ? selectedChord.name.split('/')[1]
      : undefined

    diagramRef.current.innerHTML = drawDiagram(voicing, {
      width:    isMobile ? 166 : 148,
      height:   isMobile ? 204 : 178,
      bassNote,
    })
  }, [voicing, isMobile, selectedChord?.name])

  // Derive Roman numeral — always correct regardless of when chord was selected
  const roman = selectedChord
    ? deriveRoman(selectedChord.name, selectedChord.keyName)
    : ''

  // Quality label line, e.g. 'minor', 'major 7th'
  const qualityLabel = selectedChord
    ? (() => {
        const parsed = parseChord(selectedChord.name)
        return parsed ? getQualityLabel(parsed.suf) : ''
      })()
    : ''

  const roleColour = selectedChord
    ? (ROLE_COLOURS[selectedChord.keyContext] ?? 'var(--accent)')
    : 'var(--accent)'

  // ── Shared inner content ──────────────────────────────────────────────────
  const content = (
    <>
      {/* Panel header */}
      <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
              width: isMobile ? 36 : 24,
              height: isMobile ? 36 : 24,
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

      {/* Empty state */}
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

      {/* Filled state */}
      {selectedChord && (
        <>
          {/* Chord name + role — compact label, diagram is the hero */}
          <div style={{ padding: '2px 14px 4px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isMobile ? 24 : 20,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                }}
              >
                {selectedChord.name}
              </span>
              {qualityLabel && (
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: isMobile ? 11 : 10,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {qualityLabel}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: isMobile ? 11 : 10,
                marginTop: 2,
                color: roleColour,
              }}
            >
              {roman} · {selectedChord.keyName}
            </div>
          </div>

          {/* Voicing selector — gradient fade indicates overflow is scrollable */}
          {voicings.length > 1 && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Fade-right mask — always present, hidden by bg when no overflow */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 0, top: 0, bottom: 0,
                  width: 28,
                  background: 'linear-gradient(to right, transparent, var(--panel-bg))',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  padding: isMobile ? '10px 14px 6px' : '8px 12px 5px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                } as React.CSSProperties}
              >
                {voicings.map((v, i) => {
                  const active = i === voicingIdx
                  return (
                    <button
                      key={i}
                      onClick={() => setVoicingIdx(i)}
                      title={`Voicing ${i + 1}`}
                      style={{
                        flexShrink: 0,
                        padding: isMobile ? '0 14px' : '0 10px',
                        height: isMobile ? 36 : 26,
                        borderRadius: 20,
                        fontSize: isMobile ? 12 : 10,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: active ? 600 : 400,
                        background: active ? 'var(--accent)' : 'transparent',
                        color: active ? '#fff' : 'var(--color-text-secondary)',
                        border: active ? 'none' : '1px solid var(--color-border-secondary)',
                        cursor: 'pointer',
                        transition: 'all .12s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.color = 'var(--accent)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
                          e.currentTarget.style.color = 'var(--color-text-secondary)'
                        }
                      }}
                    >
                      {positionLabel(v)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Chord diagram — centered, diagram-first: takes most of the panel height */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2px 12px 0',
              height: isMobile ? 216 : 190,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <div ref={diagramRef} />
          </div>

          {/* Dot indicators */}
          {voicings.length > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 5,
                padding: '4px 0 10px',
                flexShrink: 0,
              }}
            >
              {voicings.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setVoicingIdx(i)}
                  style={{
                    width: i === voicingIdx ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === voicingIdx ? 'var(--accent)' : 'var(--color-border-secondary)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                  aria-label={`Voicing ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Tap-outside backdrop */}
        <div
          onClick={selectedChord ? clearSelected : undefined}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.32)',
            zIndex: 20,
            opacity: selectedChord ? 1 : 0,
            pointerEvents: selectedChord ? 'auto' : 'none',
            transition: 'opacity .28s',
          }}
        />
        {/* Sheet */}
        <div
          style={{
            position: 'fixed',
            left: 0, right: 0, bottom: 0,
            zIndex: 21,
            background: 'var(--panel-bg)',
            borderTop: '0.5px solid var(--color-border-secondary)',
            borderRadius: '14px 14px 0 0',
            boxShadow: '0 -8px 32px rgba(0,0,0,.22)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '78dvh',
            transform: selectedChord ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform .28s cubic-bezier(.32,.72,0,1)',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border-secondary)' }} />
          </div>
          {content}
        </div>
      </>
    )
  }

  // ── Desktop: side column ──────────────────────────────────────────────────
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
      {content}
    </div>
  )
}
