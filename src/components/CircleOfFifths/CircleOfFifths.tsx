import { useAppStore } from '../../store/useAppStore'
import { getKeyContext } from '../../theory/descriptions'

// ── Circle of fifths constants ─────────────────────────────────────────────────
// Labels in fifths order (C at 12 o'clock, clockwise)
const COF_LABELS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']

// Pitch-class → position on circle (0 = C/top, clockwise)
const PC_TO_FIFTHS: Record<number, number> = {
  0:0, 7:1, 2:2, 9:3, 4:4, 11:5, 6:6, 1:7, 8:8, 3:9, 10:10, 5:11,
}

// CSS variable tokens per key context (SVG supports var() in style attr)
const KEY_COLOUR: Record<string, string> = {
  major: 'var(--key-major-h)',
  minor: 'var(--key-minor-h)',
  mixo:  'var(--key-mixo-h)',
}
const KEY_DK: Record<string, string> = {
  major: 'var(--key-major-dk)',
  minor: 'var(--key-minor-dk)',
  mixo:  'var(--key-mixo-dk)',
}

// ── Geometry helpers ───────────────────────────────────────────────────────────
const CX = 80, CY = 80
const TRACK_R  = 50   // ring on which dots sit
const LABEL_R  = 66   // ring on which key names sit
const DOT_R    = 7    // radius of active key dot

function pt(pos: number, r: number) {
  const a = (pos / 12) * 2 * Math.PI - Math.PI / 2
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CircleOfFifths() {
  const topKeys   = useAppStore(s => s.topKeys)
  const hasChords = topKeys.length > 0

  const active = topKeys.slice(0, 3).map(k => ({
    pos:      PC_TO_FIFTHS[k.r] ?? 0,
    ctx:      getKeyContext(k.modeName),
    label:    COF_LABELS[PC_TO_FIFTHS[k.r] ?? 0],
    keyName:  k.key,
    rootName: k.rootName,
    modeName: k.modeName,
  }))

  // Triangle polygon string
  const triPts = active.map(a => {
    const { x, y } = pt(a.pos, TRACK_R)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0 10px',
        flexShrink: 0,
        borderBottom: '0.5px solid var(--color-border-tertiary)',
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        style={{ overflow: 'visible' }}
      >
        {/* ── Subtle background circle ─────────────────────────────── */}
        <circle
          cx={CX} cy={CY} r={TRACK_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.15"
        />

        {/* ── Inner hub circle ──────────────────────────────────────── */}
        <circle
          cx={CX} cy={CY} r={28}
          fill="var(--color-bg-secondary)"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.1"
        />

        {/* ── Triangle connecting the 3 active keys ─────────────────── */}
        {active.length === 3 && (
          <polygon
            points={triPts}
            fill="currentColor"
            fillOpacity="0.06"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />
        )}

        {/* ── 12 position labels ────────────────────────────────────── */}
        {COF_LABELS.map((label, pos) => {
          const { x, y } = pt(pos, LABEL_R)
          const activeIdx = active.findIndex(a => a.pos === pos)
          const isActive  = activeIdx >= 0
          const ctx       = isActive ? active[activeIdx].ctx : null

          return (
            <text
              key={pos}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily:  'var(--font-mono)',
                fontSize:    isActive ? 10 : 8,
                fontWeight:  isActive ? 600 : 400,
                fill:        isActive && ctx ? KEY_COLOUR[ctx] : 'currentColor',
                fillOpacity: isActive ? 1 : 0.28,
                transition:  'all .25s',
              }}
            >
              {label}
            </text>
          )
        })}

        {/* ── Tick marks for inactive positions ────────────────────── */}
        {Array.from({ length: 12 }, (_, pos) => {
          if (active.some(a => a.pos === pos)) return null
          const inner = pt(pos, TRACK_R - 3)
          const outer = pt(pos, TRACK_R + 2)
          return (
            <line
              key={`tick-${pos}`}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="0.7"
            />
          )
        })}

        {/* ── Active key dots ───────────────────────────────────────── */}
        {active.map((a, i) => {
          const { x, y } = pt(a.pos, TRACK_R)
          return (
            <circle
              key={i}
              cx={x} cy={y}
              r={DOT_R}
              style={{ fill: KEY_COLOUR[a.ctx] }}
            />
          )
        })}

        {/* ── Hub label — primary key ───────────────────────────────── */}
        {hasChords && active[0] && (
          <>
            <text
              x={CX} y={CY - 7}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   12,
                fontWeight: 700,
                fill:       KEY_COLOUR[active[0].ctx],
              }}
            >
              {active[0].rootName}
            </text>
            <text
              x={CX} y={CY + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize:   8,
                fill:       KEY_DK[active[0].ctx],
                fillOpacity: 0.7,
              }}
            >
              {active[0].modeName}
            </text>
          </>
        )}

        {/* ── Empty hub hint ────────────────────────────────────────── */}
        {!hasChords && (
          <text
            x={CX} y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize:   9,
              fill:       'currentColor',
              fillOpacity: 0.22,
            }}
          >
            keys
          </text>
        )}
      </svg>

      {/* ── Key name labels below the circle ──────────────────────── */}
      {hasChords && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 2,
          }}
        >
          {active.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <svg width="8" height="8">
                <circle
                  cx="4" cy="4" r="4"
                  style={{ fill: KEY_COLOUR[a.ctx] }}
                />
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {a.keyName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
