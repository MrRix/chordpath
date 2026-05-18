/**
 * chordRegistry.ts — Single source of truth for chord identity.
 *
 * All root mappings, quality definitions, interval sets, and suffix mappings
 * are defined here. Every other module imports from this file.
 *
 * Replaces (and renders obsolete):
 *   - NOTE_SI    in keyDetection.ts
 *   - CIV        in keyDetection.ts
 *   - Q_SUFFIX   in keyDetection.ts
 *   - FLAT_SI    in keyDetection.ts
 *   - NOTE_MAP   in chordsDb.ts
 *   - SUFFIX_MAP in chordsDb.ts
 */

// ── Root definitions ──────────────────────────────────────────────────────────

export const ROOTS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'] as const
export type RootName = typeof ROOTS[number]

/**
 * All enharmonic spellings → pitch class index 0–11.
 * Replaces NOTE_SI in keyDetection.ts.
 */
export const NOTE_TO_PC: Record<string, number> = {
  'C':0,  'B#':0,
  'C#':1, 'Db':1,
  'D':2,
  'D#':3, 'Eb':3,
  'E':4,  'Fb':4,
  'F':5,  'E#':5,
  'F#':6, 'Gb':6,
  'G':7,
  'G#':8, 'Ab':8,
  'A':9,
  'A#':10,'Bb':10,
  'B':11, 'Cb':11,
}

/**
 * Pitch class index → chords-db database key.
 * chords-db uses 'Csharp' / 'Fsharp' for chromatic roots, not 'C#' / 'F#'.
 * Replaces NOTE_MAP in chordsDb.ts.
 */
export const PC_TO_DB_KEY: Record<number, string> = {
  0:'C', 1:'Csharp', 2:'D', 3:'Eb', 4:'E', 5:'F',
  6:'Fsharp', 7:'G', 8:'Ab', 9:'A', 10:'Bb', 11:'B',
}

/**
 * Root pitch classes that use flat spelling for scale note names.
 * F (5) is included because F major uses Bb.
 * Replaces FLAT_SI in keyDetection.ts.
 */
export const FLAT_PC = new Set([1, 3, 5, 8, 10]) // Db, Eb, F, Ab, Bb

// ── Quality definitions ───────────────────────────────────────────────────────

export interface ChordQuality {
  key:        string    // internal key used throughout the codebase, e.g. 'min', 'maj7'
  suffix:     string    // canonical chord suffix shown to users, e.g. 'm', 'maj7'
  dbSuffix:   string    // chords-db suffix key, e.g. 'minor', 'maj7'
  intervals:  number[]  // pitch class intervals from root, e.g. [0, 3, 7]
  label:      string    // human-readable quality name, e.g. 'minor', 'major 7th'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tier:       number    // display priority — lower shown first in quality pickers
}

/**
 * All supported chord qualities.
 * This is the single place to add/remove/adjust any chord type.
 * Replaces CIV, Q_SUFFIX in keyDetection and SUFFIX_MAP in chordsDb.
 *
 * Note on diminished chords (appear in EVERY mode's palette):
 *   - 'dim'  = diminished triad [0,3,6] — primary user entry (typed as 'dim')
 *   - 'dim7' = full diminished 7th [0,3,6,9] — symmetrical, only 3 unique shapes
 *   - 'm7b5' = half-diminished [0,3,6,10] — also written ø, but 'm7b5' is the input
 *   The '°' symbol is display-only (Roman numeral labels), NOT an input suffix.
 */
export const CHORD_QUALITIES: ChordQuality[] = [
  // ── Triads ─────────────────────────────────────────────────────────────────
  { key:'maj',  suffix:'',     dbSuffix:'major', intervals:[0,4,7],       label:'major',           difficulty:'beginner',     tier:1 },
  { key:'min',  suffix:'m',    dbSuffix:'minor', intervals:[0,3,7],       label:'minor',           difficulty:'beginner',     tier:1 },
  { key:'dim',  suffix:'dim',  dbSuffix:'dim',   intervals:[0,3,6],       label:'diminished',      difficulty:'intermediate', tier:3 },
  { key:'aug',  suffix:'aug',  dbSuffix:'aug',   intervals:[0,4,8],       label:'augmented',       difficulty:'intermediate', tier:3 },

  // ── Seventh chords ──────────────────────────────────────────────────────────
  { key:'7',    suffix:'7',    dbSuffix:'7',     intervals:[0,4,7,10],    label:'dominant 7th',    difficulty:'beginner',     tier:2 },
  { key:'maj7', suffix:'maj7', dbSuffix:'maj7',  intervals:[0,4,7,11],    label:'major 7th',       difficulty:'intermediate', tier:2 },
  { key:'m7',   suffix:'m7',   dbSuffix:'m7',    intervals:[0,3,7,10],    label:'minor 7th',       difficulty:'intermediate', tier:2 },
  { key:'dim7', suffix:'dim7', dbSuffix:'dim7',  intervals:[0,3,6,9],     label:'diminished 7th',  difficulty:'advanced',     tier:3 },
  { key:'m7b5', suffix:'m7b5', dbSuffix:'m7b5',  intervals:[0,3,6,10],    label:'half-diminished', difficulty:'advanced',     tier:3 },

  // ── Suspended ──────────────────────────────────────────────────────────────
  { key:'sus2', suffix:'sus2', dbSuffix:'sus2',  intervals:[0,2,7],       label:'suspended 2nd',   difficulty:'beginner',     tier:2 },
  { key:'sus4', suffix:'sus4', dbSuffix:'sus4',  intervals:[0,5,7],       label:'suspended 4th',   difficulty:'beginner',     tier:2 },

  // ── Added note ─────────────────────────────────────────────────────────────
  { key:'add9', suffix:'add9', dbSuffix:'add9',  intervals:[0,4,7,14],    label:'add 9',           difficulty:'intermediate', tier:2 },

  // ── Extended ───────────────────────────────────────────────────────────────
  { key:'9',    suffix:'9',    dbSuffix:'9',     intervals:[0,4,7,10,14], label:'dominant 9th',    difficulty:'intermediate', tier:3 },
  { key:'maj9', suffix:'maj9', dbSuffix:'maj9',  intervals:[0,4,7,11,14], label:'major 9th',       difficulty:'advanced',     tier:3 },
  { key:'m9',   suffix:'m9',   dbSuffix:'m9',    intervals:[0,3,7,10,14], label:'minor 9th',       difficulty:'advanced',     tier:3 },
  { key:'m11',  suffix:'m11',  dbSuffix:'m11',   intervals:[0,3,7,10,17], label:'minor 11th',       difficulty:'advanced',     tier:4 },
  { key:'11',   suffix:'11',   dbSuffix:'11',    intervals:[0,4,7,10,17], label:'11th',            difficulty:'advanced',     tier:4 },
  { key:'13',   suffix:'13',   dbSuffix:'13',    intervals:[0,4,7,10,21], label:'13th',            difficulty:'advanced',     tier:4 },

  // ── Sixth chords ───────────────────────────────────────────────────────────
  { key:'6',    suffix:'6',    dbSuffix:'6',     intervals:[0,4,7,9],     label:'major 6th',       difficulty:'intermediate', tier:3 },
  { key:'m6',   suffix:'m6',   dbSuffix:'m6',    intervals:[0,3,7,9],     label:'minor 6th',       difficulty:'intermediate', tier:3 },

  // ── Power chords — AWAITING CHORD TYPE CONFIG ───────────────────────────────
  // { key:'5', suffix:'5', dbSuffix:'5', intervals:[0,7], label:'power chord', difficulty:'beginner', tier:1 },
]

