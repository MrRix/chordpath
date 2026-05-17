import { useEffect, useRef, useState } from 'react'
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
    const cs = getComputedStyle(document.documentElement)
    const dotColor    = '#5EBEC4'
    const fretColor   = cs.getPropertyValue('--fret-color').trim()   || '#E2D9B8'
    const stringColor = cs.getPropertyValue('--string-color').trim() || '#9A8E7A'
    const textColor   = cs.getPropertyValue('--text').trim()         || '#2D2926'
    try {
      new SVGuitarChord(diagramRef.current)
        .configure({
          fingerColor:     dotColor,
          fretColor,
          stringColor,
          backgroundColor: 'transparent',
          color:           textColor,
          fontFamily:      "'JetBrains Mono', monospace",
          frets:           5,
          position:        voicing.baseFret,
        })
        .chord({
          fingers: [...voicing.frets].reverse().map(
            (f, i) => [i + 1, f === -1 ? 'x' : f] as [number, number | 'x']
          ),
          barres: voicing.barres.map(b => ({ fret: b, fromString: 1, toString: 6 })),
        })
        .draw()
    } catch { /* ignore */ }
  }, [voicing])

  const description = selectedChord
    ? getChordDescription(selectedChord.keyContext, selectedChord.roman)
    : ''

  const roleColour = selectedChord
    ? (ROLE_COLOURS[selectedChord.keyContext] ?? 'var(--accent)')
    : 'var(--accent)'

  // ── Shared inner content ────────────────────────────────────────────────────
  const content = (
    <>
      {/* Panel header */}
      <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
              width: 24,
              height: 24,
              borderRadius: '50%',
              fontSize: 14,
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
          {/* Chord name + role — always visible at top */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              padding: '4px 14px 2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {selectedChord.name}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '0 14px 10px',
              color: roleColour,
              flexShrink: 0,
            }}
          >
            {selectedChord.roman} in {selectedChord.keyName}
          </div>

          {/* Scrollable body — diagram + voicing tabs + description */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          <div ref={diagramRef} style={{ padding: '0 14px', flexShrink: 0 }} />

          {voicings.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '6px 14px 2px',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {voicings.map((v, i) => {
                const active = i === voicingIdx
                return (
                  <button
                    key={i}
                    onClick={() => setVoicingIdx(i)}
                    title={`Voicing ${i + 1}: ${positionLabel(v)}`}
                    style={{
                      flex: 1,
                      padding: '6px 2px',
                      minHeight: 32,
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: active ? 600 : 400,
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--color-text-tertiary)',
                      border: active ? 'none' : '0.5px solid var(--color-border-tertiary)',
                      cursor: 'pointer',
                      transition: 'all .1s',
                      lineHeight: 1.6,
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
                        e.currentTarget.style.color = 'var(--color-text-secondary)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.borderColor = 'var(--color-border-tertiary)'
                        e.currentTarget.style.color = 'var(--color-text-tertiary)'
                      }
                    }}
                  >
                    {positionLabel(v)}
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ height: '0.5px', background: 'var(--color-border-tertiary)', margin: '10px 14px', flexShrink: 0 }} />

          <div
            style={{
              padding: '0 14px 14px',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.65,
              fontFamily: 'var(--font-body)',
            }}
          >
            {description || (
              <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                No description available for this chord in this context.
              </span>
            )}
          </div>

          </div> {/* end scrollable body */}
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
