import { useEffect, useRef, useState } from "react"
import { parseChord } from "../../theory/keyDetection"
import type { ProgressionSlot } from "../../store/useAppStore"
import { useAppStore } from "../../store/useAppStore"
import { useProgressionAudio } from "../../audio/useProgressionAudio"
import { getChordVoicings } from "../../theory/chordsDb"
import { drawDiagram } from "../../theory/diagramRenderer"

const FUNCTION_COLOR: Record<string, string> = {
  tonic:       "var(--tonic)",
  subdominant: "var(--sub)",
  dominant:    "var(--dom)",
  relative:    "var(--rel)",
}

interface Props {
  slot: ProgressionSlot
}

export function ChordCard({ slot }: Props) {
  const { removeChordFromProgression, setSlotVoicingIndex, setSlotChordName } = useAppStore()
  const removeChord = useAppStore(s => s.removeChordFromProgression)
  const { playChord }   = useProgressionAudio()
  const diagramRef      = useRef<HTMLDivElement>(null)
  const [nameInput,  setNameInput]  = useState("")
  const [inputError, setInputError] = useState<string | null>(null)

  const fnColor = slot.chordFunction ? FUNCTION_COLOR[slot.chordFunction] : "var(--color-text-tertiary)"

  // Compute voicings once — used for both diagram and voicing arrows
  const voicings = slot.chordName ? getChordVoicings(slot.chordName) : []
  const voicing  = voicings[slot.voicingIndex % Math.max(voicings.length, 1)]

  // Render diagram via shared SVG renderer — reads CSS vars from body, theme-correct
  useEffect(() => {
    if (!diagramRef.current || !slot.chordName) return
    if (!voicing) { diagramRef.current.innerHTML = ''; return }
    diagramRef.current.innerHTML = drawDiagram(voicing, { width: 124, height: 144 })
  }, [slot.chordName, slot.voicingIndex, voicing])

  const handleNameSubmit = () => {
    const name = nameInput.trim()
    if (!name) return
    const parsed = parseChord(name)
    if (!parsed) {
      setInputError("Can't parse — try C, Am, F#m, Bb7, G/B")
      return
    }
    if (parsed.unrecognized) {
      setInputError(parsed.hint)
      return
    }
    setInputError(null)
    setSlotChordName(slot.id, name)
    setNameInput("")
  }

  // ── Empty slot — chord name input ──────────────────────────────────────────
  if (!slot.chordName) {
    return (
      <div style={{
        width: 140,
        minHeight: 200,
        background: "var(--card-bg)",
        border: `1px solid ${inputError !== null ? "var(--dom)" : "var(--color-border-primary)"}`,
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        padding: 10,
        gap: 6,
        boxShadow: "var(--card-shadow)",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", letterSpacing: 1, textTransform: "uppercase" }}>
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
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: 15,
            padding: "6px 8px",
            outline: "none",
            width: "100%",
          }}
        />
        {inputError !== null && (
          <div style={{ fontSize: 9, color: "var(--dom)", fontFamily: "var(--font-mono)" }}>
            {inputError}
          </div>
        )}
        <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", lineHeight: 1.4 }}>
          Use <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>#</span> for sharp,{" "}
          <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>b</span> for flat
        </div>
        <button
          onClick={handleNameSubmit}
          style={{
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            cursor: "pointer",
            marginTop: 2,
          }}
        >
          Add
        </button>
        <button
          onClick={() => removeChord(slot.id)}
          style={{ background: "transparent", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: 11 }}
        >
          Cancel
        </button>
      </div>
    )
  }

  // ── Filled slot ────────────────────────────────────────────────────────────
  return (
    <div className="chord-card-enter" style={{
      width: 140,
      background: "var(--card-bg)",
      border: "1px solid var(--color-border-primary)",
      borderRadius: "var(--radius)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "var(--card-shadow)",
      flexShrink: 0,
    }}>
      {/* Function colour stripe */}
      <div style={{ height: 3, background: fnColor }} />

      {/* Roman numeral */}
      <div style={{
        textAlign: "center",
        fontSize: 9,
        fontFamily: "var(--font-mono)",
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
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-primary)",
        lineHeight: 1.1,
        padding: "2px 8px",
      }}>
        {slot.chordName}
      </div>

      {/* Chord diagram — rendered by shared drawDiagram renderer */}
      <div style={{ padding: "0 8px" }}>
        <div ref={diagramRef} />
      </div>

      {/* Voicing arrows */}
      {voicings.length > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px", fontSize: 11 }}>
          <button
            onClick={() => setSlotVoicingIndex(slot.id, Math.max(0, slot.voicingIndex - 1))}
            style={{ background: "transparent", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer" }}
          >←</button>
          <span style={{ color: "var(--color-text-tertiary)", fontSize: 9, fontFamily: "var(--font-mono)" }}>
            {(slot.voicingIndex % voicings.length) + 1}/{voicings.length}
          </span>
          <button
            onClick={() => setSlotVoicingIndex(slot.id, slot.voicingIndex + 1)}
            style={{ background: "transparent", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer" }}
          >→</button>
        </div>
      )}

      {/* Function label */}
      <div style={{
        textAlign: "center",
        fontSize: 8,
        color: "var(--color-text-tertiary)",
        padding: "0 4px 4px",
        textTransform: "capitalize",
      }}>
        {slot.chordFunction ?? ""}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", borderTop: "1px solid var(--color-border-primary)" }}>
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
        <div style={{ width: 1, background: "var(--color-border-primary)" }} />
        <button
          onClick={() => removeChordFromProgression(slot.id)}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "transparent",
            border: "none",
            color: "var(--color-text-tertiary)",
            cursor: "pointer",
            fontSize: 13,
          }}
          title="Remove"
        >×</button>
      </div>
    </div>
  )
}
