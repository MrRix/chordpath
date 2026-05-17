import guitarData from "@tombatossals/chords-db/lib/guitar.json"

export interface ChordPosition {
  frets: number[]
  fingers: number[]
  baseFret: number
  barres: number[]
}

const NOTE_MAP: Record<string, string> = {
  "C": "C", "C#": "Csharp", "Db": "Csharp",
  "D": "D", "D#": "Eb",    "Eb": "Eb",
  "E": "E", "F": "F",      "F#": "Fsharp",
  "Gb": "Fsharp", "G": "G", "G#": "Ab", "Ab": "Ab",
  "A": "A", "A#": "Bb",    "Bb": "Bb", "B": "B",
}

const SUFFIX_MAP: Record<string, string> = {
  "": "major",
  "m": "minor",
  "maj7": "maj7",
  "m7": "m7",
  "7": "7",
  "dim": "dim",
  "dim7": "dim7",
  "aug": "aug",
  "sus2": "sus2",
  "sus4": "sus4",
  "add9": "add9",
  "maj9": "maj9",
  "m9": "m9",
  "9": "9",
  "11": "11",
  "13": "13",
  "6": "6",
  "m6": "m6",
}

// ── Voicing normalisation ─────────────────────────────────────────────────────
// chords-db stores some barre chords at baseFret=1 even when the lowest fret
// pressed is 2+ (e.g. Bm: baseFret=1, frets=[2,2,4,4,3,2]).  This makes
// SVGuitarChord draw the nut even though no open strings are used, which looks
// wrong.  Shift such voicings so baseFret equals the lowest pressed fret.
function normalizePosition(v: ChordPosition): ChordPosition {
  const hasOpen = v.frets.some(f => f === 0)
  if (v.baseFret !== 1 || hasOpen) return v                 // nothing to fix

  const activeFrets = v.frets.filter(f => f > 0)
  if (!activeFrets.length) return v

  const minFret = Math.min(...activeFrets)
  if (minFret <= 1) return v                                 // already correct

  const shift = minFret - 1
  return {
    ...v,
    baseFret: v.baseFret + shift,                           // e.g. 1 → 2
    frets:    v.frets.map(f => f > 0 ? f - shift : f),     // [2,2,4,4,3,2] → [1,1,3,3,2,1]
    barres:   v.barres.map(b => b - shift),                  // [2] → [1]
  }
}

// ── Voicing ranking ───────────────────────────────────────────────────────────
// Score each voicing — lower = shown first.
// Priority: open-position shapes > low barre chords > everything else.
function voicingScore(v: ChordPosition): number {
  const hasOpen    = v.frets.some(f => f === 0)
  const mutedCount = v.frets.filter(f => f === -1).length
  const hasBarre   = v.barres.length > 0

  if (hasOpen) {
    // True open-position chord; prefer fewer muted strings, lower baseFret
    return v.baseFret * 2 + mutedCount
  }
  if (hasBarre) {
    // Barre chord — lower fret position first
    return 8 + v.baseFret + mutedCount * 0.5
  }
  // Closed non-barre shapes (e.g. high-neck partial voicings)
  return 15 + v.baseFret + mutedCount
}

// ── Public API ────────────────────────────────────────────────────────────────
export function getChordVoicings(chordName: string): ChordPosition[] {
  const chord = guitarData.chords
  let root   = ""
  let suffix = ""

  const sortedRoots = Object.keys(NOTE_MAP).sort((a, b) => b.length - a.length)
  for (const r of sortedRoots) {
    if (chordName.startsWith(r)) {
      root   = r
      suffix = chordName.slice(r.length)
      break
    }
  }

  if (!root) return []
  const dbKey = NOTE_MAP[root]
  if (!dbKey) return []

  const chordList = (chord as Record<string, { suffix: string; positions: ChordPosition[] }[]>)[dbKey]
  if (!chordList) return []

  const dbSuffix = SUFFIX_MAP[suffix] ?? suffix
  const match = chordList.find(c => c.suffix === dbSuffix || c.suffix === (suffix || "major"))
  const raw   = match?.positions ?? chordList[0]?.positions ?? []

  // Normalise then sort — most typical shape first, up to 4 shown
  return raw
    .map(normalizePosition)
    .sort((a, b) => voicingScore(a) - voicingScore(b))
    .slice(0, 4)
}
