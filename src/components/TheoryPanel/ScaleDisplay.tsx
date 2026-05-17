import { useAppStore } from "../../store/useAppStore"
import { parseChord, NOTE_SI } from "../../theory/keyDetection"

const DEGREES = ["1","2","3","4","5","6","7"]

export function ScaleDisplay() {
  const { scaleNotes, keyToUse, inferredMode, progression } = useAppStore()

  // Collect pitch classes from progression chords using our own parser
  const progressionPCs = new Set<number>()
  for (const slot of progression) {
    if (!slot.chordName) continue
    const parsed = parseChord(slot.chordName)
    if (parsed) parsed.pcs.forEach(pc => progressionPCs.add(pc))
  }

  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
        {keyToUse} {inferredMode} Scale
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {scaleNotes.map((note, i) => {
          const notePc = NOTE_SI[note] ?? -1
          const highlighted = notePc >= 0 && progressionPCs.has(notePc)
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: "100%",
                padding: "4px 2px",
                borderRadius: "var(--radius-sm)",
                background: highlighted ? "var(--accent-faint)" : "var(--pill-bg)",
                border: `1px solid ${highlighted ? "var(--accent-border)" : "var(--pill-border)"}`,
                color: highlighted ? "var(--accent)" : "var(--text-muted)",
                textAlign: "center",
                fontFamily: "var(--font-chord)",
                fontSize: 11,
                fontWeight: highlighted ? 600 : 400,
              }}>
                {note}
              </div>
              <div style={{
                fontSize: 8,
                color: "var(--text-muted)",
                fontFamily: "var(--font-chord)",
              }}>
                {DEGREES[i]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
