import { create } from "zustand"
import { persist } from "zustand/middleware"
import { parseChord, detectKey, keyChords, scaleNamesForKey, scoreAllKeys, NOTE_SI, ROOTS } from "../theory/keyDetection"
import type { DiatonicChordDef, KeyScore } from "../theory/keyDetection"
import type { ChordSuggestion } from "../theory/suggestions"
import { suggestNextChords, detectPatternMatch, getChordRomanNumeral, getKeyTriads, getKeyScale } from "../theory/suggestions"

type InputMode = "name" | "board"
type Theme = "studio" | "canvas"

export type KeyContext = 'major' | 'minor' | 'mixo'

export interface SelectedChord {
  name:       string
  roman:      string
  keyContext: KeyContext
  keyName:    string
}

export interface FretPosition { string: number; fret: number }

export interface ProgressionSlot {
  id: string
  chordName: string | null
  inputMode: InputMode
  boardPositions: FretPosition[]
  romanNumeral: string | null
  chordFunction: "tonic" | "subdominant" | "dominant" | "relative" | null
  voicingIndex: number
  unrecognized: boolean   // suffix wasn't in vocabulary — chord treated as major
  hint: string            // human-readable suggestion, e.g. "did you mean C#m?"
}

export interface DiatonicChord {
  chordName: string
  romanNumeral: string
  chordFunction: string
  fnKey: string
  inProgression: boolean
}

export interface PatternMatch {
  name: string
  genre: string
  fullPattern: string[]
  currentLength: number
}

export interface SavedProgression {
  id: string
  label: string
  slots: ProgressionSlot[]
}

interface AppState {
  theme: Theme
  globalFretPositions: FretPosition[]
  globalDetectedChord: string | null
  progression: ProgressionSlot[]
  autoDetectKey: boolean
  manualKey: string | null
  inferredKey: string | null
  /** Full mode name: "Major", "Minor", "Dorian", "Mixolydian", etc. */
  inferredMode: string
  keyToUse: string | null
  scaleNotes: string[]
  suggestions: ChordSuggestion[]
  diatonicChords: DiatonicChord[]
  patternMatch: PatternMatch | null
  confidence: number
  /** Chords in progression that don't fit the detected key (borrowed / chromatic) */
  borrowedChords: string[]
  /** Keys that tied with the top result */
  tiedKeys: string[]
  expandedSuggestion: string | null
  voicingPanelIndex: number
  savedProgressions: SavedProgression[]
  isLooping: boolean
  /** Top 3 key matches from scoreAllKeys — drives the KeyRows palette display */
  topKeys: KeyScore[]
  /** Currently tapped chord in the palette — drives DiagramPanel */
  selectedChord: SelectedChord | null
  /** Whether the fretboard overlay panel is open */
  fretboardPanelOpen: boolean

  setTheme: (theme: Theme) => void
  tapGlobalFret: (string: number, fret: number) => void
  clearGlobalFretboard: () => void
  setGlobalDetectedChord: (chord: string | null) => void
  addChordToProgression: (chordName: string, unrecognized?: boolean, hint?: string) => void
  createEmptySlot: () => void
  setSlotChordName: (slotId: string, chordName: string) => void
  removeChordFromProgression: (slotId: string) => void
  setSlotInputMode: (slotId: string, mode: InputMode) => void
  tapSlotFret: (slotId: string, stringIdx: number, fret: number) => void
  clearSlotFretboard: (slotId: string) => void
  setSlotVoicingIndex: (slotId: string, index: number) => void
  reorderSlots: (fromIndex: number, toIndex: number) => void
  clearProgression: () => void
  setManualKey: (key: string | null) => void
  setAutoDetect: (on: boolean) => void
  expandSuggestion: (chordName: string | null) => void
  setVoicingPanelIndex: (index: number) => void
  saveProgression: (label: string) => void
  loadProgression: (id: string) => void
  deleteProgression: (id: string) => void
  setLooping: (on: boolean) => void
  setSelectedChord: (chord: SelectedChord | null) => void
  clearSelectedChord: () => void
  setFretboardOpen: (open: boolean) => void
  resetFretboardToOpen: () => void
}

function fnKeyToChordFunction(fnKey: string): "tonic" | "subdominant" | "dominant" | "relative" | null {
  switch (fnKey) {
    case "tonic": return "tonic"
    case "sub":   return "subdominant"
    case "dom":   return "dominant"
    case "rel":   return "relative"
    default:      return null
  }
}

