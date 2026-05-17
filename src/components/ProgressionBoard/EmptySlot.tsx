import { useAppStore } from "../../store/useAppStore"

export function EmptySlot() {
  const createEmptySlot = useAppStore(s => s.createEmptySlot)

  return (
    <div
      onClick={() => createEmptySlot()}
      style={{
        width: 140,
        minHeight: 200,
        border: "2px dashed var(--border)",
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "pointer",
        opacity: 0.5,
        transition: "opacity 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
    >
      <span style={{ fontSize: 28, color: "var(--text-muted)" }}>+</span>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-chord)", letterSpacing: 1 }}>ADD</span>
    </div>
  )
}