// ── Fast lookup maps ──────────────────────────────────────────────────────────

export const QUALITY_BY_KEY    = Object.fromEntries(CHORD_QUALITIES.map(q => [q.key,      q])) as Record<string, ChordQuality>
export const QUALITY_BY_SUFFIX = Object.fromEntries(CHORD_QUALITIES.map(q => [q.suffix,   q])) as Record<string, ChordQuality>
export const QUALITY_BY_DB     = Object.fromEntries(CHORD_QUALITIES.map(q => [q.dbSuffix, q])) as Record<string, ChordQuality>

/**
 * Replaces CIV in keyDetection.ts.
 * quality key → interval array, e.g. INTERVALS_BY_KEY['min'] = [0, 3, 7]
 */
export const INTERVALS_BY_KEY: Record<string, number[]> =
  Object.fromEntries(CHORD_QUALITIES.map(q => [q.key, q.intervals]))

/**
 * Replaces Q_SUFFIX in keyDetection.ts.
 * quality key → canonical suffix string, e.g. SUFFIX_BY_KEY['min'] = 'm'
 */
export const SUFFIX_BY_KEY: Record<string, string> =
  Object.fromEntries(CHORD_QUALITIES.map(q => [q.key, q.suffix]))

// ── Slash chord suffix registry ───────────────────────────────────────────────

/**
 * All slash / inversion suffixes supported by chords-db.
 * Key = suffix as it appears in a chord name (e.g. '/B' in 'G/B').
 * Value = the chords-db suffix key (identical).
 */
export const SLASH_SUFFIXES: Record<string, string> = {
  '/A':'/A', '/Bb':'/Bb', '/B':'/B', '/C':'/C', '/C#':'/C#',
  '/D':'/D', '/D#':'/D#', '/E':'/E', '/F':'/F', '/F#':'/F#',
  '/G':'/G', '/G#':'/G#',
  'm/B':'m/B', 'm/C':'m/C', 'm/C#':'m/C#', 'm/D':'m/D', 'm/D#':'m/D#',
  'm/E':'m/E', 'm/F':'m/F', 'm/F#':'m/F#', 'm/G':'m/G', 'm/G#':'m/G#',
}

export function isSlashSuffix(suffix: string): boolean {
  return suffix in SLASH_SUFFIXES
}

/** Extracts the bass note from a slash suffix, e.g. '/B' → 'B', 'm/F#' → 'F#' */
export function bassNoteFromSuffix(suffix: string): string | null {
  const m = suffix.match(/\/([A-G][b#]?)$/)
  return m ? m[1] : null
}

/** Returns the human-readable quality label for a suffix, e.g. 'm' → 'minor' */
export function getQualityLabel(suffix: string): string {
  return QUALITY_BY_SUFFIX[suffix]?.label ?? suffix
}

/**
 * Given a pitch class and chord suffix, returns the chords-db lookup keys.
 * Used by chordsDb.ts instead of re-parsing the chord name string.
 *
 * @param pc     Root pitch class (0–11)
 * @param suffix Full chord suffix including slash if present, e.g. '', 'm', 'm7', '/B', 'm/F#'
 */
export function chordToDbKeys(pc: number, suffix: string): { dbKey: string; dbSuffix: string } | null {
  const dbKey = PC_TO_DB_KEY[pc]
  if (!dbKey) return null
  // Check quality registry first (handles all standard suffixes)
  const q = QUALITY_BY_SUFFIX[suffix]
  if (q) return { dbKey, dbSuffix: q.dbSuffix }
  // Check slash suffixes (e.g. '/B', 'm/F#')
  if (suffix in SLASH_SUFFIXES) return { dbKey, dbSuffix: SLASH_SUFFIXES[suffix] }
  return null
}
