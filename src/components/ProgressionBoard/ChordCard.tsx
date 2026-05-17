import { useEffect, useRef, useState } from "react"
import { SVGuitarChord } from "svguitar"
import { parseChord } from "../../theory/keyDetection"
import type { ProgressionSlot } from "../../store/useAppStore"
import { useAppStore } from "../../store/useAppStore"
import { useProgressionAudio } from "../../audio/useProgressionAudio"
import { getChordVoicings } from "../../theory/chordsDb"

const FUNCTION_COLOR: Record<string, string> = {
  tonic: "var(--tonic)",
  subdominant: "var(--sub)",
  dominant: "var(--dom)",
  relative: "var(--rel)",
}

interface Props {
  slot: ProgressionSlot
}

export function ChordCard({ slot }: Props) {
  const { removeChordFromProgression, setSlotVoicingIndex, setSlotChordName, theme } = useAppStore()
  const removeChord = useAppStore(s => s.removeChordFromProgression)
  const { playChord } = useProgressionAudio()
  const diagramRef = useRef<HTMLDivElement>(null)
  const [nameInput, setNameInput] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)

  const fnColor = slot.chordFunction ? FUNCTION_COLOR[slot.chordFunction] : "var(--text-muted)"

  useEffect(() => {
    if (!diagramRef.current || !slot.chordName) return
    const voicings = getChordVoicings(slot.chordName)
    if (!voicings.length) return
    const v = voicings[slot.voicingIndex % voicings.length]
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
          position: v.baseFret,
        })
        .chord({
          // Fix: chords-db frets[0]=low E; SVGuitarChord string 1=high e, string 6=low E
          fingers: v.frets.map((f, i) => [6 - i, f === -1 ? "x" : f] as [number, number | "x"]),
          barres: v.barres.map(b => ({ fret: b, fromString: 1, toString: 6 })),
        })
        .draw()
    } catch {}
  }, [slot.chordName, slot.voicingIndex, theme])

  const handleNameSubmit = () => {
    const name = nameInput.trim()
    if (!name) return
    const parsed = parseChord(name)
    if (!parsed) {
      setInputError("Can't parse — try C, Am, F#m, Bb7, G/B")
      return
    }
    if (parsed.unrecognized) {
      // Show the specific hint from the parser (e.g. "did you mean C#m?")
      setInputError(parsed.hint)
      return
    }
    setInputError(null)
    setSlotChordName(slot.id, name)
    setNameInput("")
  }

  // ── Empty slot: show chord name input ──
  if (!slot.chordName) {
    return (
      <div style={{
        width: 140,
        minHeight: 200,
        background: "var(--card-bg)",
        border: `1px solid ${inputError !== null ? "var(--dom)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        padding: 10,
        gap: 6,
        boxShadow: "var(--card-shadow)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>
          Chord name
        </div>
        <input
          autoFocus
          value={nameInput}
          onChange={e => { setNameInput(e.target.value); setInputError(null) }}
          onKeyDown={e => e.key === "Enter" && handleNameSubmit()}
          placeholder="e.g. C, F#m, Bb, G/B"
          style={{
            background: "var(--input-bg)",
            border: `1px solid ${inputError !== null ? "var(--dom)" : "var(--accent-border)"}`,
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            fontFamily: "var(--font-chord)",
            fontSize: 15,
            padding: "6px 8px",
            outline: "none",
            width: "100%",
          }}
        />
        {inputError !== null && (
          <div style={{ fontSize: 9, color: "var(--dom)", fontFamily: "var(--font-chord)" }}>
            {inputError}
          </div>
        )}
        <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.4 }}>
          Use <span style={{ color: "var(--accent)", fontFamily: "var(--font-chord)" }}>#</span> for sharp,{" "}
          <span style={{ color: "var(--accent)", fontFamily: "var(--font-chord)" }}>b</span> for flat
        </div>
        <button
          onClick={handleNameSubmit}
          style={{
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "6px",
            fontFamily: "var(--font-chord)",
            fontSize: 12,
            cursor: "pointer",
            marginTop: 2,
          }}
        >
          Add
        </button>
        <button
          onClick={() => removeChord(slot.id)}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11 }}
        >
          Cancel
        </button>
      </div>
    )
  }

  // ── Filled slot ──
  return (
    <div className="chord-card-enter" style={{
      width: 140,
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "var(--card-shadow)",
      flexShrink: 0,
    }}>
      {/* Function color stripe */}
      <div style={{ height: 3, background: fnColor }} />

      {/* Roman numeral */}
      <div style={{
        textAlign: "center",
        fontSize: 9,
        fontFamily: "var(--font-chord)",
        color: fnColor,
        letterSpacing: 1,
        padding: "4px 0 0",
        textTransform: "uppercase",
      }}>
        {slot.romanNumeral || "—"}
      </div>

      {/* Chord name */}
      <div style={{
        textAlign: "center",
        fontSize: 24,
        fontFamily: "var(--font-chord)",
        color: "var(--text)",
        lineHeight: 1.1,
        padding: "2px 8px",
      }}>
        {slot.chordName}
      </div>

      {/* SVGuitar diagram */}
      <div
        ref={diagramRef}
        style={{ padding: "0 8px", minHeight: 80 }}
      />

      {/* Voicing arrows */}
      {(() => {
        const voicings = getChordVoicings(slot.chordName)
        return voicings.length > 1 ? (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px", fontSize: 11 }}>
            <button onClick={() => setSlotVoicingIndex(slot.id, Math.max(0, slot.voicingIndex - 1))}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>←</button>
            <span style={{ color: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-chord)" }}>
              {(slot.voicingIndex % voicings.length) + 1}/{voicings.length}
            </span>
            <button onClick={() => setSlotVoicingIndex(slot.id, slot.voicingIndex + 1)}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>→</button>
          </div>
        ) : null
      })()}

      {/* Function label */}
      <div style={{
        textAlign: "center",
        fontSize: 8,
        color: "var(--text-muted)",
        padding: "0 4px 4px",
        textTransform: "capitalize",
      }}>
        {slot.chordFunction ?? ""}
      </div>

      {/* Actions */}
      <div style={{
        display: "flex",
        borderTop: "1px solid var(--border)",
        gap: 0,
      }}>
        <button
          onClick={() => slot.chordName && playChord(slot.chordName)}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "transparent",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            fontSize: 13,
          }}
          title="Play"
        >▶</button>
        <div style={{ width: 1, background: "var(--border)" }} />
        <button
          onClick={() => removeChordFromProgression(slot.id)}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 13,
          }}
          title="Remove"
        >×</button>
      </div>
    </div>
  )
}
