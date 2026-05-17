import { useAppStore } from "../../store/useAppStore"

const ROOTS = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"]
const ALL_KEYS = [
  ...ROOTS.map(r => `${r} major`),
  ...ROOTS.map(r => `${r} minor`),
]

export function Header() {
  const { theme, setTheme, keyToUse, inferredMode, manualKey, autoDetectKey, setManualKey, setAutoDetect } = useAppStore()

  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === "auto") {
      setManualKey(null)
      setAutoDetect(true)
    } else {
      const [root] = val.split(" ")
      setManualKey(root)
      setAutoDetect(false)
    }
  }

  const currentKeyDisplay = autoDetectKey
    ? `${keyToUse} ${inferredMode}`
    : `${manualKey} major`

  return (
    <header style={{
      height: 48,
      background: "var(--header-bg)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 12,
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "var(--font-heading)",
        color: "var(--accent)",
        fontSize: 24,
        letterSpacing: 1,
        userSelect: "none",
      }}>
        ChordPath
      </span>

      <div style={{ width: 1, height: 24, background: "var(--border)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase" }}>Key</span>
        <select
          value={autoDetectKey ? "auto" : currentKeyDisplay}
          onChange={handleKeyChange}
          style={{
            background: "var(--input-bg)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "2px 6px",
            fontFamily: "var(--font-chord)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="auto">Auto-detect</option>
          {ALL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {(["major","minor"] as const).map(m => (
          <button
            key={m}
            onClick={() => {
              if (autoDetectKey) return
              setManualKey(manualKey)
            }}
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid var(--border)",
              background: (!autoDetectKey && inferredMode === m) ? "var(--accent)" : "transparent",
              color: (!autoDetectKey && inferredMode === m) ? "var(--btn-primary-text)" : "var(--text-muted)",
              fontFamily: "var(--font-chord)",
              fontSize: 11,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => setTheme(theme === "studio" ? "canvas" : "studio")}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-muted)",
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 14,
        }}
        title="Toggle theme"
      >
        {theme === "studio" ? "☀" : "☾"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Auto-detect</span>
        <button
          onClick={() => setAutoDetect(!autoDetectKey)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            border: "none",
            background: autoDetectKey ? "var(--accent)" : "var(--border)",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <span style={{
            position: "absolute",
            top: 2,
            left: autoDetectKey ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }} />
        </button>
      </div>
    </header>
  )
}
