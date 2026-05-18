/**
 * Pitch-class–based key detection engine.
 * Ported from chordpath_key_detection_with_flags.html.
 *
 * Core idea: instead of matching chord *names* against a triad list,
 * we check whether every pitch class (note) of each chord fits inside
 * the key's scale. This handles 7ths, slash chords, and any quality
 * without needing special-case name normalization.
 */

import {
  ROOTS as _ROOTS,
  NOTE_TO_PC,
  FLAT_PC,
  INTERVALS_BY_KEY,
  SUFFIX_BY_KEY,
} from './chordRegistry'

// ── Re-exports for backward compatibility ────────────────────────────────────

export { ROOTS } from './chordRegistry'
export type { RootName } from './chordRegistry'

/**
 * NOTE_SI — backward compat alias for NOTE_TO_PC from chordRegistry.
 * All enharmonic spellings → semitone index 0–11.
 * Imported by useAppStore and suggestions — do not remove.
 */
export const NOTE_SI = NOTE_TO_PC

/**
 * CIV — backward compat alias for INTERVALS_BY_KEY from chordRegistry.
 * quality key → interval array.
 */
export const CIV = INTERVALS_BY_KEY

// ── Internal chromatic name arrays (used by noteName) ────────────────────────

const SHARPS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLATS  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// fnKey assignments per scale degree for each mode
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
  name:   string
  sub:    string
  iv:     readonly number[]
  q:      readonly string[]
  rm:     readonly string[]
  fnKeys: readonly string[]
  ch:     string
}

export const MODES: ModeDefinition[] = [
  { name:'Major',      sub:'Ionian',   iv:[0,2,4,5,7,9,11], q:['maj','min','min','maj','maj','min','dim'], rm:['I','ii','iii','IV','V','vi','vii°'],  fnKeys:MODE_FN_KEYS.Major,      ch:'Bright & resolved' },
  { name:'Dorian',     sub:'',         iv:[0,2,3,5,7,9,10], q:['min','min','maj','maj','min','dim','maj'], rm:['i','ii','III','IV','v','vi°','VII'],  fnKeys:MODE_FN_KEYS.Dorian,     ch:'Minor with raised sixth — soulful' },
  { name:'Phrygian',   sub:'',         iv:[0,1,3,5,7,8,10], q:['min','maj','maj','min','dim','maj','min'], rm:['i','II','III','iv','v°','VI','vii'],  fnKeys:MODE_FN_KEYS.Phrygian,   ch:'Dark, Spanish feel' },
  { name:'Lydian',     sub:'',         iv:[0,2,4,6,7,9,11], q:['maj','maj','min','dim','maj','min','min'], rm:['I','II','iii','iv°','V','vi','vii'],  fnKeys:MODE_FN_KEYS.Lydian,     ch:'Bright with a raised fourth — ethereal' },
  { name:'Mixolydian', sub:'',         iv:[0,2,4,5,7,9,10], q:['maj','min','dim','maj','min','min','maj'], rm:['I','ii','iii°','IV','v','vi','VII'],  fnKeys:MODE_FN_KEYS.Mixolydian, ch:'Bluesy' },
  { name:'Minor',      sub:'Aeolian',  iv:[0,2,3,5,7,8,10], q:['min','dim','maj','min','min','maj','maj'], rm:['i','ii°','III','iv','v','VI','VII'],  fnKeys:MODE_FN_KEYS.Minor,      ch:'Dark & introspective' },
  { name:'Locrian',    sub:'',         iv:[0,1,3,5,6,8,10], q:['dim','maj','min','min','maj','maj','min'], rm:['i°','II','iii','iv','V','VI','vii'],  fnKeys:MODE_FN_KEYS.Locrian,    ch:'Unstable, tense' },
]

export const MAJOR_LIKE = new Set(['Major','Lydian','Mixolydian'])
export const MINOR_LIKE = new Set(['Minor','Dorian','Phrygian','Locrian'])

// ── Chord parsing ─────────────────────────────────────────────────────────────

