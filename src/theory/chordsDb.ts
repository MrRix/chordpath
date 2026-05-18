import guitarData from "@tombatossals/chords-db/lib/guitar.json"
import { parseChord } from './keyDetection'
import { chordToDbKeys } from './chordRegistry'

// ── ChordPosition ─────────────────────────────────────────────────────────────

export interface ChordPosition {
  frets:      number[]   // 0=open, -1=muted, 1–N=fret number relative to baseFret
  fingers:    number[]   // 0=open/unfingered, 1=index, 2=middle, 3=ring, 4=pinky
  baseFret:   number     // lowest fret number displayed (1 = includes nut)
  barres:     number[]   // fret positions (relative, 1-based) where a barre exists
  label?:     string     // e.g. 'Open', 'Barre 2fr', 'Adv 7fr'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

// ── Voicing normalisation ─────────────────────────────────────────────────────
// chords-db stores some barre chords at baseFret=1 even when no open strings
// are used (e.g. Bm: baseFret=1, frets=[2,2,4,4,3,2]). This makes the nut
// visible when it shouldn't be. Shift so baseFret equals the lowest pressed fret.
function normalizePosition(v: ChordPosition): ChordPosition {
  const hasOpen = v.frets.some(f => f === 0)
  if (v.baseFret !== 1 || hasOpen) return v

  const activeFrets = v.frets.filter(f => f > 0)
  if (!activeFrets.length) return v

  const minFret = Math.min(...activeFrets)
  if (minFret <= 1) return v

  const shift = minFret - 1
  return {
    ...v,
    baseFret: v.baseFret + shift,
    frets:    v.frets.map(f => f > 0 ? f - shift : f),
    barres:   v.barres.map(b => b - shift),
  }
}

// ── Voicing ranking ───────────────────────────────────────────────────────────
// 6-tier pedagogical sequence matching the Design Reference spec:
//   Tier 1 (0–7):  Open position, ≤1 muted string   — best open voicing
//   Tier 2 (8–14): Open position, 2+ muted strings  — alternate open
//   Tier 3 (15–21): E-shape barre, baseFret ≤ 5
//   Tier 4 (22–28): A-shape barre, baseFret 5–9
//   Tier 5 (29–35): Upper-neck closed shapes
//   Tier 6 (36+):  Specialty / high-neck
function voicingScore(v: ChordPosition): number {
  const hasOpen    = v.frets.some(f => f === 0)
  const mutedCount = v.frets.filter(f => f === -1).length
  const hasBarre   = v.barres.length > 0

  if (hasOpen && v.baseFret <= 3) {
    const baseTier = mutedCount <= 1 ? 0 : 8
    return baseTier + v.baseFret * 2 + mutedCount
  }
  if (hasBarre && v.baseFret <= 5) {
    return 15 + v.baseFret + mutedCount * 0.5
  }
  if (hasBarre && v.baseFret <= 9) {
    return 22 + v.baseFret + mutedCount * 0.5
  }
  if (hasBarre || v.baseFret >= 8) {
    return 29 + v.baseFret + mutedCount * 0.5
  }
  return 36 + v.baseFret + mutedCount
}

// ── Difficulty classification ─────────────────────────────────────────────────
function voicingDifficulty(v: ChordPosition): 'beginner' | 'intermediate' | 'advanced' {
  const hasOpen  = v.frets.some(f => f === 0)
  const hasBarre = v.barres.length > 0
  if (hasOpen && !hasBarre) return 'beginner'
  if (hasBarre && v.baseFret <= 5) return 'intermediate'
  return 'advanced'
}

// ── Voicing label ─────────────────────────────────────────────────────────────
// Compact labels for the voicing selector pills — short enough to fit in the
// 196px desktop panel without overflowing (4–6 buttons × ~40px each = fine).
function voicingLabel(v: ChordPosition): string {
  const hasOpen = v.frets.some(f => f === 0)
  if (hasOpen && v.baseFret <= 1) return 'Open'
  return `${v.baseFret}fr`
}

// ── Verified voicing overrides ────────────────────────────────────────────────
// Hand-curated voicings for the highest-frequency chords (Tier A + Tier B from
// Chordonomicon data) and the three most common slash chords.
// These take full priority over chords-db — if a chord name is found here,
// chords-db is not consulted at all.
//
// Rules:
//   - Sorted pedagogically: open position first, then barre by ascending fret.
//   - label/difficulty are set by voicingLabel()/voicingDifficulty() at call time.
//   - G has two open voicings — both label as "Open"; the diagram is the differentiator.
//   - Thumb voicings use finger value 5 (renderer shows "T"); flagged advanced.
//   - Bdim: chords-db voicing x2x0x1 has 3 muted strings and is awkward.
//     Override with the cleaner x2324x shape (B F B D muted).
//
// Diminished audit status (Phase 3):
//   - Bdim:  ✅ overridden below
//   - F#dim: ⚠️ chords-db unverified — needs Phase 3 follow-up
//   - C#dim: ⚠️ chords-db unverified — needs Phase 3 follow-up

const VOICING_OVERRIDES: Record<string, ChordPosition[]> = {

  // ── Tier A — Universal ─────────────────────────────────────────────────────

  // G: 3 named voicings (open 4-finger preferred, open 3-finger alt, E-shape barre 3fr)
  'G': [
    { frets:[3,2,0,0,3,3], fingers:[2,1,0,0,3,4], baseFret:1, barres:[] },
    { frets:[3,2,0,0,0,3], fingers:[2,1,0,0,0,3], baseFret:1, barres:[] },
    { frets:[1,3,3,2,1,1], fingers:[1,3,4,2,1,1], baseFret:3, barres:[1] },
  ],

  // C: open x32010, then A-shape barre 3fr
  'C': [
    { frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0], baseFret:1, barres:[] },
    { frets:[-1,1,3,3,3,1], fingers:[0,1,2,3,4,1], baseFret:3, barres:[1] },
  ],

