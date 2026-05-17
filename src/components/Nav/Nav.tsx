import { useAppStore } from '../../store/useAppStore'

export default function Nav() {
  const fretboardPanelOpen = useAppStore(s => s.fretboardPanelOpen)
  const setFretboardOpen   = useAppStore(s => s.setFretboardOpen)

  return (
    <nav
      style={{
        height: 38,
        background: 'var(--nav-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 500,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        <span style={{ color: 'var(--panel-bg)' }}>Chord</span>
        <span style={{ color: '#5DCAA5' }}>Path</span>
      </span>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Fretboard button */}
      <NavButton
        label="Fretboard"
        active={fretboardPanelOpen}
        onClick={() => setFretboardOpen(!fretboardPanelOpen)}
      />

      {/* Library button — placeholder, wired later */}
      <NavButton label="Library" onClick={() => {}} />
    </nav>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface NavButtonProps {
  label: string
  active?: boolean
  onClick: () => void
}

function NavButton({ label, active = false, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        color:      active ? '#5DCAA5'                  : 'rgba(255,255,255,.45)',
        background: active ? 'rgba(13,148,136,.3)'      : 'rgba(255,255,255,.07)',
        border:     `0.5px solid ${active ? 'rgba(13,148,136,.5)' : 'rgba(255,255,255,.15)'}`,
        borderRadius: 'var(--radius)',
        padding:    '3px 10px',
        cursor:     'pointer',
        transition: 'all .12s',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => {
        if (!active) {
          const t = e.currentTarget
          t.style.background = 'rgba(255,255,255,.16)'
          t.style.color       = 'rgba(255,255,255,.85)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const t = e.currentTarget
          t.style.background = 'rgba(255,255,255,.07)'
          t.style.color       = 'rgba(255,255,255,.45)'
        }
      }}
    >
      {label}
    </button>
  )
}
