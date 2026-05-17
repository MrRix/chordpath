import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { parseChord } from '../../theory/keyDetection'

// ── Fretboard icon ────────────────────────────────────────────────────────────
function FretboardIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
      <line x1="0" y1="2"   x2="14" y2="2"   stroke="currentColor" strokeOpacity=".6" strokeWidth=".8"/>
      <line x1="0" y1="5.5" x2="14" y2="5.5" stroke="currentColor" strokeOpacity=".6" strokeWidth=".8"/>
      <line x1="0" y1="9"   x2="14" y2="9"   stroke="currentColor" strokeOpacity=".6" strokeWidth=".8"/>
      <line x1="3.5"  y1="0" x2="3.5"  y2="11" stroke="currentColor" strokeOpacity=".4" strokeWidth=".8"/>
      <line x1="7"    y1="0" x2="7"    y2="11" stroke="currentColor" strokeOpacity=".4" strokeWidth=".8"/>
      <line x1="10.5" y1="0" x2="10.5" y2="11" stroke="currentColor" strokeOpacity=".4" strokeWidth=".8"/>
      <circle cx="7" cy="5.5" r="2" fill="currentColor" fillOpacity=".7"/>
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChordInputStrip() {
  const progression       = useAppStore(s => s.progression)
  const keyToUse          = useAppStore(s => s.keyToUse)
  const confidence        = useAppStore(s => s.confidence)
  const inferredMode      = useAppStore(s => s.inferredMode)
  const fretboardOpen     = useAppStore(s => s.fretboardPanelOpen)
  const addChord          = useAppStore(s => s.addChordToProgression)
  const removeChord       = useAppStore(s => s.removeChordFromProgression)
  const setFretboardOpen  = useAppStore(s => s.setFretboardOpen)

  const [inputValue, setInputValue]   = useState('')
  const [inputError, setInputError]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(() => {
    const raw = inputValue.trim()
    if (!raw) return
    const parsed = parseChord(raw)
    if (!parsed) {
      // Flash error state
      setInputError(true)
      setTimeout(() => setInputError(false), 600)
      return
    }
    addChord(parsed.name, parsed.unrecognized, parsed.hint)
    setInputValue('')
    inputRef.current?.focus()
  }, [inputValue, addChord])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div
      style={{
        minHeight: 64,
        background: 'var(--panel-bg)',
        borderBottom: '2px solid var(--color-border-secondary)',
        padding: '9px 14px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* ── Chord chips ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 5,
          flex: 1,
          minWidth: 0,
        }}
      >
        {progression.map(slot => {
          if (!slot.chordName) return null
          return (
            <div
              key={slot.id}
              className="chip-enter"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-secondary)',
                borderRadius: 'var(--radius)',
                padding: '5px 22px 5px 9px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                }}
              >
                {slot.chordName}
              </span>
              {/* Remove button */}
              <button
                onClick={() => removeChord(slot.id)}
                title="Remove chord"
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  fontSize: 9,
                  lineHeight: 1,
                  color: 'var(--color-text-tertiary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onMouseEnter={e => {
                  const t = e.currentTarget
                  t.style.color = '#dc2626'
                  t.style.background = 'rgba(220,38,38,.1)'
                }}
                onMouseLeave={e => {
                  const t = e.currentTarget
                  t.style.color = 'var(--color-text-tertiary)'
                  t.style.background = 'none'
                }}
              >
                ×
              </button>
            </div>
          )
        })}

        {/* ── Text input ──────────────────────────────────────────────── */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Am"
          maxLength={8}
          style={{
            width: 80,
            height: 34,
            padding: '0 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            border: `1px solid ${inputError ? 'rgba(220,38,38,.5)' : 'var(--color-border-secondary)'}`,
            borderRadius: 'var(--radius)',
            background: 'var(--panel-bg)',
            color: 'var(--color-text-primary)',
            outline: 'none',
            transition: 'border-color .15s, box-shadow .15s',
            flexShrink: 0,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#5EBEC4'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(94,190,196,.12)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--color-border-secondary)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />

        {/* ── Add button ──────────────────────────────────────────────── */}
        <button
          onClick={handleAdd}
          style={{
            height: 34,
            padding: '0 11px',
            background: 'var(--accent)',
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 500,
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            flexShrink: 0,
            transition: 'background .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
        >
          Add
        </button>

        {/* ── Unrecognized chord warning ───────────────────────────────── */}
        {(() => {
          const bad = progression.find(s => s.unrecognized && s.chordName)
          if (!bad) return null
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 10px',
                borderRadius: 'var(--radius)',
                background: 'rgba(245,146,58,.10)',
                border: '1px solid rgba(245,146,58,.40)',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>⚠</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-body)',
                  color: '#92400e',
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    marginRight: 3,
                  }}
                >
                  {bad.chordName}
                </span>
                {bad.hint}
              </span>
            </div>
          )
        })()}
      </div>

      {/* ── Separator ────────────────────────────────────────────────────── */}
      <div
        style={{
          width: '0.5px',
          height: 30,
          background: 'var(--color-border-tertiary)',
          flexShrink: 0,
        }}
      />

      {/* ── Fretboard toggle button ───────────────────────────────────── */}
      <button
        onClick={() => setFretboardOpen(!fretboardOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          color: fretboardOpen ? '#085041' : 'var(--color-text-secondary)',
          background: fretboardOpen ? 'rgba(94,190,196,.07)' : 'none',
          border: `0.5px solid ${fretboardOpen ? 'var(--accent)' : 'var(--color-border-secondary)'}`,
          borderRadius: 'var(--radius)',
          padding: '6px 10px',
          cursor: 'pointer',
          flexShrink: 0,
          fontFamily: 'var(--font-body)',
          transition: 'all .12s',
        }}
        onMouseEnter={e => {
          if (!fretboardOpen) {
            const t = e.currentTarget
            t.style.borderColor = 'var(--accent)'
            t.style.color = '#085041'
            t.style.background = 'rgba(94,190,196,.07)'
          }
        }}
        onMouseLeave={e => {
          if (!fretboardOpen) {
            const t = e.currentTarget
            t.style.borderColor = 'var(--color-border-secondary)'
            t.style.color = 'var(--color-text-secondary)'
            t.style.background = 'none'
          }
        }}
      >
        <FretboardIcon />
        Fretboard
      </button>

      {/* ── Live key chip ─────────────────────────────────────────────── */}
      <div
        style={{
          marginLeft: 'auto',
          background: 'rgba(94,190,196,.1)',
          border: '1.5px solid rgba(94,190,196,.32)',
          borderRadius: 'var(--radius)',
          padding: '4px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '.8px',
            fontWeight: 500,
            color: '#085041',
            fontFamily: 'var(--font-body)',
          }}
        >
          Detected key
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: progression.filter(s => s.chordName).length ? 18 : 14,
            fontWeight: 500,
            color: 'var(--accent)',
            lineHeight: 1,
          }}
        >
          {progression.filter(s => s.chordName).length
            ? `${keyToUse} ${inferredMode}`
            : '—'}
        </span>
        {/* Confidence dots */}
        <div style={{ display: 'flex', gap: 3, marginTop: 1 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: i <= confidence ? 'var(--accent)' : 'var(--color-border-secondary)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
