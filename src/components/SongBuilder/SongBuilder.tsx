import { useState } from "react"
import { useAppStore } from "../../store/useAppStore"

export function SongBuilder() {
  const { savedProgressions, loadProgression, deleteProgression } = useAppStore()
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState("")

  if (!savedProgressions.length) return null

  const handleExport = () => {
    const text = savedProgressions.map(p => {
      const chords = p.slots.map(s => s.chordName).filter(Boolean).join(" - ")
      return `${p.label}: ${chords}`
    }).join("\n")
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div style={{
      borderTop: "1px solid var(--border)",
      paddingTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "var(--font-heading)" }}>
          Song Structure
        </span>
        <button onClick={handleExport}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, fontFamily: "var(--font-chord)" }}>
          Copy ↗
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {savedProgressions.map(p => (
          <div
            key={p.id}
            onClick={() => loadProgression(p.id)}
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
              cursor: "pointer",
              flexShrink: 0,
              minWidth: 100,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            {renamingId === p.id ? (
              <input
                autoFocus
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") setRenamingId(null)
                  if (e.key === "Escape") setRenamingId(null)
                }}
                onBlur={() => setRenamingId(null)}
                onClick={e => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--accent)",
                  color: "var(--text)",
                  fontFamily: "var(--font-chord)",
                  fontSize: 11,
                  outline: "none",
                  width: "100%",
                }}
              />
            ) : (
              <span
                onClick={e => { e.stopPropagation(); setRenamingId(p.id); setRenameVal(p.label) }}
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-muted)",
                  letterSpacing: 0.5,
                  cursor: "text",
                }}
              >
                {p.label}
              </span>
            )}
            <span style={{ fontFamily: "var(--font-chord)", fontSize: 12, color: "var(--text)" }}>
              {p.slots.map(s => s.chordName).filter(Boolean).join(" · ")}
            </span>
            <button
              onClick={e => { e.stopPropagation(); deleteProgression(p.id) }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 10, textAlign: "right", padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