export interface ParsedChord {
  name:         string
  root:         string
  suf:          string
  ri:           number       // root pitch class 0–11
  q:            string       // quality key (matches INTERVALS_BY_KEY)
  pcs:          number[]     // pitch classes in chord
  bass:         string | null
  bassAdded:    boolean
  unrecognized: boolean
  hint:         string
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
  const ri = NOTE_TO_PC[root] ?? -1
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
  else if (/^9$/.test(suf))                                     q = '9'
  else if (/^maj9$/i.test(suf))                                 q = 'maj9'
  else if (/^m9$/i.test(suf))                                   q = 'm9'
  else if (/^m11$/i.test(suf))                                  q = 'm11'
  else if (/^11$/.test(suf))                                    q = '11'
  else if (/^13$/.test(suf))                                    q = '13'
  else if (/^6$/.test(suf))                                     q = '6'
  else if (/^m6$/i.test(suf))                                   q = 'm6'
  else if (/^add9$/i.test(suf))                                 q = 'add9'
  else if (/^sus2$/i.test(suf))                                 q = 'sus2'
  else if (/^sus4$/i.test(suf))                                 q = 'sus4'
  else if (/^m$|^min$/i.test(suf))                              q = 'min'
  else { q = 'maj'; unrecognized = true; hint = suffixHint(root, suf) }

  const ivs = INTERVALS_BY_KEY[q] ?? [0, 4, 7]
  let pcs = ivs.map(i => (ri + i) % 12)

  let bassAdded = false
  if (bassStr) {
    const bi = NOTE_TO_PC[bassStr] ?? -1
    if (bi !== -1 && !pcs.includes(bi)) { pcs = [...pcs, bi]; bassAdded = true }
  }

  const canonicalSuf = unrecognized ? suf : (SUFFIX_BY_KEY[q] ?? suf)
  const canonicalName = root + canonicalSuf + (bassStr ? '/' + bassStr : '')

  return { name: canonicalName, root, suf, ri, q, pcs, bass: bassStr ?? null, bassAdded, unrecognized, hint }
}

// ── Diatonic chord list ───────────────────────────────────────────────────────

export interface DiatonicChordDef {
  name:   string
  nn:     string
  ni:     number
  q:      string
  roman:  string
  fnKey:  string
  pcs:    number[]
}

export function noteName(si: number, useFlat: boolean): string {
  return (useFlat ? FLATS : SHARPS)[((si % 12) + 12) % 12]
}

export function keyChords(ri: number, modeIdx: number): DiatonicChordDef[] {
  const mode = MODES[modeIdx]
  const uf = FLAT_PC.has(ri)
  return mode.iv.map((iv, d) => {
    const ni = (ri + iv) % 12
    const nn = noteName(ni, uf)
    const qq = mode.q[d]
    const sfx = SUFFIX_BY_KEY[qq] ?? qq
    return {
      name:  nn + sfx,
      nn, ni,
      q:     qq,
      roman: mode.rm[d],
      fnKey: mode.fnKeys[d],
      pcs:   (INTERVALS_BY_KEY[qq] ?? [0,4,7]).map(i => (ni + i) % 12),
    }
  })
}

export function scaleNamesForKey(ri: number, modeIdx: number): string[] {
  const uf = FLAT_PC.has(ri)
  return MODES[modeIdx].iv.map(iv => noteName((ri + iv) % 12, uf))
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface KeyScore {
  r:        number
  modeIdx:  number
  key:      string
  rootName: string
  modeName: string
  score:    number
  tot:      number
  fits:     string[]
  misses:   string[]
  kc:       DiatonicChordDef[]
  ss:       Set<number>
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
        key:      _ROOTS[r] + ' ' + mode.name,
        rootName: _ROOTS[r],
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

// ── Final detection with tiebreakers ─────────────────────────────────────────

const MODE_PREF: Record<string, number> = {
  Major: 0, Lydian: 1, Mixolydian: 2, Dorian: 3, Minor: 4, Phrygian: 5, Locrian: 6,
}

export interface KeyDetectionResult {
  rootName:   string
  modeName:   string
  modeIdx:    number
  key:        string
  score:      number
  tot:        number
  kc:         DiatonicChordDef[]
  misses:     string[]
  tiedWith:   string[]
  confidence: number
  modeCompat: 'major' | 'minor'
  modeChar:   string
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

  const firstRootPc = chords[0].ri
  const allRootPcs  = new Set(chords.map(c => c.ri))

  const tbScored = tied.map(r => {
    const tonicPc = r.kc[0].ni
    let tb = 0
    if (allRootPcs.has(tonicPc)) tb += 2
    if (firstRootPc === tonicPc)  tb += 1
    tb -= (MODE_PREF[r.modeName] ?? 10) * 0.01
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

// ── Roman numeral lookup ──────────────────────────────────────────────────────

export function romanFor(chord: ParsedChord, result: KeyDetectionResult): string {
  const match = result.kc.find(k => k.ni === chord.ri)
  return match?.roman ?? '?'
}
