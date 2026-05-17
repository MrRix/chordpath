/**
 * Pitch-class–based key detection engine.
 * Ported from chordpath_key_detection_with_flags.html.
 *
 * Core idea: instead of matching chord *names* against a triad list,
 * we check whether every pitch class (note) of each chord fits inside
 * the key's scale. This handles 7ths, slash chords, and any quality
 * without needing special-case name normalization.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const ROOTS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'] as const
export type RootName = typeof ROOTS[number]

/** Semitone indices that typically use flat names */
const FLAT_SI = new Set([1, 3, 5, 8, 10])

/** Chromatic pitch-class name lookup */
const SHARPS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLATS  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

/** All enharmonic spellings → semitone index */
export const NOTE_SI: Record<string, number> = {
  C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, 'E#':5, Fb:4,
  F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10,
  B:11, Cb:11, 'B#':0,
}

/** Interval sets (semitones from root) for each chord quality */
export const CIV: Record<string, number[]> = {
  maj:   [0,4,7],
  min:   [0,3,7],
  dim:   [0,3,6],
  aug:   [0,4,8],
  maj7:  [0,4,7,11],
  m7:    [0,3,7,10],
  '7':   [0,4,7,10],
  dim7:  [0,3,6,9],
  m7b5:  [0,3,6,10],
  sus2:  [0,2,7],
  sus4:  [0,5,7],
}

// fnKey assignments per scale degree for each mode
// tonic=I/i, sub=IV/ii family, dom=V/vii family, rel=vi/III (relative)
const MODE_FN_KEYS = {
  Major:      ['tonic','sub','rel',  'sub','dom','rel','dom'],
  Dorian:     ['tonic','sub','rel',  'sub','dom','dom','rel'],
  Phrygian:   ['tonic','dom','rel',  'sub','dom','rel','sub'],
  Lydian:     ['tonic','dom','rel',  'dom','dom','rel','sub'],
  Mixolydian: ['tonic','sub','dom',  'sub','dom','rel','rel'],
  Minor:      ['tonic','dom','rel',  'sub','dom','rel','sub'],
  Locrian:    ['dom',  'rel','tonic','sub','dom','rel','sub'],
} as const

export interface ModeDefinition {
  name: string
  sub:  string         // e.g. "Ionian"
  iv:   readonly number[]    // scale intervals from root
  q:    readonly string[]    // chord quality per degree
  rm:   readonly string[]    // roman numeral per degree
  fnKeys: readonly string[]  // tonic/sub/dom/rel per degree
  ch:   string         // character description
}

export const MODES: ModeDefinition[] = [
  { name:'Major',      sub:'Ionian',   iv:[0,2,4,5,7,9,11], q:['maj','min','min','maj','maj','min','dim'], rm:['I','ii','iii','IV','V','vi','vii°'], fnKeys:MODE_FN_KEYS.Major,      ch:'Bright & resolved' },
  { name:'Dorian',     sub:'',         iv:[0,2,3,5,7,9,10], q:['min','min','maj','maj','min','dim','maj'], rm:['i','ii','III','IV','v','vi°','VII'], fnKeys:MODE_FN_KEYS.Dorian,     ch:'Minor with raised sixth — soulful' },
  { name:'Phrygian',   sub:'',         iv:[0,1,3,5,7,8,10], q:['min','maj','maj','min','dim','maj','min'], rm:['i','II','III','iv','v°','VI','vii'],  fnKeys:MODE_FN_KEYS.Phrygian,   ch:'Dark, Spanish feel' },
  { name:'Lydian',     sub:'',         iv:[0,2,4,6,7,9,11], q:['maj','maj','min','dim','maj','min','min'], rm:['I','II','iii','iv°','V','vi','vii'],  fnKeys:MODE_FN_KEYS.Lydian,     ch:'Bright with a raised fourth — ethereal' },
  { name:'Mixolydian', sub:'',         iv:[0,2,4,5,7,9,10], q:['maj','min','dim','maj','min','min','maj'], rm:['I','ii','iii°','IV','v','vi','VII'],  fnKeys:MODE_FN_KEYS.Mixolydian, ch:'Bluesy' },
  { name:'Minor',      sub:'Aeolian',  iv:[0,2,3,5,7,8,10], q:['min','dim','maj','min','min','maj','maj'], rm:['i','ii°','III','iv','v','VI','VII'],  fnKeys:MODE_FN_KEYS.Minor,      ch:'Dark & introspective' },
  { name:'Locrian',    sub:'',         iv:[0,1,3,5,6,8,10], q:['dim','maj','min','min','maj','maj','min'], rm:['i°','II','iii','iv','V','VI','vii'],  fnKeys:MODE_FN_KEYS.Locrian,    ch:'Unstable, tense' },
]

