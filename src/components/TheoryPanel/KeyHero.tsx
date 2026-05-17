import { useAppStore } from "../../store/useAppStore"
import { MODES, NOTE_SI } from "../../theory/keyDetection"

/** Relative minor root for a major key root (semitone offset −3) */
function relativeMinorName(rootName: string): string {
  const ri = NOTE_SI[rootName] ?? 0
  const minorRi = ((ri - 3) + 12) % 12
  // prefer flat names for keys that use them
  const FLAT_SI = new Set([1, 3, 5, 8, 10])
  const SHARPS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const FLATS  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
  return (FLAT_SI.has(ri) ? FLATS : SHARPS)[minorRi]
}

export function KeyHero() {
  const {
    keyToUse, inferredMode, confidence, autoDetectKey, borrowedChords, tiedKeys,
  } = useAppStore()

  const modeObj  = MODES.find(m => m.name === inferredMode) ?? MODES[0]
  const modeSub  = modeObj.sub ? ` (${modeObj.sub})` : ""

  // Relative / parallel info — only meaningful for Major & Minor
  const isMajor  = inferredMode === "Major"
  const isMinor  = inferredMode === "Minor"
  const relLabel = isMajor
    ? `Rel. Minor: ${relativeMinorName(keyToUse ?? "C")}m`
    : isMinor
      ? `Rel. Major: ${keyToUse}`
      : null

  const parallelLabel = isMajor
    ? `Parallel: ${keyToUse} minor`
    : isMinor
      ? `Parallel: ${keyToUse} major`
      : null

  return (
    <div style={{
      background: "var(--accent-faint)",
      border: "1px solid var(--accent-border)",
      borderRadius: "var(--radius)",
      padding: "12px 14px",
    }}>
      <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
        Detected Key
      </div>

      {/* Key name + confidence */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-chord)", fontSize: 32, color: "var(--accent)", lineHeight: 1 }}>
          {keyToUse ?? "—"}{" "}
          <span style={{ fontSize: 16, opacity: 0.8 }}>{inferredMode}</span>
        </span>
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {autoDetectKey
            ? Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i < confidence ? "var(--accent)" : "transparent",
                  border: "1px solid var(--accent)",
                  display: "inline-block",
                }} />
              ))
            : <span style={{ fontSize: 14 }}>🔒</span>
          }
        </div>
      </div>

      {/* Mode character */}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontStyle: "italic" }}>
        {modeObj.ch}
      </div>

      <div style={{ height: 1, background: "var(--accent-border)", margin: "8px 0" }} />

      {/* Rel/parallel + mode label */}
      <div style={{ display: "flex", gap: 8, fontSize: 9, color: "var(--text-muted)", flexWrap: "wrap" }}>
        {relLabel && <span>{relLabel}</span>}
        {relLabel && parallelLabel && <span style={{ color: "var(--border)" }}>|</span>}
        {parallelLabel && <span>{parallelLabel}</span>}
        {(relLabel || parallelLabel) && <span style={{ color: "var(--border)" }}>|</span>}
        <span>Mode: <strong style={{ color: "var(--text)" }}>{inferredMode}{modeSub}</strong></span>
      </div>

      {/* Borrowed / non-diatonic chords */}
      {borrowedChords.length > 0 && (
        <div style={{
          marginTop: 8,
          padding: "5px 8px",
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.22)",
          borderRadius: "var(--radius-sm)",
          fontSize: 10,
          color: "var(--text-muted)",
        }}>
          <span style={{ color: "var(--dom)", fontWeight: 600 }}>Borrowed: </span>
          {borrowedChords.join(", ")}
          <span style={{ color: "var(--text-muted)", marginLeft: 4, fontStyle: "italic" }}>
            (non-diatonic)
          </span>
        </div>
      )}

      {/* Tied keys notice */}
      {tiedKeys.length > 0 && autoDetectKey && (
        <div style={{ marginTop: 6, fontSize: 9, color: "var(--text-muted)" }}>
          Also fits: {tiedKeys.slice(0, 3).join(", ")}
          {tiedKeys.length > 3 ? ` +${tiedKeys.length - 3} more` : ""}
        </div>
      )}
    </div>
  )
}
