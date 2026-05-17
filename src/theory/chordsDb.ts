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

export function getChordVoicings(chordName: string): ChordPosition[] {
  const chord = guitarData.chords
  let root = ""
  let suffix = ""

  const sortedRoots = Object.keys(NOTE_MAP).sort((a, b) => b.length - a.length)
  for (const r of sortedRoots) {
    if (chordName.startsWith(r)) {
      root = r
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
  return match?.positions ?? chordList[0]?.positions ?? []
}