  // D: standard open xx0232
  'D': [
    { frets:[-1,-1,0,2,3,2], fingers:[0,0,0,1,3,2], baseFret:1, barres:[] },
  ],

  // Am: open x02210, then E-shape barre 5fr
  'Am': [
    { frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0], baseFret:1, barres:[] },
    { frets:[1,3,3,1,1,1],  fingers:[1,3,4,1,1,1], baseFret:5, barres:[1] },
  ],

  // Em: open 022000, then Am-shape barre 7fr
  'Em': [
    { frets:[0,2,2,0,0,0],   fingers:[0,2,3,0,0,0], baseFret:1, barres:[] },
    { frets:[-1,1,3,3,2,1],  fingers:[0,1,3,4,2,1], baseFret:7, barres:[1] },
  ],

  // A: open x02220, then E-shape barre 5fr
  'A': [
    { frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0], baseFret:1, barres:[] },
    { frets:[1,3,3,2,1,1],  fingers:[1,3,4,2,1,1], baseFret:5, barres:[1] },
  ],

  // E: open 022100
  'E': [
    { frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0], baseFret:1, barres:[] },
  ],

  // ── Tier B — Very common ───────────────────────────────────────────────────

  // Dm: open xx0231, then Am-shape barre 5fr
  'Dm': [
    { frets:[-1,-1,0,2,3,1], fingers:[0,0,0,2,3,1], baseFret:1, barres:[] },
    { frets:[-1,1,3,3,2,1],  fingers:[0,1,3,4,2,1], baseFret:5, barres:[1] },
  ],

  // Bm: Am-shape barre 2fr (no practical open voicing)
  'Bm': [
    { frets:[-1,1,3,3,2,1], fingers:[0,1,3,4,2,1], baseFret:2, barres:[1] },
  ],

  // F: E-shape barre 1fr (cowboy F — the standard first voicing)
  'F': [
    { frets:[1,3,3,2,1,1], fingers:[1,3,4,2,1,1], baseFret:1, barres:[1] },
  ],

  // G7: open 320001
  'G7': [
    { frets:[3,2,0,0,0,1], fingers:[3,2,0,0,0,1], baseFret:1, barres:[] },
  ],

  // D7: open xx0212
  'D7': [
    { frets:[-1,-1,0,2,1,2], fingers:[0,0,0,2,1,3], baseFret:1, barres:[] },
  ],

  // E7: open 020100
  'E7': [
    { frets:[0,2,0,1,0,0], fingers:[0,2,0,1,0,0], baseFret:1, barres:[] },
  ],

  // A7: open x02020
  'A7': [
    { frets:[-1,0,2,0,2,0], fingers:[0,0,2,0,3,0], baseFret:1, barres:[] },
  ],

  // Cadd9: x32030 (ring on A fret 3, middle on D fret 2, pinky on B fret 3, high e open)
  'Cadd9': [
    { frets:[-1,3,2,0,3,0], fingers:[0,3,2,0,4,0], baseFret:1, barres:[] },
  ],

  // Bdim: chords-db has x2x0x1 (3 muted strings — awkward).
  // Override with cleaner x 2 3 4 3 x = B F B D (muted) on A/D/G/B.
  // baseFret=2 since no open strings; stored as relative frets.
  'Bdim': [
    { frets:[-1,1,2,3,2,-1], fingers:[0,1,2,4,3,0], baseFret:2, barres:[] },
  ],

  // ── Slash chords ───────────────────────────────────────────────────────────

  // G/B: x20033 — standard open G/B (B in bass, G chord voicing above)
  'G/B': [
    { frets:[-1,2,0,0,3,3], fingers:[0,1,0,0,2,3], baseFret:1, barres:[] },
  ],

  // D/F#: thumb voicing — thumb on low E fret 2 (F#), then standard D shape
  // fingers[0] = 5 signals thumb; renderer displays "T" inside the dot.
  'D/F#': [
    { frets:[2,-1,0,2,3,2], fingers:[5,0,0,1,2,3], baseFret:1, barres:[] },
  ],

  // C/E: 032010 — open E as bass, standard C above
  'C/E': [
    { frets:[0,3,2,0,1,0], fingers:[0,3,2,0,1,0], baseFret:1, barres:[] },
  ],
}

