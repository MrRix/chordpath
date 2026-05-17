import { useEffect, useRef, useState } from 'react'
import { SVGuitarChord } from 'svguitar'
import { useAppStore } from '../../store/useAppStore'
import { getChordVoicings } from '../../theory/chordsDb'
import { keyChords, MODES, parseChord } from '../../theory/keyDetection'

// Derive the correct Roman numeral from the chord name + key row (pitch-class match,
// so enharmonics like F#/Gb never cause a mismatch).
function deriveRoman(chordName: string, keyName: string): string {
  const parsed = parseChord(chordName)
  if (!parsed) return '?'
  const parts = keyName.split(' ')
  const modeName = parts.slice(1).join(' ')
  const modeIdx  = MODES.findIndex(m => m.name === modeName)
  if (modeIdx < 0) return '?'
  const rootParsed = parseChord(parts[0])
  if (!rootParsed) return '?'
  const kc = keyChords(rootParsed.ri, modeIdx)
  return kc.find(c => c.ni === parsed.ri && c.q === parsed.q)?.roman ?? '?'
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

import type { ChordPosition } from '../../theory/chordsDb'

function positionLabel(v: ChordPosition): string {
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

  useEffect(() => {
    if (!diagramRef.current) return
    diagramRef.current.innerHTML = ''
    if (!voicing) return
    // CSS vars live on body.theme-canvas — must read from body, not documentElement
    const cs = getComputedStyle(document.body)
    const dotColor    = '#5EBEC4'
    const fretColor   = cs.getPropertyValue('--fret-color').trim()   || '#E2D9B8'
    const stringColor = cs.getPropertyValue('--string-color').trim() || '#9A8E7A'
    const textColor   = cs.getPropertyValue('--text').trim()         || '#2D2926'
    try {
      new SVGuitarChord(diagramRef.current)
        .configure({
          fingerColor:              dotColor,
          fretColor,
          stringColor,
          backgroundColor:          'transparent',
          color:                    textColor,
          fontFamily:               "'JetBrains Mono', monospace",
          frets:                    5,
          position:                 voicing.baseFret,
          emptyStringIndicatorSize: 0.3,
        })
        .chord({
          fingers: [...voicing.frets].reverse().map(
            (f, i) => [i + 1, f === -1 ? 'x' : f] as [number, number | 'x']
          ),
          // fromString must be the lowest-x (leftmost) string so the barre extends rightward.
          // In SVGuitarChord string 6 = low E (left) and string 1 = high e (right).
          barres: voicing.barres.map(b => ({ fret: b, fromString: 6, toString: 1 })),
        })
        .draw()
      // SVGuitarChord bug: RECTANGLE barre fill is hardcoded to 'black'.
      // Patch: recolour any element with fill="black" — only the buggy barre produces this.
      diagramRef.current.querySelectorAll('[fill="black"]').forEach(el => {
        ;(el as SVGElement).setAttribute('fill', dotColor)
      })
      // Make the SVG fluid: scale to container width so the container controls height,
      // not the other way around. This prevents layout shift when O/X rows appear/disappear.
      const svgEl = diagramRef.current.querySelector('svg')
      if (svgEl) {
        svgEl.style.width  = '100%'
        svgEl.style.height = 'auto'
        svgEl.style.display = 'block'
      }
    } catch { /* ignore */ }
  }, [voicing])

  // Derive Roman numeral live so it's always correct regardless of when the chord was selected
  const roman = selectedChord
    ? deriveRoman(selectedChord.name, selectedChord.keyName)
    : ''

  const roleColour = selectedChord
    ? (ROLE_COLOURS[selectedChord.keyContext] ?? 'var(--accent)')
    : 'var(--accent)'

  // ── Shared inner content ────────────────────────────────────────────────────
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
          {/* Chord name + role */}
          <div style={{ padding: '2px 14px 0', flexShrink: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 32 : 26,
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                lineHeight: 1,
              }}
            >
              {selectedChord.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                marginTop: 3,
                color: roleColour,
              }}
            >
              {roman} · {selectedChord.keyName}
            </div>
          </div>

          {/* ── Voicing selector — ABOVE diagram so it's always visible ── */}
          {voicings.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: isMobile ? '10px 14px 4px' : '8px 14px 4px',
                overflowX: 'auto',
                flexShrink: 0,
                // hide scrollbar but keep scrollability
                scrollbarWidth: 'none',
              } as React.CSSProperties}
            >
              {voicings.map((v, i) => {
                const active = i === voicingIdx
                return (
                  <button
                    key={i}
                    onClick={() => setVoicingIdx(i)}
                    title={`Voicing ${i + 1}: ${positionLabel(v)}`}
                    style={{
                      flexShrink: 0,
                      padding: isMobile ? '0 16px' : '0 12px',
                      height: isMobile ? 40 : 30,
                      borderRadius: 20,
                      fontSize: isMobile ? 13 : 11,
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
          )}

          {/* ── Chord diagram ── */}
          {/* Fixed-height container prevents layout shift when O/X row appears/disappears */}
          <div
            ref={diagramRef}
            style={{
              padding: '0 14px',
              height: isMobile ? 240 : 220,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          />

          {/* Dot indicators — subtle "there are more" signal below diagram */}
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

  // ── Mobile: bottom sheet ────────────────────────────────────────────────────
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
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 21,
            background: 'var(--panel-bg)',
            borderTop: '0.5px solid var(--color-border-secondary)',
            borderRadius: '14px 14px 0 0',
            boxShadow: '0 -8px 32px rgba(0,0,0,.22)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '72dvh',
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

  // ── Desktop: side column ────────────────────────────────────────────────────
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