/** Modes considered "major-flavored" (for compat with suggestions/patterns) */
export const MAJOR_LIKE = new Set(['Major','Lydian','Mixolydian'])
/** Modes considered "minor-flavored" */
export const MINOR_LIKE = new Set(['Minor','Dorian','Phrygian','Locrian'])

// ─── Chord parsing ────────────────────────────────────────────────────────────

export interface ParsedChord {
  name:         string
  root:         string
  suf:          string
  ri:           number       // root pitch class 0–11
  q:            string       // quality key (into CIV)
  pcs:          number[]     // pitch classes in chord
  bass:         string | null
  bassAdded:    boolean      // true if bass note was a new pitch class
  unrecognized: boolean      // true if suffix is not in our vocabulary
  hint:         string       // human-readable hint for unrecognized suffixes
}

function suffixHint(root: string, suf: string): string {
  const acc = suf.match(/^m([#b])(.*)/)
  if (acc) return `accidental before quality — did you mean ${root}${acc[1]}m${acc[2]}?`
  if (/^(9|11|13|maj9|m9|add9|maj13|m11|6|m6|69)$/i.test(suf)) return `extensions not yet supported`
  if (/^(maj|major)$/i.test(suf)) return `use just the root for major, e.g. ${root}`
  return `interpreted as ${root} major`
}

export function parseChord(raw: string): ParsedChord | null {
  const s = raw.trim()
  const m = s.match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/)
  if (!m) return null
  const root = m[1], suf = m[2].trim(), bassStr = m[3] ?? null
  const ri = NOTE_SI[root] ?? -1
  if (ri === -1) return null

  let q: string, unrecognized = false, hint = ''
  if      (suf === '')                                           q = 'maj'
  else if (/^maj7$/i.test(suf) || suf === 'M7')                q = 'maj7'
  else if (/^m7b5$/i.test(suf) || /^[øØ]/.test(suf))          q = 'm7b5'
  else if (/^dim7$/i.test(suf))                                 q = 'dim7'
  else if (/^dim$/i.test(suf))                                  q = 'dim'
  else if (/^aug$/i.test(suf))                                  q = 'aug'
  else if (/^m7$/i.test(suf))                                   q = 'm7'
  else if (/^7$/.test(suf))                                     q = '7'
  else if (/^sus2$/i.test(suf))                                 q = 'sus2'
  else if (/^sus4$/i.test(suf))                                 q = 'sus4'
  else if (/^m$|^min$/i.test(suf))                              q = 'min'
  else { q = 'maj'; unrecognized = true; hint = suffixHint(root, suf) }

  const ivs = CIV[q] ?? [0, 4, 7]
  let pcs = ivs.map(i => (ri + i) % 12)

  let bassAdded = false
  if (bassStr) {
    const bi = NOTE_SI[bassStr] ?? -1
    if (bi !== -1 && !pcs.includes(bi)) { pcs = [...pcs, bi]; bassAdded = true }
  }

  return { name: s, root, suf, ri, q, pcs, bass: bassStr ?? null, bassAdded, unrecognized, hint }
}

// ─── Diatonic chord list ──────────────────────────────────────────────────────

export interface DiatonicChordDef {
  name:   string    // e.g. "Em"
  nn:     string    // note name, e.g. "E"
  ni:     number    // pitch class of root
  q:      string    // quality key
  roman:  string    // e.g. "vi"
  fnKey:  string    // tonic | sub | dom | rel
  pcs:    number[]  // chord's pitch classes
}

export function noteName(si: number, useFlat: boolean): string {
  return (useFlat ? FLATS : SHARPS)[((si % 12) + 12) % 12]
}

export function keyChords(ri: number, modeIdx: number): DiatonicChordDef[] {
  const mode = MODES[modeIdx]
  const uf = FLAT_SI.has(ri)
  return mode.iv.map((iv, d) => {
    const ni = (ri + iv) % 12
    const nn = noteName(ni, uf)
    const qq = mode.q[d]
    const sfx = qq === 'maj' ? '' : qq === 'min' ? 'm' : qq
    return {
      name:  nn + sfx,
      nn, ni,
      q:     qq,
      roman: mode.rm[d],
      fnKey: mode.fnKeys[d],
      pcs:   (CIV[qq] ?? [0,4,7]).map(i => (ni + i) % 12),
    }
  })
}

/** Scale note names for a given root index + mode */
export function scaleNamesForKey(ri: number, modeIdx: number): string[] {
  const uf = FLAT_SI.has(ri)
  return MODES[modeIdx].iv.map(iv => noteName((ri + iv) % 12, uf))
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface KeyScore {
  r:        number
  modeIdx:  number
  key:      string     // "G Major"
  rootName: string     // "G"
  modeName: string     // "Major"
  score:    number     // how many chords fit
  tot:      number     // total chords
  fits:     string[]   // chord names that fit
  misses:   string[]   // chord names that don't fit (borrowed/chromatic)
  kc:       DiatonicChordDef[]
  ss:       Set<number>  // scale pitch-class set
}

export function scoreAllKeys(chords: ParsedChord[]): KeyScore[] {
  const out: KeyScore[] = []
  for (let r = 0; r < 12; r++) {
    for (let mi = 0; mi < MODES.length; mi++) {
      const mode = MODES[mi]
      const ss = new Set(mode.iv.map(i => (r + i) % 12))
      const fits: string[] = [], misses: string[] = []
      chords.forEach(c => {
        ;(c.pcs.every(p => ss.has(p)) ? fits : misses).push(c.name)
      })
      out.push({
        r, modeIdx: mi,
        key:      ROOTS[r] + ' ' + mode.name,
        rootName: ROOTS[r],
        modeName: mode.name,
        score: fits.length, tot: chords.length,
        fits, misses,
        kc: keyChords(r, mi),
        ss,
      })
    }
  }
  return out.sort((a, b) => b.score - a.score || a.r - b.r || a.modeIdx - b.modeIdx)
}

// ─── Final detection with tiebreakers ────────────────────────────────────────

/** Preference order when multiple keys tie on score (lower = more preferred) */
const MODE_PREF: Record<string, number> = {
  Major: 0, Lydian: 1, Mixolydian: 2, Dorian: 3, Minor: 4, Phrygian: 5, Locrian: 6,
}

export interface KeyDetectionResult {
  rootName:   string
  modeName:   string
  modeIdx:    number
  key:        string       // "G Major"
  score:      number
  tot:        number
  kc:         DiatonicChordDef[]
  misses:     string[]     // non-diatonic chord names
  tiedWith:   string[]     // other keys with same score
  confidence: number       // 0–5
  /** Compat: "major" for major-flavored modes, "minor" otherwise */
  modeCompat: 'major' | 'minor'
  modeChar:   string       // e.g. "Bright, resolved, happy"
}

export function detectKey(chords: ParsedChord[]): KeyDetectionResult {
  if (!chords.length) {
    const kc = keyChords(0, 0)
    return { rootName:'C', modeName:'Major', modeIdx:0, key:'C Major',
      score:0, tot:0, kc, misses:[], tiedWith:[], confidence:0,
      modeCompat:'major', modeChar: MODES[0].ch }
  }

  const ranked = scoreAllKeys(chords)
  const topScore = ranked[0].score
  const tied = ranked.filter(r => r.score === topScore)

  // Tiebreaker scoring
  const firstRootPc = chords[0].ri
  const allRootPcs  = new Set(chords.map(c => c.ri))

  const tbScored = tied.map(r => {
    const tonicPc = r.kc[0].ni
    let tb = 0
    if (allRootPcs.has(tonicPc)) tb += 2    // tonic appears in progression
    if (firstRootPc === tonicPc)  tb += 1   // first chord IS the tonic
    tb -= (MODE_PREF[r.modeName] ?? 10) * 0.01  // prefer commoner modes
    return { ...r, tb }
  })
  tbScored.sort((a, b) => b.tb - a.tb || a.r - b.r)

  const best = tbScored[0]
  const tiedWith = tied.filter(r => r !== best).map(r => r.key)
  const modeCompat: 'major' | 'minor' = MAJOR_LIKE.has(best.modeName) ? 'major' : 'minor'

  return {
    rootName:   best.rootName,
    modeName:   best.modeName,
    modeIdx:    best.modeIdx,
    key:        best.key,
    score:      best.score,
    tot:        best.tot,
    kc:         best.kc,
    misses:     best.misses,
    tiedWith:   tiedWith.slice(0, 5),
    confidence: best.tot === 0 ? 0 : Math.round((best.score / best.tot) * 5),
    modeCompat,
    modeChar:   MODES[best.modeIdx].ch,
  }
}

// ─── Roman numeral lookup from detection result ───────────────────────────────

export function romanFor(chord: ParsedChord, result: KeyDetectionResult): string {
  const match = result.kc.find(k => k.ni === chord.ri)
  return match?.roman ?? '?'
}
