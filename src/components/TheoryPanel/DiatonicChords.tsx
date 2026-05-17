import { useAppStore } from "../../store/useAppStore"

const FN_COLOR_KEY: Record<string, string> = {
  tonic: "var(--tonic)",
  sub:   "var(--sub)",
  dom:   "var(--dom)",
  rel:   "var(--rel)",
}

const FN_LABEL: Record<string, string> = {
  tonic: "Tonic",
  sub:   "Subdominant",
  dom:   "Dominant",
  rel:   "Relative",
}

export function DiatonicChords() {
  const { diatonicChords, keyToUse, inferredMode, addChordToProgression, progression } = useAppStore()
  const canAdd = progression.length < 5

  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
        Diatonic Chords — {keyToUse} {inferredMode}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {diatonicChords.map(d => (
          <div
            key={d.chordName}
            onClick={() => canAdd && addChordToProgression(d.chordName)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 8px",
              borderRadius: "var(--radius-sm)",
              background: d.inProgression ? "var(--accent-faint)" : "transparent",
              border: `1px solid ${d.inProgression ? "var(--accent-border)" : "transparent"}`,
              cursor: canAdd ? "pointer" : "default",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => !d.inProgression && (e.currentTarget.style.background = "var(--card-bg)")}
            onMouseLeave={e => !d.inProgression && (e.currentTarget.style.background = "transparent")}
          >
            <span style={{
              fontFamily: "var(--font-chord)",
              fontSize: 10,
              color: FN_COLOR_KEY[d.fnKey] ?? "var(--text-muted)",
              minWidth: 28,
            }}>
              {d.romanNumeral}
            </span>
            <span style={{
              fontFamily: "var(--font-chord)",
              fontSize: 13,
              color: "var(--text)",
              minWidth: 36,
            }}>
              {d.chordName}
            </span>
            <span style={{ flex: 1, fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>
              {FN_LABEL[d.fnKey] ?? d.chordFunction}
            </span>
            {d.inProgression && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