// ── Public API ────────────────────────────────────────────────────────────────
export function getChordVoicings(chordName: string): ChordPosition[] {
  const parsed = parseChord(chordName)
  if (!parsed) return []

  // Build the suffix for chords-db lookup.
  // parseChord separates 'G/B' into suf='' and bass='B', so we reconstruct.
  const lookupSuffix = parsed.bass
    ? parsed.suf + '/' + parsed.bass
    : parsed.suf

  // Pull chords-db positions (may be empty for unsupported chords)
  const keys = chordToDbKeys(parsed.ri, lookupSuffix)
  const dbRaw: ChordPosition[] = []
  if (keys) {
    const { dbKey, dbSuffix } = keys
    const chordList = (guitarData.chords as Record<string, { suffix: string; positions: ChordPosition[] }[]>)[dbKey]
    const match = chordList?.find(c => c.suffix === dbSuffix)
    dbRaw.push(...(match?.positions ?? []))
  }

  // Finalize: normalize → sort → label/difficulty
  const finalize = (v: ChordPosition): ChordPosition => ({
    ...v,
    label:      v.label      ?? voicingLabel(v),
    difficulty: v.difficulty ?? voicingDifficulty(v),
  })

  const dbVoicings = dbRaw
    .map(normalizePosition)
    .sort((a, b) => voicingScore(a) - voicingScore(b))
    .map(finalize)

  // If the chord has curated overrides, place them first then fill from
  // chords-db — deduplicating by baseFret so we never show the same
  // position twice. This preserves alternatives while ensuring verified
  // voicings appear at the top.
  if (chordName in VOICING_OVERRIDES) {
    const overrides = VOICING_OVERRIDES[chordName].map(finalize)
    const overrideBaseFrets = new Set(overrides.map(v => v.baseFret))
    const extras = dbVoicings.filter(v => !overrideBaseFrets.has(v.baseFret))
    return [...overrides, ...extras].slice(0, 6)
  }

  return dbVoicings.slice(0, 6)
}
