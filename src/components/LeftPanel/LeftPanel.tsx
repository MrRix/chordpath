import { useEffect } from "react"
import { Chord } from "tonal"
import { useAppStore } from "../../store/useAppStore"
import { positionsToNotes } from "../../theory/fretboard"
import { useProgressionAudio } from "../../audio/useProgressionAudio"
import { Fretboard } from "../Fretboard/Fretboard"

const QUICK_ADD = ["G", "C", "D", "Em", "F", "Dm", "E", "A", "B"]

export function LeftPanel() {
  const {
    globalFretPositions,
    globalDetectedChord,
    progression,
    tapGlobalFret,
    clearGlobalFretboard,
    setGlobalDetectedChord,
    addChordToProgression,
  } = useAppStore()

  const { playChord } = useProgressionAudio()

  // Convert FretPosition[] → strings array for Fretboard
  const strings = Array.from({ length: 6 }, (_, i) => {
    const pos = globalFretPositions.find(p => p.string === i)
    return pos ? pos.fret : -1
  })

  // Detect chord whenever positions change
  useEffect(() => {
    const notes = positionsToNotes(globalFretPositions)
    if (!notes.length) {
      setGlobalDetectedChord(null)
      return
    }
    const detected = Chord.detect(notes)
    setGlobalDetectedChord(detected[0] ?? null)
  }, [globalFretPositions, setGlobalDetectedChord])

  const handleFretboardChange = (newStrings: number[]) => {
    newStrings.forEach((fret, i) => {
      if (fret !== strings[i]) {
        // tapGlobalFret now handles fret=-1 (mute/remove), fret=0 (open), fret>0 (pressed)
        tapGlobalFret(i, fret)
      }
    })
  }

  const canAdd = !!globalDetectedChord && progression.length < 5

  return (
    <aside style={{
      width: 150,
      background: "var(--panel-bg)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "12px 8px",
      gap: 10,
      overflowY: "auto",
    }}>
      <span style={{
        fontFamily: "var(--font-heading)",
        fontSize: 13,
        color: "var(--text-muted)",
        letterSpacing: 2,
        textTransform: "uppercase",
      }}>Detect</span>

      {/* Interactive fretboard */}
      <div style={{
        borderRadius: "var(--radius)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        display: "flex",
        justifyContent: "center",
        padding: "8px 4px",
      }}>
        <Fretboard
          strings={strings}
          onChange={handleFretboardChange}
          fretCount={5}
        />
      </div>

      <button
        onClick={clearGlobalFretboard}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 10,
          padding: "3px 0",
          fontFamily: "var(--font-chord)",
        }}
      >
        Clear board
      </button>

      {/* Detected chord display */}
      {globalDetectedChord ? (
        <div style={{
          background: "var(--accent-faint)",
          border: "1px solid var(--accent-border)",
          borderRadius: "var(--radius)",
          padding: "8px 10px",
        }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>
            Detected
          </div>
          <div style={{
            fontFamily: "var(--font-chord)",
            fontSize: 21,
            color: "var(--accent)",
            lineHeight: 1.2,
            cursor: "pointer",
          }}
            onClick={() => globalDetectedChord && playChord(globalDetectedChord)}
            title="Click to play"
          >
            {globalDetectedChord} ▶
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
            {Chord.get(globalDetectedChord).notes.join(" · ")}
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontFamily: "var(--font-chord)",
          textAlign: "center",
          padding: "6px 0",
        }}>
          Tap frets above
        </div>
      )}

      {/* Add button */}
      <button
        disabled={!canAdd}
        onClick={() => globalDetectedChord && addChordToProgression(globalDetectedChord)}
        style={{
          background: canAdd ? "var(--btn-primary-bg)" : "var(--border)",
          color: canAdd ? "var(--btn-primary-text)" : "var(--text-muted)",
          border: "none",
          borderRadius: "var(--radius)",
          padding: "8px 4px",
          fontFamily: "var(--font-chord)",
          fontSize: 11,
          cursor: canAdd ? "pointer" : "default",
          width: "100%",
          transition: "background 0.15s",
        }}
      >
        {globalDetectedChord ? `+ Add ${globalDetectedChord}` : "+ Add to Progression"}
      </button>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* Quick Add */}
      <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>
        Quick Add
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {QUICK_ADD.map(ch => (
          <button
            key={ch}
            onClick={() => progression.length < 5 && addChordToProgression(ch)}
            disabled={progression.length >= 5}
            style={{
              background: "var(--pill-bg)",
              border: "1px solid var(--pill-border)",
              borderRadius: 20,
              padding: "3px 8px",
              fontFamily: "var(--font-chord)",
              fontSize: 11,
              color: "var(--text)",
              cursor: progression.length < 3 ? "pointer" : "default",
              opacity: progression.length >= 5 ? 0.4 : 1,
            }}
          >
            {ch}
          </button>
        ))}
      </div>
    </aside>
  )
}
