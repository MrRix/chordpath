import { useAppStore } from "../../store/useAppStore"
import { VoicingPanel } from "./VoicingPanel"

const FN_COLOR_KEY = {
  tonic: "var(--tonic)",
  sub:   "var(--sub)",
  dom:   "var(--dom)",
  rel:   "var(--rel)",
}

export function SuggestionList() {
  const { suggestions, expandedSuggestion, expandSuggestion, addChordToProgression, progression } = useAppStore()

  if (!suggestions.length) return (
    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-chord)" }}>
      Add chords to see suggestions
    </div>
  )

  const canAdd = progression.length < 5

  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
        Suggested Next Chords
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {suggestions.map(s => {
          const fnColor = FN_COLOR_KEY[s.fnKey] ?? "var(--text)"
          const isExpanded = expandedSuggestion === s.chordName

          if (isExpanded) {
            return (
              <VoicingPanel
                key={s.chordName}
                suggestion={s}
                onClose={() => expandSuggestion(null)}
              />
            )
          }

          return (
            <div
              key={s.chordName}
              onClick={() => expandSuggestion(s.chordName)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-border)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span style={{
                fontFamily: "var(--font-chord)",
                fontSize: 14,
                color: fnColor,
                minWidth: 32,
              }}>
                {s.chordName}
              </span>
              <span style={{ fontFamily: "var(--font-chord)", fontSize: 10, color: "var(--text-muted)", minWidth: 24 }}>
                {s.romanNumeral}
              </span>
              <span style={{ flex: 1, fontSize: 10, color: "var(--text-muted)" }}>
                {s.reason}
              </span>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: i < s.strength ? fnColor : "transparent",
                    border: `1px solid ${fnColor}`,
                    display: "inline-block",
                  }} />
                ))}
              </div>
              <button
                onClick={e => { e.stopPropagation(); if (canAdd) addChordToProgression(s.chordName) }}
                disabled={!canAdd}
                style={{
                  background: canAdd ? "var(--accent-faint)" : "transparent",
                  border: `1px solid ${canAdd ? "var(--accent-border)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  color: canAdd ? "var(--accent)" : "var(--text-muted)",
                  cursor: canAdd ? "pointer" : "default",
                  fontFamily: "var(--font-chord)",
                  fontSize: 12,
                  padding: "2px 7px",
                }}
              >
                +
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