function computeDerived(
  slots: ProgressionSlot[],
  autoDetectKey: boolean,
  manualKey: string | null,
) {
  const chordNames = slots.map(s => s.chordName).filter(Boolean) as string[]

  // ── Key detection ──────────────────────────────────────────────────────────
  // Parse each chord into pitch classes, then run the scoring engine.
  const parsedChords = chordNames
    .map(n => parseChord(n))
    .filter((c): c is NonNullable<typeof c> => c !== null)

  const detected = detectKey(parsedChords)

  // When key is manually locked, override root but keep Major mode.
  let keyToUse:  string
  let modeName:  string
  let modeIdx:   number

  if (autoDetectKey) {
    keyToUse = detected.rootName
    modeName = detected.modeName
    modeIdx  = detected.modeIdx
  } else {
    // manualKey is always "X major" or "X minor" from the dropdown
    const parts   = (manualKey ?? "C major").split(" ")
    keyToUse      = parts[0] ?? "C"
    const mManual = parts[1] ?? "major"
    modeName      = mManual.charAt(0).toUpperCase() + mManual.slice(1)  // "major" → "Major"
    modeIdx       = modeName === "Minor" ? 5 : 0   // 0=Major, 5=Minor
  }

  // Resolve root index
  const ri = NOTE_SI[keyToUse] ?? ROOTS.indexOf(keyToUse as never) ?? 0

  // ── Scale notes ────────────────────────────────────────────────────────────
  const scaleNotes = scaleNamesForKey(ri, modeIdx)

  // ── Diatonic chord set ─────────────────────────────────────────────────────
  const kc: DiatonicChordDef[] = keyChords(ri, modeIdx)

  const diatonicChords: DiatonicChord[] = kc.map(k => ({
    chordName:     k.name,
    romanNumeral:  k.roman,
    chordFunction: k.roman,
    fnKey:         k.fnKey,
    inProgression: chordNames.includes(k.name),
  }))

  // ── Suggestions ────────────────────────────────────────────────────────────
  const suggestions = chordNames.length
    ? suggestNextChords(chordNames, keyToUse, modeName)
    : []

  // ── Pattern match ──────────────────────────────────────────────────────────
  const patternMatch = chordNames.length
    ? detectPatternMatch(chordNames, keyToUse, modeName)
    : null

  // ── Per-slot roman numerals & function labels ──────────────────────────────
  const updatedSlots = slots.map(slot => {
    if (!slot.chordName) return slot
    const roman = getChordRomanNumeral(slot.chordName, keyToUse, modeName)
    const di = diatonicChords.find(d => d.chordName === slot.chordName)
    return {
      ...slot,
      romanNumeral:  roman || null,
      chordFunction: di ? fnKeyToChordFunction(di.fnKey) : null,
    }
  })

  // ── Top keys for KeyRows palette (up to 8, including partial matches) ────
  // Primary sort: score descending. Within each score tier, apply the same
  // tiebreaker as detectKey so the home key always appears first.
  // Keys with score=0 are excluded — they share no chords with the progression.
  const MODE_PREF: Record<string, number> = {
    Major: 0, Lydian: 1, Mixolydian: 2, Dorian: 3, Minor: 4, Phrygian: 5, Locrian: 6,
  }
  let topKeys: ReturnType<typeof scoreAllKeys> = []
  if (parsedChords.length > 0) {
    const firstRootPc = parsedChords[0].ri
    const allRootPcs  = new Set(parsedChords.map(c => c.ri))
    const ranked = scoreAllKeys(parsedChords)
    topKeys = ranked
      .filter(r => r.score > 0)
      .map(r => {
        const tonicPc = r.kc[0].ni
        let tb = 0
        if (allRootPcs.has(tonicPc)) tb += 2
        if (firstRootPc === tonicPc)  tb += 1
        tb -= (MODE_PREF[r.modeName] ?? 10) * 0.01
        return { ...r, _tb: tb }
      })
      .sort((a, b) => b.score - a.score || (b as any)._tb - (a as any)._tb)
      .slice(0, 8)
  }

  return {
    inferredKey:    keyToUse,
    inferredMode:   modeName,
    keyToUse,
    scaleNotes,
    suggestions,
    diatonicChords,
    patternMatch,
    confidence:     autoDetectKey ? detected.confidence : 5,
    borrowedChords: autoDetectKey ? detected.misses : [],
    tiedKeys:       autoDetectKey ? detected.tiedWith : [],
    progression:    updatedSlots,
    topKeys,
  }
}

