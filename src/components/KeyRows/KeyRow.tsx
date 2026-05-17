import { useState } from 'react'
import type { KeyScore } from '../../theory/keyDetection'
import type { SelectedChord, KeyContext } from '../../store/useAppStore'
import { getKeyContext } from '../../theory/descriptions'
import PaletteCard from './PaletteCard'
import { useIsMobile } from '../../hooks/useIsMobile'

// ── Colour map keyed by KeyContext ────────────────────────────────────────────
const COLOURS: Record<KeyContext, { h: string; dk: string; bg: string; border: string }> = {
  major: {
    h:      'var(--key-major-h)',
    dk:     'var(--key-major-dk)',
    bg:     'var(--key-major-bg)',
    border: 'var(--key-major-border)',
  },
  minor: {
    h:      'var(--key-minor-h)',
    dk:     'var(--key-minor-dk)',
    bg:     'var(--key-minor-bg)',
    border: 'var(--key-minor-border)',
  },
  mixo: {
    h:      'var(--key-mixo-h)',
    dk:     'var(--key-mixo-dk)',
    bg:     'var(--key-mixo-bg)',
    border: 'var(--key-mixo-border)',
  },
}

// ── Feel label lookup (mirrors keyDetection.ts ch field, uses mode primary name) ──
const FEEL_LABELS: Record<string, string> = {
  Major:      'Grounded & singable — pop, folk, anthems',
  Lydian:     'Dreamy & weightless — film scores, floating wonder',
  Mixolydian: 'Rock swagger — major feel with a rebellious edge',
  Minor:      'Emotional depth — ballads, drama, longing',
  Dorian:     'Groove-forward & bittersweet — jazz, R&B, folk noir',
  Phrygian:   'Menacing & exotic — flamenco, metal, cinematic danger',
  Locrian:    'Dissonant & restless — tension without release',
}

// ── Signature progression for each mode ──────────────────────────────────────
const MODE_SIGNATURES: Record<string, { label: string; tip: string }> = {
  Major:      { label: 'I → V → vi → IV',    tip: 'The most universal loop in pop & rock' },
  Lydian:     { label: 'I → II',              tip: 'The ♯IV defines the floating Lydian sound' },
  Mixolydian: { label: 'I → ♭VII → IV',      tip: 'The ♭VII chord is the Mixolydian signature move' },
  Minor:      { label: 'i → VI → III → VII',  tip: 'The Andalusian cadence — works in nearly any minor song' },
  Dorian:     { label: 'i → IV',              tip: 'The major IV chord is what makes it Dorian, not just minor' },
  Phrygian:   { label: 'i → ♭II',            tip: 'The flatted second is the instant Phrygian giveaway' },
  Locrian:    { label: 'i → ♭II → ♭V',      tip: 'Rarely a home key — best for tension passages' },
}

// ── Full progression library per mode ────────────────────────────────────────
interface ProgEntry { romans: string; name: string; context: string }
const MODE_PROGRESSIONS: Record<string, ProgEntry[]> = {
  Major: [
    { romans: 'I → V → vi → IV',   name: 'The pop loop',         context: 'The most widely used loop in modern music — instantly familiar' },
    { romans: 'I → IV → V',        name: 'Rock & country',       context: 'Three-chord classic — direct and driving' },
    { romans: 'I → vi → IV → V',   name: '50s progression',      context: 'Doo-wop, early rock and roll, nostalgic feel' },
    { romans: 'ii → V → I',        name: 'Jazz turnaround',      context: 'The most common resolution in jazz — tense then home' },
  ],
  Lydian: [
    { romans: 'I → II',            name: 'Lydian float',         context: 'The ♯IV in the II chord creates instant lift' },
    { romans: 'I → II → I',        name: 'Hovering loop',        context: 'Never quite resolves — perfect for wonder or suspense' },
    { romans: 'I → II → vii',      name: 'Dreamy descent',       context: 'Floats up then gently steps back — cinematic' },
    { romans: 'IV → I → II',       name: 'Film score sweep',     context: 'Wide, orchestral feel — cinematic and expansive' },
  ],
  Mixolydian: [
    { romans: 'I → ♭VII → IV',    name: 'The Mixo signature',   context: 'Instant rootsy feel — the ♭VII is the defining Mixolydian move' },
    { romans: 'I → ♭VII → I',     name: 'Rock riff loop',       context: 'The ♭VII gives it swagger without going minor' },
    { romans: 'I → IV → ♭VII',    name: 'Extended loop',        context: 'Adds more breathing room — Celtic, blues-rock' },
    { romans: 'I → ♭VII → IV → I',name: 'Full Mixo loop',       context: 'Complete cycle — groovy and unresolved' },
  ],
  Minor: [
    { romans: 'i → VI → III → VII',name: 'Andalusian cadence',  context: 'The most versatile minor loop — works in almost any style' },
    { romans: 'i → VI → VII',      name: 'Modern pop minor',    context: 'Punchy and anthemic — short cycle with a lot of forward momentum' },
    { romans: 'i → iv → V',        name: 'Classical minor',     context: 'Natural tension to dominant — resolved and dramatic' },
    { romans: 'i → VII → VI → VII',name: 'Rock minor loop',     context: 'Keeps circling — heavy, relentless energy' },
  ],
  Dorian: [
    { romans: 'i → IV',            name: 'Dorian signature',    context: 'The major IV over a minor tonic is the Dorian giveaway' },
    { romans: 'i → VII → IV → i',  name: 'Funk loop',           context: 'Groove-forward and cyclical — classic R&B and funk feel' },
    { romans: 'i → ii',            name: 'Raised sixth pull',   context: 'The ii chord highlights the raised 6th — jazzy and soulful' },
    { romans: 'i → IV → VII → i',  name: 'Modal rock',          context: 'Circular and hypnotic — folk noir, psychedelic rock' },
  ],
  Phrygian: [
    { romans: 'i → ♭II',          name: 'Phrygian pull',       context: 'The flatted second gives instant Spanish/metal drama' },
    { romans: 'i → ♭II → i',      name: 'Riff loop',           context: 'Back and forth — heavy, menacing, rhythmic' },
    { romans: 'i → ♭VII → ♭VI → ♭II → i', name: 'Flamenco cadence', context: 'The classic Andalusian descent — deeply Spanish' },
    { romans: '♭II → i',          name: 'Reverse resolution',  context: 'Lands on i from above — unsettling and exotic' },
  ],
  Locrian: [
    { romans: 'i → ♭II',          name: 'Only stable move',    context: 'The ♭II is the one chord that doesn\'t collapse inward' },
    { romans: 'i → ♭II → ♭V',    name: 'Tension passage',     context: 'Good for a few bars of instability before resolving elsewhere' },
    { romans: '♭V → i',           name: 'Tritone descent',     context: 'Maximum dissonance — avant-garde or extreme metal only' },
  ],
}

