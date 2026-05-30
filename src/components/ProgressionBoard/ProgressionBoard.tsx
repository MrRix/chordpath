import { useState } from "react"
import { useAppStore } from "../../store/useAppStore"
import { useProgressionAudio } from "../../audio/useProgressionAudio"
import { ChordCard } from "./ChordCard"
import { EmptySlot } from "./EmptySlot"
import { SongBuilder } from "../SongBuilder/SongBuilder"

export function ProgressionBoard() {
  const {
    progression,
    patternMatch,
    keyToUse,
    inferredMode,
    isLooping,
    setLooping,
    clearProgression,
    saveProgression,
  } = useAppStore()

  const { playProgression, stop } = useProgressionAudio()
  const [isPlaying, setIsPlaying] = useState(false)
  const [savingLabel, setSavingLabel] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState("")

  const chordNames = progression.map(s => s.chordName).filter(Boolean) as string[]

  const handlePlay = async () => {
    if (isPlaying) {
      stop()
      setIsPlaying(false)
      return
    }
    if (!chordNames.length) return
    setIsPlaying(true)
    await playProgression(chordNames)
    setTimeout(() => setIsPlaying(false), chordNames.length * 1500 + 500)
  }

  const handleLoop = async () => {
    if (isLooping) {
      setLooping(false)
      stop()
      return
    }
    if (!chordNames.length) return
    setLooping(true)
    const loop = async () => {
      if (!useAppStore.getState().isLooping) return
      await playProgression(chordNames)
      setTimeout(() => loop(), chordNames.length * 1500)
    }
    loop()
  }

  const handleSave = () => {
    if (savingLabel !== null) {
      if (labelInput.trim()) {
        saveProgression(labelInput.trim())
      }
      setSavingLabel(null)
      setLabelInput("")
    } else {
      setSavingLabel("")
      setLabelInput(`Section ${Date.now() % 1000}`)
    }
  }

  return (
    <main style={{
      flex: 1,
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 20px",
      gap: 16,
      overflowY: "auto",
    }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: "var(--font-heading)",
          fontSize: 16,
          color: "var(--color-text-tertiary)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          Your Progression
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {keyToUse && (
            <span style={{
              background: "var(--accent-faint)",
              border: "1px solid var(--accent-border)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--accent)",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
              {keyToUse} {inferredMode}
            </span>
          )}
          {patternMatch && (
            <span style={{
              background: "var(--pill-bg)",
              border: "1px solid var(--pill-border)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-text-tertiary)",
            }}>
              {patternMatch.name}
            </span>
          )}
        </div>
      </div>

      {/* Chord cards row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {progression.map((slot, i) => (
          <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && (
              <span style={{ color: "var(--accent)", opacity: 0.7, fontSize: 18 }}>→</span>
            )}
            <ChordCard slot={slot} />
          </div>
        ))}

        {progression.length < 5 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {progression.length > 0 && (
              <span style={{ color: "var(--accent)", opacity: 0.2, fontSize: 18 }}>→</span>
            )}
            <EmptySlot />
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={handlePlay}
          disabled={!chordNames.length}
          style={{
            background: isPlaying ? "var(--dom)" : "var(--btn-primary-bg)",
            color: isPlaying ? "#fff" : "var(--btn-primary-text)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "8px 18px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            cursor: chordNames.length ? "pointer" : "default",
            opacity: chordNames.length ? 1 : 0.4,
          }}
        >
          {isPlaying ? "■ Stop" : "▶ Play"}
        </button>

        <button
          onClick={handleLoop}
          disabled={!chordNames.length}
          style={{
            background: isLooping ? "var(--sub)" : "var(--card-bg)",
            color: isLooping ? "#fff" : "var(--color-text-tertiary)",
            border: "1px solid var(--color-border-primary)",
            borderRadius: "var(--radius)",
            padding: "8px 18px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            cursor: chordNames.length ? "pointer" : "default",
            opacity: chordNames.length ? 1 : 0.4,
          }}
        >
          ↻ Loop
        </button>

        {savingLabel !== null ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              autoFocus
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="Label (Verse, Chorus...)"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--accent-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                padding: "6px 10px",
                outline: "none",
              }}
            />
            <button onClick={handleSave}
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12 }}>
              Save
            </button>
            <button onClick={() => { setSavingLabel(null); setLabelInput("") }}
              style={{ background: "transparent", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: 12 }}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!chordNames.length}
            style={{
              background: "var(--card-bg)",
              color: "var(--color-text-tertiary)",
              border: "1px solid var(--color-border-primary)",
              borderRadius: "var(--radius)",
              padding: "8px 18px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              cursor: chordNames.length ? "pointer" : "default",
              opacity: chordNames.length ? 1 : 0.4,
            }}
          >
            ↓ Save
          </button>
        )}

        <button
          onClick={clearProgression}
          style={{
            marginLeft: "auto",
            background: "transparent",
            color: "var(--color-text-tertiary)",
            border: "1px solid var(--color-border-primary)",
            borderRadius: "var(--radius)",
            padding: "8px 18px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <SongBuilder />
    </main>
  )
}
