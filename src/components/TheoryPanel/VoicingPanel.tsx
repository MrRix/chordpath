import { useEffect, useRef, useState } from "react"
import type { ChordSuggestion } from "../../theory/suggestions"
import { noteAtPosition } from "../../theory/fretboard"
import { getChordVoicings } from "../../theory/chordsDb"
import type { ChordPosition } from "../../theory/chordsDb"
import { useAppStore } from "../../store/useAppStore"
import { drawDiagram } from "../../theory/diagramRenderer"

const FN_LABELS: Record<string, string> = {
  tonic: "Tonic",
  sub: "Subdominant",
  dom: "Dominant",
  rel: "Relative",
}

function positionLabel(v: ChordPosition): string {
  if (v.label) return v.label
  const hasOpen = v.frets.some(f => f === 0)
  if (v.baseFret <= 1 && hasOpen) return 'Open'
  return `${v.baseFret}fr`
}

interface Props {
  suggestion: ChordSuggestion
  onClose: () => void
}

export function VoicingPanel({ suggestion, onClose }: Props) {
  const { addChordToProgression, progression } = useAppStore()
  const diagramRef = useRef<HTMLDivElement>(null)
  const [vi, setVi] = useState(0)

  const voicings = getChordVoicings(suggestion.chordName)
  const voicing  = voicings[vi] ?? voicings[0] ?? null

  // Reset voicing index whenever the chord changes
  useEffect(() => { setVi(0) }, [suggestion.chordName])

  // Render diagram via shared SVG renderer (reads CSS vars from body, always correct)
  useEffect(() => {
    if (!diagramRef.current) return
    if (!voicing) { diagramRef.current.innerHTML = ''; return }
    diagramRef.current.innerHTML = drawDiagram(voicing, { width: 160, height: 178 })
  }, [voicing])

  // Note pills from active voicing's fret positions
  const notePills: string[] = voicing
    ? voicing.frets
        .map((f, i) => f >= 0 ? noteAtPosition(i, f === 0 ? 0 : f + voicing.baseFret - 1) : null)
        .filter((n): n is string => n !== null)
    : []

  const canAdd = progression.filter(s => s.chordName).length < 5

  return (
    <div className="voicing-panel-enter" style={{
      border: "1px solid var(--accent-border)",
      borderRadius: "var(--radius)",
      background: "var(--card-bg)",
      overflow: "hidden",
    }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "0.5px solid var(--color-border-primary)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--accent)" }}>
              {suggestion.chordName}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {suggestion.romanNumeral} · {FN_LABELS[suggestion.fnKey] ?? suggestion.fnKey}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, lineHeight: 1.4 }}>
            {suggestion.reason}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 22, height: 22,
            borderRadius: "50%",
            fontSize: 14,
            color: "var(--color-text-tertiary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0,
            transition: "all .12s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--color-bg-secondary)"
            e.currentTarget.style.color = "var(--color-text-primary)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "none"
            e.currentTarget.style.color = "var(--color-text-tertiary)"
          }}
        >
          ×
        </button>
      </div>

      {/* ── Voicing pill selector ──────────────────────────────────────── */}
      {voicings.length > 1 && (
        <div style={{ position: "relative" }}>
          {/* Fade-right mask */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 0, top: 0, bottom: 0,
              width: 24,
              background: "linear-gradient(to right, transparent, var(--card-bg))",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div style={{
            display: "flex",
            gap: 5,
            padding: "8px 12px 5px",
            overflowX: "auto",
            scrollbarWidth: "none",
          } as React.CSSProperties}>
            {voicings.map((v, i) => {
              const active = i === vi
              return (
                <button
                  key={i}
                  onClick={() => setVi(i)}
                  style={{
                    flexShrink: 0,
                    padding: "0 10px",
                    height: 26,
                    borderRadius: 20,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fontWeight: active ? 600 : 400,
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--color-text-secondary)",
                    border: active ? "none" : "1px solid var(--color-border-secondary)",
                    cursor: "pointer",
                    transition: "all .12s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = "var(--accent)"
                      e.currentTarget.style.color = "var(--accent)"
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = "var(--color-border-secondary)"
                      e.currentTarget.style.color = "var(--color-text-secondary)"
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

      {/* ── Diagram ───────────────────────────────────────────────────── */}
      <div style={{ padding: "6px 12px 4px", display: "flex", justifyContent: "center" }}>
        <div ref={diagramRef} />
      </div>

      {/* ── Dot indicators ────────────────────────────────────────────── */}
      {voicings.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "4px 0 6px" }}>
          {voicings.map((_, i) => (
            <button
              key={i}
              onClick={() => setVi(i)}
              style={{
                width: i === vi ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === vi ? "var(--accent)" : "var(--color-border-secondary)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all .2s",
              }}
              aria-label={`Voicing ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Note pills ────────────────────────────────────────────────── */}
      {notePills.length > 0 && (
        <div style={{
          padding: "5px 12px 7px",
          borderTop: "0.5px solid var(--color-border-primary)",
          display: "flex",
          gap: 5,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <span style={{
            fontSize: 9,
            color: "var(--color-text-tertiary)",
            letterSpacing: 1,
            textTransform: "uppercase",
            fontFamily: "var(--font-body)",
          }}>
            Notes
          </span>
          {notePills.map((n, i) => (
            <span key={i} style={{
              background: "var(--pill-bg)",
              border: "1px solid var(--pill-border)",
              borderRadius: 20,
              padding: "1px 7px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--color-text-primary)",
            }}>{n}</span>
          ))}
        </div>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "6px 12px 10px" }}>
        <button
          disabled={!canAdd}
          onClick={() => { addChordToProgression(suggestion.chordName); onClose() }}
          style={{
            width: "100%",
            background: canAdd ? "var(--accent)" : "var(--color-border-secondary)",
            color: canAdd ? "#fff" : "var(--color-text-tertiary)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "9px 0",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 500,
            cursor: canAdd ? "pointer" : "not-allowed",
            transition: "background .12s",
          }}
          onMouseEnter={e => { if (canAdd) e.currentTarget.style.background = "var(--accent-dark)" }}
          onMouseLeave={e => { if (canAdd) e.currentTarget.style.background = "var(--accent)" }}
        >
          Add {suggestion.chordName} to Progression
        </button>
      </div>
    </div>
  )
}
