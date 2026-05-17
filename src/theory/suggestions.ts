import { ROOTS, MODES, MAJOR_LIKE, keyChords, scaleNamesForKey, NOTE_SI } from "./keyDetection"

export interface ChordSuggestion {
  chordName:    string
  romanNumeral: string
  reason:       string
  strength:     number
  fnKey:        "tonic" | "sub" | "dom" | "rel"
}

// ─── Patterns (major & minor only — modes use diatonic-only suggestions) ─────

const PATTERNS = [
  { name: "I–V–vi–IV",    genre: "Pop",          pattern: ["I","V","vi","IV"] },
  { name: "I–IV–V",       genre: "Rock/Country",  pattern: ["I","IV","V"] },
  { name: "vi–IV–I–V",   genre: "Pop",           pattern: ["vi","IV","I","V"] },
  { name: "I–vi–IV–V",   genre: "Doo-wop/Pop",  pattern: ["I","vi","IV","V"] },
  { name: "ii–V–I",       genre: "Jazz",          pattern: ["ii","V","I"] },
  { name: "I–IV–vi–V",   genre: "Pop",           pattern: ["I","IV","vi","V"] },
  { name: "i–VII–VI–VII", genre: "Rock/Minor",    pattern: ["i","VII","VI","VII"] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve "G Major" root index */
function rootIndex(key: string): number {
  const ri = NOTE_SI[key] ?? -1
  if (ri !== -1) return ri
  // Tonal sometimes returns enharmonic names not in NOTE_SI — fall back to iteration
  const match = ROOTS.findIndex(r => r === key)
  return match >= 0 ? match : 0
}

/** Mode index by name */
function modeIndex(modeName: string): number {
  const idx = MODES.findIndex(m => m.name === modeName)
  return idx >= 0 ? idx : 0
}

/**
 * Get diatonic triads for a key + mode.
 * Replaces the Tonal-based lookup — now uses our own keyChords engine.
 */
export function getKeyTriads(key: string, modeName: string): string[] {
  const ri = rootIndex(key)
  const mi = modeIndex(modeName)
  return keyChords(ri, mi).map(k => k.name)
}

/** Get scale note names for a key + mode */
export function getKeyScale(key: string, modeName: string): string[] {
  const ri = rootIndex(key)
  const mi = modeIndex(modeName)
  return scaleNamesForKey(ri, mi)
}

/** Map chord name to roman numeral in the given key+mode */
export function getChordRomanNumeral(chordName: string, key: string, modeName: string): string {
  const triads = getKeyTriads(key, modeName)
  const idx = triads.indexOf(chordName)
  if (idx < 0) return ""
  return MODES[modeIndex(modeName)].rm[idx]
}

function chordsToRomanNumerals(chordNames: string[], key: string, modeName: string): string[] {
  const triads = getKeyTriads(key, modeName)
  const mi = modeIndex(modeName)
  const rms = MODES[mi].rm as readonly string[]
  return chordNames.map(ch => {
    const idx = triads.indexOf(ch)
    return idx >= 0 ? rms[idx] : ""
  })
}

function romanToFnKey(roman: string): "tonic" | "sub" | "dom" | "rel" {
  const r = roman.toLowerCase()
  if (r.startsWith("ii") || r.startsWith("iv")) return "sub"
  if (r.startsWith("v")  || r.startsWith("vii")) return "dom"
  if (r === "vi" || r === "iii" || r === "III" || r === "VI") return "rel"
  return "tonic"
}

// ─── Main suggestion engine ───────────────────────────────────────────────────

export function suggestNextChords(
  chordNames: string[],
  key: string,
  modeName: string,
): ChordSuggestion[] {
  const currentRomans = chordsToRomanNumerals(chordNames, key, modeName)
  const triads = getKeyTriads(key, modeName)
  const mi = modeIndex(modeName)
  const rms = [...MODES[mi].rm]
  const suggestions: ChordSuggestion[] = []

  // Pattern matching — only for Major-like and Minor-like modes
  const isMajorLike = MAJOR_LIKE.has(modeName)
  const isMinorLike = !isMajorLike

  if (isMajorLike || isMinorLike) {
    for (const pat of PATTERNS) {
      const isMinorPat = pat.pattern[0].startsWith('i') && pat.pattern[0] !== 'I'
      if (isMajorLike && isMinorPat) continue
      if (isMinorLike && !isMinorPat) continue

      const prefix = pat.pattern.slice(0, currentRomans.length)
      if (
        currentRomans.length > 0 &&
        JSON.stringify(currentRomans) === JSON.stringify(prefix) &&
        currentRomans.length < pat.pattern.length
      ) {
        const nextRoman = pat.pattern[currentRomans.length]
        const idx = rms.indexOf(nextRoman)
        const nextChord = idx >= 0 ? triads[idx] : null
        if (nextChord && !suggestions.find(s => s.chordName === nextChord)) {
          suggestions.push({
            chordName: nextChord,
            romanNumeral: nextRoman,
            reason: `Continues ${pat.name} (${pat.genre})`,
            strength: 5,
            fnKey: romanToFnKey(nextRoman),
          })
        }
      }
    }
  }

  // Fill remaining with diatonic suggestions
  triads.forEach((chord, i) => {
    if (!chordNames.includes(chord) && !suggestions.find(s => s.chordName === chord)) {
      suggestions.push({
        chordName: chord,
        romanNumeral: rms[i],
        reason: `Diatonic to ${key} ${modeName}`,
        strength: 2,
        fnKey: romanToFnKey(rms[i]),
      })
    }
  })

  return suggestions.sort((a, b) => b.strength - a.strength).slice(0, 5)
}

// ─── Pattern detection ────────────────────────────────────────────────────────

export function detectPatternMatch(
  chordNames: string[],
  key: string,
  modeName: string,
) {
  if (!chordNames.length) return null
  const currentRomans = chordsToRomanNumerals(chordNames, key, modeName)
  for (const pat of PATTERNS) {
    const prefix = pat.pattern.slice(0, currentRomans.length)
    if (
      currentRomans.length > 0 &&
      JSON.stringify(currentRomans) === JSON.stringify(prefix)
    ) {
      return {
        name: pat.name,
        genre: pat.genre,
        fullPattern: pat.pattern,
        currentLength: currentRomans.length,
      }
    }
  }
  return null
}
