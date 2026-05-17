import { useAppStore } from "../../store/useAppStore"

export function PatternMatch() {
  const { patternMatch } = useAppStore()

  if (!patternMatch) return null

  return (
    <div style={{
      background: "var(--match-bg)",
      border: "1px solid var(--match-border)",
      borderRadius: "var(--radius)",
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
        Pattern Match
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-chord)", fontSize: 12, color: "var(--text)" }}>
          {patternMatch.name}
        </span>
        <span style={{
          background: "var(--pill-bg)",
          border: "1px solid var(--pill-border)",
          borderRadius: 20,
          padding: "1px 8px",
          fontSize: 9,
          color: "var(--text-muted)",
          fontFamily: "var(--font-chord)",
        }}>
          {patternMatch.genre}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {patternMatch.fullPattern.map((roman, i) => {
          const inProgress = i < patternMatch.currentLength
          const isNext = i === patternMatch.currentLength
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{
                background: inProgress ? "var(--accent-faint)" : isNext ? "var(--pill-bg)" : "transparent",
                border: `1px solid ${inProgress ? "var(--accent-border)" : "var(--pill-border)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "3px 8px",
                fontFamily: "var(--font-chord)",
                fontSize: 12,
                color: inProgress ? "var(--accent)" : "var(--text-dim)",
                opacity: isNext ? 0.6 : 1,
              }}>
                {roman}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