// ── Component ─────────────────────────────────────────────────────────────────

interface KeyRowProps {
  keyScore:      KeyScore
  progressionChordNames: string[]
  selectedChord: SelectedChord | null
  onChordTap:    (chord: SelectedChord) => void
  isPrimary?:    boolean   // false = partial match row, show score badge
}

export default function KeyRow({ keyScore, progressionChordNames, selectedChord, onChordTap, isPrimary = true }: KeyRowProps) {
  const isMobile    = useIsMobile()
  const ctx         = getKeyContext(keyScore.modeName) as KeyContext
  const colours     = COLOURS[ctx]
  const feel        = FEEL_LABELS[keyScore.modeName] ?? keyScore.modeName
  const signature   = MODE_SIGNATURES[keyScore.modeName] ?? null
  const progressions = MODE_PROGRESSIONS[keyScore.modeName] ?? []
  const keyName     = `${keyScore.rootName} ${keyScore.modeName}`

  const [progsOpen, setProgsOpen] = useState(false)

  const isPartial = keyScore.tot > 0 && keyScore.score < keyScore.tot

  return (
    <div
      style={{
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        borderLeft: `4px solid ${isPrimary ? colours.border : colours.border + '88'}`,
        flexShrink: 0,
        opacity: isPrimary ? 1 : 0.82,
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '10px 14px 10px 10px',
          gap: 8,
          background: colours.bg,
        }}
      >
        {/* Colour dot */}
        <svg width="10" height="10" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="5" cy="5" r="5" fill={colours.h} />
        </svg>

        {/* Feel label + signature */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 500,
              color: colours.dk,
            }}
          >
            {feel}
          </span>
          {signature && (
            <button
              onClick={() => setProgsOpen(o => !o)}
              title={progsOpen ? 'Hide progressions' : signature.tip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: colours.h,
                opacity: progsOpen ? 1 : 0.8,
                letterSpacing: '.3px',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                transition: 'opacity .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = progsOpen ? '1' : '0.8' }}
            >
              {signature.label}
              <span style={{ fontSize: 8, opacity: 0.7 }}>{progsOpen ? '▲' : '▼'}</span>
            </button>
          )}
        </div>

        {/* Partial-match badge */}
        {isPartial && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: colours.h,
              background: colours.bg,
              border: `0.5px solid ${colours.border}`,
              borderRadius: 3,
              padding: '2px 5px',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {keyScore.score}/{keyScore.tot}
          </span>
        )}

        {/* Key name */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: colours.h,
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {keyName}
        </span>
      </div>

      {/* Progressions accordion */}
      {progsOpen && progressions.length > 0 && (
        <div
          style={{
            borderTop: `0.5px solid ${colours.border}44`,
            background: colours.bg,
            padding: '4px 12px 6px 12px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {progressions.map((p, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: isMobile ? '10px 2px' : '7px 2px',
                borderBottom: i < progressions.length - 1
                  ? `0.5px solid ${colours.border}33`
                  : 'none',
              }}
            >
              {/* Row 1: roman numerals + name */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: isMobile ? 13 : 11,
                    color: colours.dk,
                    fontWeight: 600,
                    flex: 1,
                    letterSpacing: '.2px',
                  }}
                >
                  {p.romans}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: isMobile ? 11 : 10,
                    color: colours.h,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {p.name}
                </span>
              </div>
              {/* Row 2: description */}
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: isMobile ? 11 : 10,
                  color: 'var(--color-text-tertiary)',
                  lineHeight: 1.5,
                }}
              >
                {p.context}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chord palette */}
      <div
        style={{
          display: 'flex',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 5,
          padding: '8px 12px 12px',
        }}
      >
        {keyScore.kc.map(chord => {
          const inProg = progressionChordNames.includes(chord.name)
          const isSel  = selectedChord?.name === chord.name && selectedChord?.keyName === keyName

          return (
            <PaletteCard
              key={chord.name + chord.roman}
              chord={chord}
              inProgression={inProg}
              isSelected={isSel}
              keyContext={ctx}
              keyName={keyName}
              onTap={onChordTap}
            />
          )
        })}
      </div>
    </div>
  )
}
