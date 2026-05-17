/**
 * Interactive SVG fretboard.
 * strings: array of 6 fret values (-1=muted, 0=open, N=fret N pressed)
 * readOnly: disables tap interaction
 * onChange: called with updated strings array when user taps
 * compact: smaller size, no labels (used for inline displays)
 *
 * NOTE: CSS custom properties are resolved in element context (not document root),
 * so all colours use style={{ fill: 'var(--token)' }} rather than getComputedStyle.
 */
interface Props {
  strings?: number[]
  onChange?: (strings: number[]) => void
  fretCount?: number
  readOnly?: boolean
  compact?: boolean
}

const NUM_STRINGS = 6
// Low E (index 0) is thickest/leftmost, high e (index 5) is thinnest/rightmost
const STRING_WIDTHS = [2.2, 1.8, 1.5, 1.2, 1.0, 0.8]
const STRING_NAMES  = ["E", "A", "D", "G", "B", "e"]

export function Fretboard({
  strings = [-1, -1, -1, -1, -1, -1],
  onChange,
  fretCount = 5,
  readOnly = false,
  compact = false,
}: Props) {
  // ── Layout constants ────────────────────────────────────────────────────────
  const LEFT_W  = compact ? 0 : 12   // fret-number column width
  const LABEL_H = compact ? 0 : 12   // string-name row height
  const INDIC_H = compact ? 0 : 13   // open/mute indicator row height
  const NUT_H   = 3
  const PAD_R   = compact ? 6 : 5
  const PAD_B   = compact ? 6 : 10

  const BOARD_W_TOTAL = compact ? 100 : 146
  const boardW = BOARD_W_TOTAL - LEFT_W - PAD_R
  const boardH = compact ? 60 : 85
  const W = BOARD_W_TOTAL
  const H = LABEL_H + INDIC_H + NUT_H + boardH + PAD_B

  const stringSpacing = boardW / (NUM_STRINGS - 1)
  const fretSpacing   = boardH / fretCount

  // ── Derived coordinates ─────────────────────────────────────────────────────
  const sx       = (si: number) => LEFT_W + si * stringSpacing
  const boardTop = LABEL_H + INDIC_H + NUT_H
  const fy       = (fi: number) => boardTop + fi * fretSpacing

  // ── Interaction handlers ────────────────────────────────────────────────────
  const handleTap = (si: number, fret: number) => {
    if (readOnly || !onChange) return
    const next = [...strings]
    // Tap same fret → back to open (0); tap different fret → select it
    next[si] = next[si] === fret ? 0 : fret
    onChange(next)
  }

  const handleIndicator = (si: number) => {
    if (readOnly || !onChange) return
    const next = [...strings]
    // Toggle: muted (−1) ↔ open (0). If fret pressed → set open first.
    next[si] = next[si] === -1 ? 0 : -1
    onChange(next)
  }

  // ── Fret-position inlay dots (standard guitar markers) ──────────────────────
  const INLAY_FRETS = new Set([3, 5, 7, 9])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', userSelect: 'none', width: '100%', height: 'auto' }}
    >
      {/* ── String name labels ─────────────────────────────────────────────── */}
      {!compact && STRING_NAMES.map((name, si) => (
        <text
          key={`lbl-${si}`}
          x={sx(si)}
          y={LABEL_H - 1}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={7.5}
          fontFamily="monospace"
          style={{
            fill: (si === 0 || si === 5) ? 'var(--accent)' : 'var(--color-text-tertiary)',
            fontWeight: (si === 0 || si === 5) ? 600 : 400,
          }}
        >
          {name}
        </text>
      ))}

      {/* ── Open / muted indicators ────────────────────────────────────────── */}
      {!compact && strings.map((fret, si) => {
        const cx = sx(si)
        const cy = LABEL_H + INDIC_H / 2 + 1
        return (
          <g
            key={`ind-${si}`}
            onClick={() => handleIndicator(si)}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
          >
            {!readOnly && (
              <rect
                x={cx - Math.min(stringSpacing / 2, 9)}
                y={LABEL_H}
                width={Math.min(stringSpacing, 18)}
                height={INDIC_H}
                fill="transparent"
              />
            )}
            {fret === 0 ? (
              // Open — thin circle
              <circle
                cx={cx} cy={cy} r={3.5}
                fill="none"
                style={{ stroke: 'var(--dot-color)' }}
                strokeWidth={1.2}
              />
            ) : fret === -1 ? (
              // Muted — ×
              <text
                x={cx} y={cy + 3.5}
                textAnchor="middle"
                fontSize={9}
                fontFamily="monospace"
                style={{ fill: 'var(--color-text-tertiary)' }}
              >
                ×
              </text>
            ) : (
              // Fret pressed — dim hint dot
              <circle cx={cx} cy={cy} r={2.5} fill="none"
                style={{ stroke: 'var(--color-text-tertiary)' }}
                strokeWidth={0.8} opacity={0.35}
              />
            )}
          </g>
        )
      })}

      {/* ── Nut ────────────────────────────────────────────────────────────── */}
      <rect
        x={LEFT_W}
        y={LABEL_H + INDIC_H}
        width={boardW}
        height={NUT_H}
        rx={1}
        style={{ fill: 'var(--nut-color)' }}
      />

      {/* ── Fret lines ─────────────────────────────────────────────────────── */}
      {Array.from({ length: fretCount }).map((_, fi) => (
        <line
          key={`fret-${fi}`}
          x1={LEFT_W} y1={fy(fi + 1)}
          x2={LEFT_W + boardW} y2={fy(fi + 1)}
          style={{ stroke: 'var(--fret-color)' }}
          strokeWidth={fi === 0 ? 1.5 : 0.75}
          opacity={fi === 0 ? 1 : 0.55}
        />
      ))}

      {/* ── Inlay position dots (board markers) ────────────────────────────── */}
      {!compact && Array.from({ length: fretCount }).map((_, fi) => {
        if (!INLAY_FRETS.has(fi + 1)) return null
        const midX = LEFT_W + boardW / 2
        const dotY = fy(fi + 0.5)
        return (
          <circle
            key={`inlay-${fi}`}
            cx={midX} cy={dotY} r={1.8}
            style={{ fill: 'var(--color-text-tertiary)' }}
            opacity={0.2}
          />
        )
      })}

      {/* ── Fret number labels ──────────────────────────────────────────────── */}
      {!compact && Array.from({ length: fretCount }).map((_, fi) => (
        <text
          key={`fn-${fi}`}
          x={LEFT_W - 3}
          y={fy(fi + 0.5) + 2.5}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={6.5}
          fontFamily="monospace"
          style={{ fill: 'var(--color-text-tertiary)' }}
          opacity={0.6}
        >
          {fi + 1}
        </text>
      ))}

      {/* ── Strings ─────────────────────────────────────────────────────────── */}
      {Array.from({ length: NUM_STRINGS }).map((_, si) => (
        <line
          key={`str-${si}`}
          x1={sx(si)} y1={boardTop}
          x2={sx(si)} y2={boardTop + boardH}
          style={{ stroke: 'var(--string-color)' }}
          strokeWidth={STRING_WIDTHS[si]}
        />
      ))}

      {/* ── Tap zones ───────────────────────────────────────────────────────── */}
      {!readOnly && Array.from({ length: NUM_STRINGS }).map((_, si) =>
        Array.from({ length: fretCount }).map((_, fi) => (
          <rect
            key={`tap-${si}-${fi}`}
            x={sx(si) - stringSpacing / 2}
            y={fy(fi)}
            width={stringSpacing}
            height={fretSpacing}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => handleTap(si, fi + 1)}
          />
        ))
      )}

      {/* ── Pressed-fret dots ───────────────────────────────────────────────── */}
      {strings.map((fret, si) => {
        if (fret <= 0) return null
        const cx = sx(si)
        const cy = fy(fret - 0.5)
        const r  = compact ? 4 : 5
        return (
          <circle
            key={`dot-${si}`}
            cx={cx} cy={cy} r={r}
            style={{ fill: 'var(--dot-color)' }}
          />
        )
      })}
    </svg>
  )
}