function makeSlot(chordName: string | null = null, unrecognized = false, hint = ''): ProgressionSlot {
  return {
    id: Math.random().toString(36).slice(2),
    chordName,
    inputMode: "name",
    boardPositions: [],
    romanNumeral: null,
    chordFunction: null,
    voicingIndex: 0,
    unrecognized,
    hint,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "canvas",
      globalFretPositions: [],
      globalDetectedChord: null,
      progression: [],
      autoDetectKey: true,
      manualKey: null,
      inferredKey: "C",
      inferredMode: "Major",
      keyToUse: "C",
      scaleNotes: scaleNamesForKey(0, 0),  // C Major
      suggestions: [],
      diatonicChords: [],
      patternMatch: null,
      confidence: 0,
      borrowedChords: [],
      tiedKeys: [],
      expandedSuggestion: null,
      voicingPanelIndex: 0,
      savedProgressions: [],
      isLooping: false,
      topKeys: [],
      selectedChord: null,
      fretboardPanelOpen: false,

      setTheme: (theme) => set({ theme }),

      tapGlobalFret: (str, fret) => set(state => {
        if (fret === -1) {
          return { globalFretPositions: state.globalFretPositions.filter(p => p.string !== str) }
        }
        const existing = state.globalFretPositions.find(p => p.string === str)
        const globalFretPositions = existing
          ? state.globalFretPositions.map(p => p.string === str ? { string: str, fret } : p)
          : [...state.globalFretPositions, { string: str, fret }]
        return { globalFretPositions }
      }),

      clearGlobalFretboard: () => set({ globalFretPositions: [], globalDetectedChord: null }),

      setGlobalDetectedChord: (chord) => set({ globalDetectedChord: chord }),

      addChordToProgression: (chordName, unrecognized = false, hint = '') => set(state => {
        if (state.progression.length >= 5) return state
        const newSlots = [...state.progression, makeSlot(chordName, unrecognized, hint)]
        return { ...computeDerived(newSlots, state.autoDetectKey, state.manualKey) }
      }),

      createEmptySlot: () => set(state => {
        if (state.progression.length >= 5) return state
        return { progression: [...state.progression, makeSlot(null)] }
      }),

      setSlotChordName: (slotId, chordName) => set(state => {
        const newSlots = state.progression.map(s =>
          s.id === slotId ? { ...s, chordName } : s
        )
        return { ...computeDerived(newSlots, state.autoDetectKey, state.manualKey) }
      }),

      removeChordFromProgression: (slotId) => set(state => {
        const newSlots = state.progression.filter(s => s.id !== slotId)
        return { ...computeDerived(newSlots, state.autoDetectKey, state.manualKey) }
      }),

      setSlotInputMode: (slotId, mode) => set(state => ({
        progression: state.progression.map(s => s.id === slotId ? { ...s, inputMode: mode } : s)
      })),

      tapSlotFret: (slotId, stringIdx, fret) => set(state => {
        const newSlots = state.progression.map(s => {
          if (s.id !== slotId) return s
          const existing = s.boardPositions.find(p => p.string === stringIdx)
          const boardPositions = existing
            ? s.boardPositions.map(p => p.string === stringIdx ? { string: stringIdx, fret } : p)
            : [...s.boardPositions, { string: stringIdx, fret }]
          return { ...s, boardPositions }
        })
        return { progression: newSlots }
      }),

      clearSlotFretboard: (slotId) => set(state => ({
        progression: state.progression.map(s => s.id === slotId
          ? { ...s, boardPositions: [], chordName: null }
          : s)
      })),

      setSlotVoicingIndex: (slotId, index) => set(state => ({
        progression: state.progression.map(s => s.id === slotId ? { ...s, voicingIndex: index } : s)
      })),

      reorderSlots: (fromIndex, toIndex) => set(state => {
        const newSlots = [...state.progression]
        const [moved] = newSlots.splice(fromIndex, 1)
        newSlots.splice(toIndex, 0, moved)
        return { ...computeDerived(newSlots, state.autoDetectKey, state.manualKey) }
      }),

      clearProgression: () => set(state => ({
        ...computeDerived([], state.autoDetectKey, state.manualKey)
      })),

      setManualKey: (key) => set(state => {
        const autoDetectKey = key === null
        return {
          manualKey: key,
          autoDetectKey,
          ...computeDerived(state.progression, autoDetectKey, key),
        }
      }),

      setAutoDetect: (on) => set(state => ({
        autoDetectKey: on,
        ...computeDerived(state.progression, on, state.manualKey),
      })),

      expandSuggestion: (chordName) => set({ expandedSuggestion: chordName, voicingPanelIndex: 0 }),

      setVoicingPanelIndex: (index) => set({ voicingPanelIndex: index }),

      saveProgression: (label) => set(state => ({
        savedProgressions: [
          ...state.savedProgressions,
          { id: Math.random().toString(36).slice(2), label, slots: state.progression },
        ]
      })),

      loadProgression: (id) => set(state => {
        const saved = state.savedProgressions.find(p => p.id === id)
        if (!saved) return state
        return { ...computeDerived(saved.slots, state.autoDetectKey, state.manualKey) }
      }),

      deleteProgression: (id) => set(state => ({
        savedProgressions: state.savedProgressions.filter(p => p.id !== id)
      })),

      setLooping: (on) => set({ isLooping: on }),

      setSelectedChord: (chord) => set({ selectedChord: chord }),
      clearSelectedChord: () => set({ selectedChord: null }),
      setFretboardOpen: (open) => set({ fretboardPanelOpen: open }),
      resetFretboardToOpen: () => set({
        globalFretPositions: [0,1,2,3,4,5].map(i => ({ string: i, fret: 0 })),
        globalDetectedChord: null,
      }),
    }),
    {
      name: "chordpath-storage",
      partialize: (state) => ({
        savedProgressions: state.savedProgressions,
        theme: state.theme,
      }),
    }
  )
)

// Re-export for components that still import from store
export { getKeyTriads, getKeyScale }
