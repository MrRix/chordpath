/**
 * Key-context-sensitive theory descriptions for the DiagramPanel.
 *
 * Keyed by `${keyContext}:${roman}` where:
 *   keyContext = 'major' | 'minor' | 'mixo'
 *   roman      = the Roman numeral string from DiatonicChordDef.roman
 *
 * 21 entries — 7 scale degrees × 3 key contexts.
 * Copy sourced from Design Framework Section 11.
 */

export type KeyContext = 'major' | 'minor' | 'mixo'

const DESCRIPTIONS: Record<string, string> = {
  // ── G Major context ───────────────────────────────────────────────────────
  'major:I':    'Tonic — home base. The most stable chord in the key. Progressions naturally resolve here.',
  'major:ii':   'Supertonic — gentle tension. Often moves to V to set up a resolution back to the tonic.',
  'major:iii':  'Mediant — connects the tonic to the subdominant. Common moves: iii → IV or iii → vi.',
  'major:IV':   'Subdominant — lifts away from home without strong tension. One of the most natural chord changes in pop and folk.',
  'major:V':    'Dominant — the strongest tension point in the key. Creates a pull that almost always resolves to I.',
  'major:vi':   'Relative minor — shares all notes with the major key. Adds emotional depth without leaving the key.',
  'major:vii°': 'Leading tone chord — highly unstable. Almost always resolves directly to I. Use for dramatic pull.',

  // ── E Minor context ───────────────────────────────────────────────────────
  'minor:i':    'Tonic — home in the minor key. Darker and more restless than a major tonic. Progressions return here.',
  'minor:ii°':  'Supertonic diminished — tense and unstable. Typically moves to III or v to release.',
  'minor:III':  'Relative major — the brightest chord in the minor key. A natural contrast before returning to i.',
  'minor:iv':   'Subdominant — deepens the dark, introspective feel. Very common in ballads and emotional writing.',
  'minor:v':    'Minor dominant — softer tension than a major V chord. Floats rather than pulling hard toward home.',
  'minor:VI':   'Submediant — a brief moment of warmth and brightness before the minor pulls back.',
  'minor:VII':  'Subtonic — adds forward drive. A common sequence: VII → i brings you directly home.',

  // ── D Mixolydian context ──────────────────────────────────────────────────
  'mixo:I':    'Tonic — home in Mixolydian. Sounds major but carries a slightly open, unresolved quality.',
  'mixo:ii':   'Supertonic — a minor chord that adds a touch of melancholy to the otherwise bright mode.',
  'mixo:iii°': 'Mediant diminished — rarely used in Mixolydian. Tense and chromatic against the mode\'s character.',
  'mixo:IV':   'Subdominant — moves naturally to and from the ♭7. A cornerstone of rock and blues writing.',
  'mixo:v':    'Minor dominant — no strong pull home. Keeps the floating, unresolved feel of the mode alive.',
  'mixo:vi':   'Submediant — adds depth and melancholy. Less common in Mixolydian but usable for contrast.',
  'mixo:VII':  'Subtonic — the chord that defines Mixolydian. The gap between I and ♭7 is where the bluesy colour lives.',
}

/**
 * Returns the theory description for a given chord based on its Roman numeral
 * and the key context it was tapped from.
 *
 * @param keyContext  'major' | 'minor' | 'mixo'
 * @param roman       Roman numeral string from DiatonicChordDef.roman
 * @returns Description string, or empty string if no match found.
 */
export function getChordDescription(keyContext: KeyContext, roman: string): string {
  return DESCRIPTIONS[`${keyContext}:${roman}`] ?? ''
}

/**
 * Maps a mode name to a KeyContext value.
 * Used when constructing SelectedChord from a KeyScore row.
 */
export function getKeyContext(modeName: string): KeyContext {
  if (['Major', 'Lydian'].includes(modeName)) return 'major'
  if (['Minor', 'Dorian', 'Phrygian'].includes(modeName)) return 'minor'
  return 'mixo'  // Mixolydian, Locrian
}
