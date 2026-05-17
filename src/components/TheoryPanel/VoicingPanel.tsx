import { useEffect, useRef } from "react"
import { SVGuitarChord } from "svguitar"
import type { ChordSuggestion } from "../../theory/suggestions"
import { noteAtPosition } from "../../theory/fretboard"
import { getChordVoicings } from "../../theory/chordsDb"
import { useAppStore } from "../../store/useAppStore"
import { Fretboard } from "../Fretboard/Fretboard"

const FN_LABELS: Record<string, string> = {
  tonic: "Tonic",
  sub: "Subdominant",
  dom: "Dominant",
  rel: "Relative",
}

interface Props {
  suggestion: ChordSuggestion
  onClose: () => void
}

export function VoicingPanel({ suggestion, onClose }: Props) {
  const { voicingPanelIndex, setVoicingPanelIndex, addChordToProgression, theme, progression } = useAppStore()
  const diagramRef = useRef<HTMLDivElement>(null)
  const voicings = getChordVoicings(suggestion.chordName)
  const vi = voicingPanelIndex % Math.max(voicings.length, 1)
  const voicing = voicings[vi]

  const notePills = voicing
    ? voicing.frets.map((f, i) => f >= 0 ? noteAtPosition(i, f === 0 ? 0 : f + voicing.baseFret - 1) : null).filter(Boolean)
    : []

  useEffect(() => {
    if (!diagramRef.current || !voicing) return
    const cs = getComputedStyle(document.documentElement)
    diagramRef.current.innerHTML = ""
    try {
      new SVGuitarChord(diagramRef.current)
        .configure({
          fingerColor: cs.getPropertyValue("--dot-color").trim() || "#f59e0b",
          fretColor: cs.getPropertyValue("--fret-color").trim() || "#2a2a2a",
          stringColor: cs.getPropertyValue("--string-color").trim() || "#7a6040",
          backgroundColor: "transparent",
          color: cs.getPropertyValue("--text").trim() || "#e5e0d8",
          fontFamily: "'JetBrains Mono', monospace",
          frets: 5,
          position: voicing.baseFret,
        })
        .chord({
          fingers: voicing.frets.map((f, i) => [i + 1, f === -1 ? "x" : f] as [number, number | "x"]),
          barres: voicing.barres.map(b => ({ fret: b, fromString: 1, toString: 6 })),
        })
        .draw()
    } catch {}
  }, [suggestion.chordName, voicingPanelIndex, theme])

  const canAdd = progression.length < 5

  return (
    <div className="voicing-panel-enter" style={{
      border: "1px solid var(--accent-border)",
      borderRadius: "var(--radius)",
      background: "var(--card-bg)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-chord)", fontSize: 20, color: "var(--accent)" }}>
              {suggestion.chordName}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {suggestion.romanNumeral} — {FN_LABELS[suggestion.fnKey] ?? suggestion.fnKey}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            {suggestion.reason}
          </div>
        </div>
        <button onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}>
          ×
        </button>
      </div>

      {/* Voicing nav */}
      {voicings.length > 1 && (
        <div style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          fontFamily: "var(--font-chord)",
        }}>
          <button onClick={() => setVoicingPanelIndex(Math.max(0, voicingPanelIndex - 1))}
            disabled={voicingPanelIndex === 0}
            style={{ background: "transparent", border: "none", color: voicingPanelIndex === 0 ? "var(--text-dim)" : "var(--accent)", cursor: voicingPanelIndex === 0 ? "default" : "pointer", fontSize: 16 }}>
            ←
          </button>
          <span style={{ color: "var(--text-muted)" }}>
            {voicings[vi]?.fingers ? "Open Position" : "Voicing"} — {vi + 1} of {voicings.length}
          </span>
          <button onClick={() => setVoicingPanelIndex(Math.min(voicings.length - 1, voicingPanelIndex + 1))}
            disabled={voicingPanelIndex >= voicings.length - 1}
            style={{ background: "transparent", border: "none", color: voicingPanelIndex >= voicings.length - 1 ? "var(--text-dim)" : "var(--accent)", cursor: voicingPanelIndex >= voicings.length - 1 ? "default" : "pointer", fontSize: 16 }}>
            →
          </button>
        </div>
      )}

      {/* Diagram — wide read-only fretboard */}
      <div style={{ padding: "8px 12px", display: "flex", justifyContent: "center" }}>
        {voicing ? (
          <Fretboard
            strings={voicing.frets}
            readOnly={true}
            fretCount={5}
          />
        ) : (
          <div ref={diagramRef} />
        )}
      </div>

      {/* Note pills */}
      {notePills.length > 0 && (
        <div style={{
          padding: "6px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}>
          <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>Notes</span>
          {notePills.map((n, i) => (
            <span key={i} style={{
              background: "var(--pill-bg)",
              border: "1px solid var(--pill-border)",
              borderRadius: 20,
              padding: "1px 7px",
              fontFamily: "var(--font-chord)",
              fontSize: 10,
              color: "var(--text)",
            }}>{n}</span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "8px 12px" }}>
        <button
          disabled={!canAdd}
          onClick={() => { addChordToProgression(suggestion.chordName); onClose() }}
          style={{
            width: "100%",
            background: canAdd ? "var(--btn-primary-bg)" : "var(--border)",
            color: canAdd ? "var(--btn-primary-text)" : "var(--text-muted)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "9px 0",
            fontFamily: "var(--font-chord)",
            fontSize: 13,
            cursor: canAdd ? "pointer" : "default",
          }}
        >
          + Add {suggestion.chordName} to Progression
        </button>
      </div>
    </div>
  )
}
