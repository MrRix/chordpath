# ChordPath — Master Build Spec
### Complete Claude Code Build Guide · All research, audits, and design decisions consolidated

---

## 1. PROJECT OVERVIEW

**What it is:** A browser-based guitar songwriting assistant. The user builds a chord progression (up to 3 chords) by either typing chord names or tapping an interactive fretboard diagram. The app identifies the key, explains the music theory, and suggests what chord to play next based on common harmonic progressions. It functions simultaneously as a songwriting tool and a music theory teacher.

**Core workflow:** Enter chords → progression analysis → key detection → next chord suggestions → audio playback.

**What it is not:** A tab editor, a DAW, a backing track generator, or a riff writer. V1 is strictly: chord input → progression display → theory explanation → suggestions → audio.

**No backend. No database. No authentication. Fully client-side, deployed as a static file.**

---

## 2. PLATFORM DECISION

Build as a **React 18 web app** using Vite. Correct for all phases.

- Music theory logic is pure deterministic JavaScript — no server required
- Interactive fretboard and SVG components are native to the browser
- Vercel deployment is free and takes one command
- If offline is ever needed post-launch, Tauri can wrap it as a lightweight desktop binary

Do not use Python (poor interactive graphics), mobile-native (wrong form factor), or Electron (unnecessary weight).

---

## 3. COMPLETE TECH STACK

```
Framework:     React 18 + Vite + TypeScript
State:         Zustand
Styling:       Tailwind CSS + CSS custom properties for theming
Fonts:         Google Fonts (see Section 4.6)
Testing:       Vitest
Deployment:    Vercel
```

### Install command — run this exactly

```bash
npx create-vite@latest chordpath --template react-ts
cd chordpath
npm install zustand tonal tone react-guitar react-guitar-sound react-guitar-tunings svguitar @tombatossals/chords-db react-fretboard
npm install -D tailwindcss @tailwindcss/vite vitest
```

### What each package does and what it replaces

| Package | Purpose | What it saves you building |
|---|---|---|
| `tonal` | Music theory engine: chord detection from notes, key inference, scale generation, Roman numerals, mode identification | ~300 lines of custom theory code |
| `tone` | Web Audio: play chord progressions in sequence with BPM control | Custom audio scheduling |
| `react-guitar` | Interactive fretboard React component with tap/click detection | ~350 lines of custom SVG fretboard |
| `react-guitar-sound` | Real guitar audio samples integrated with react-guitar | Custom Tone.js synth setup |
| `react-guitar-tunings` | Standard tuning constants for react-guitar | Hardcoded tuning arrays |
| `svguitar` | Renders SVG chord box diagrams with full color/style control | ~100 lines of mini fretboard code |
| `@tombatossals/chords-db` | Complete database of guitar chord fingerings for every chord | Hardcoded voicing data |
| `react-fretboard` | Read-only fretboard with scale tone highlighting for theory panel | ~120 lines of custom scale overlay |

**Total custom code after libraries: approximately 520 lines, zero of which is music theory math.**

---

## 4. UI/UX DESIGN SPECIFICATION

### 4.1 Overall Layout

Three-column CSS Grid. No gaps — panels are flush with 1px dividing borders.

```
grid-template-columns: 150px 1fr 285px
min-height: calc(100vh - 48px)   /* 48px = header height */
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER: ChordPath | Key selector | Major/Minor | ☾/☀ | Auto-detect    │
├──────────────┬──────────────────────────────────┬───────────────────────┤
│ DETECT 150px │ PROGRESSION BOARD (flex)         │ THEORY 285px          │
│              │                                  │                       │
│ [Fretboard]  │ Title + key badge                │ Key hero (32px)       │
│              │                                  │ Scale display         │
│ Detected: Am │ [Am vi]→[F IV]→[G V]→[+]         │ Suggestions +         │
│              │ each card: [Name|Board] toggle    │   voicing panel       │
│ [+Add Am]    │                                  │ Pattern match         │
│              │ ▶ Loop ↓ Save  Clear             │ Diatonic chords       │
│ Quick Add    │ [Song structure strip]            │                       │
└──────────────┴──────────────────────────────────┴───────────────────────┘
```

**Responsive:** Below 1024px, stack to single column. Theory panel becomes a bottom sheet accessed via a "Theory" tab button.

---

### 4.2 Header (48px height)

```
Background: var(--header-bg)
Border-bottom: 1px solid var(--border)

Left to right:
1. "ChordPath" in var(--font-heading), var(--accent) color, 22-26px
2. 1px vertical divider
3. "KEY" micro-label + key dropdown (e.g., "C major ▾") in var(--font-chord)
4. Major/Minor pill toggle (pill style, active pill = accent bg)
5. [flex spacer]
6. ☾/☀ theme toggle button
7. "Auto-detect key" label + toggle switch (on by default)
```

---

### 4.3 Left Panel — Global Chord Detector (150px)

The global scratchpad for detecting chords before adding them to the progression. Independent of the per-card input in chord cards.

```
"DETECT" label in var(--font-heading), muted

1. react-guitar interactive fretboard
   - onChange → positionsToNotes() → Chord.detect() → update globalDetectedChord in store
   - onPlay → react-guitar-sound plays that string's audio sample

2. Detected chord card (accent-faint bg, accent border):
   - "DETECTED" micro-label (9px, muted, letter-spaced)
   - Chord name large (21px, chord font, accent color)
   - Notes inline right (e.g., "A · C · E")

3. "+ Add [Chord] to Progression" full-width primary button
   - Disabled when no chord detected or progression full (3 chords)

4. Divider

5. "QUICK ADD" micro-label + chip grid:
   G, C, D, Em, F, Dm, E, A, B
   All in chord font, pill styling, click = immediately add to progression
```

---

### 4.4 Center Panel — Progression Board (flex)

**The main workspace.**

#### Title Row
```
Left: "YOUR PROGRESSION" in heading font
Right: key badge ("C MAJOR" in accent) + pattern badge ("vi-IV-I" in chord font, muted)
```

#### Chord Cards Row

Up to 3 chord cards with → arrows between them. An empty "+ ADD" slot appears after the last chord if fewer than 3.

**Critical design requirement:** Each chord card has its own independent input mode toggle. One card can be in Name mode, another in Board mode. This is not a global setting.

---

**Card in Name mode:**
```
┌──────────────────────┐
│ [Name ✓]  [Board]    │  ← toggle. Active tab = accent bg
│ ██████████████████  │  ← 3px color stripe (function color)
│         vi           │  ← Roman numeral (function color, 9px uppercase)
│         Am           │  ← chord name (chord font, 24px)
│    [chord box SVG]   │  ← svguitar diagram from chords-db
│    Rel. Minor        │  ← function label (muted, 8px)
│  [▶ play]  [× remove]│
└──────────────────────┘
```

**Card in Board mode:**
```
┌──────────────────────┐
│ [Name]   [Board ✓]   │  ← Board tab active
│ ██████████████████  │  ← function color stripe
│         V            │  ← Roman numeral (updates live as user taps)
│   [chord box SVG]    │  ← shows live-tapped positions (accent border)
│    G (detected)      │  ← detected chord name in accent color
│  [▶ play]  [× remove]│
└──────────────────────┘
```

In Board mode the chord box SVG acts as the input interface. Tapping fret positions runs Chord.detect() and updates that slot's chord name in real time. The chord box should have a subtle accent-colored border to signal it is in input mode.

**Chord function color coding (applies to stripe and roman numeral):**
- Tonic (I, iii, vi) → var(--tonic)
- Subdominant (ii, IV) → var(--sub)
- Dominant (V, vii°) → var(--dom)
- Relative → var(--rel)

**Arrows:** Simple → in accent color, opacity 0.7. Arrow before empty slot is dimmed (opacity 0.2).

**Empty slot:** Dashed border, "+" and "ADD" centered, min-height matches card height, click focuses new slot.

#### Action Row (below cards)
```
▶ Play    — plays full progression in sequence via Tone.js, 80 BPM default
↻ Loop    — loops continuously until stopped
↓ Save    — saves current progression to Song Structure with a label prompt
Clear     — removes all chords (right-aligned, secondary style)
```

#### Song Structure Strip (bottom of center panel)
```
Horizontal scrollable row of saved progression blocks.
Each block: label (Verse / Chorus / Bridge / custom) + chord names in chord font.
Active block: accent-faint background.
End: dashed "+ Add section" block.
Interaction: click a block = load those chords into board.
             click label = inline rename.
```

---

### 4.5 Right Panel — Theory Panel (285px)

**The teaching layer.** Must be readable, well-spaced, and informative. 285px was specifically chosen (up from 202px) to give this panel the room it needs.

#### Section 1: Key Hero

```
Background: accent-faint, border: accent-border, border-radius: var(--radius)

"DETECTED KEY" micro-label (9px, muted, letter-spaced)

C Major                                    ●●●●○
                                        (confidence 4/5 dots)
─────────────────────────────────────────────────
Rel. Minor: Am   |   Parallel: C minor   |   Mode: Ionian
```

"C Major" is displayed at **32px** in var(--font-chord), var(--accent) color. This is the hero element of the entire theory panel. Make it prominent.

Confidence dots: 5 small filled/empty circles (●●●●○). Filled = accent color. When user has manually set the key, show a lock icon instead.

Sub-row: relative minor, parallel minor, mode name. Body font, muted color, 9px.

#### Section 2: Scale Display

```
"C MAJOR SCALE" micro-label

[C][D][E][F][G][A][B]
[1][2][3][4][5][6][7]

Each note = a pill (flex:1, ~30px wide, 7px tall number below).
Notes in the current progression = accent-faint bg, accent border, accent text.
Others = pill-bg, pill-border, muted text.
```

#### Section 3: Next Chord Suggestions

Label: "SUGGESTED NEXT CHORDS"

**Top suggestion — expanded voicing panel (one suggestion is always expanded):**

```
┌─────────────────────────────────────────────────────┐
│  G    V — Dominant                        [× close] │
│  Completes vi–IV–I–V progression                    │
├─────────────────────────────────────────────────────┤
│  [←]      Open Position — Voicing 1 of 3     [→]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Wide react-guitar fretboard, read-only, G chord]  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  NOTES   G · B · D · G · B · G                     │
├─────────────────────────────────────────────────────┤
│             [+ Add G to Progression]                │
└─────────────────────────────────────────────────────┘
```

Details:
- Header: chord name (20px, chord font, accent), roman numeral + function label, reason text, × to close/collapse
- Navigation row: ← and → buttons cycle through voicings from chords-db. Label shows "Voicing N of M"
- Fretboard: react-guitar in read-only mode (no onChange), full panel width minus 24px padding. Pull voicing from chords-db and convert frets array to react-guitar strings format.
- Notes row: "NOTES" micro-label + individual note name pills
- CTA button: full width, accent background, adds this chord (in this voicing) to progression

**Collapsed suggestion items below the expanded panel:**
```
[Em]  iii    Diatonic — adds warmth    ●●●○○   [+]
[Dm]  ii     Strong move toward V     ●●●○○   [+]
[C]   I      Return to tonic         ●●●●○   [+]
```

Each row: chord name (chord font, function color) | roman numeral | reason text | strength dots | [+] add button. Clicking anywhere on the row (not just [+]) expands it into the voicing panel, collapsing the previous one.

Strength dots: 5 dots (filled = function color, empty = border color).

#### Section 4: Pattern Match

Only rendered when a pattern is detected.

```
"PATTERN MATCH" micro-label

vi – IV – I – V                              [Pop / Rock]
I–IV–V also matched (Rock / Country)

[vi] [IV] [V]  [ V ]
 Am    F    G  (next)

G would complete the pattern as V
```

Roman numeral pills in a row. Pills for chords in current progression = accent-faint bg + accent border + accent text. Next/remaining pills = dimmed. Genre badge is small pill on the right of the pattern name.

#### Section 5: Diatonic Chords

```
"DIATONIC CHORDS — C MAJOR" micro-label

I      C      Tonic         ●
ii     Dm     Subdominant
iii    Em     Tonic
IV     F      Subdominant   ●
V      G      Dominant      ●
vi     Am     Rel. Minor    ●
vii°   Bdim   Leading
```

Rows for chords in current progression = accent-faint background. Filled dot on right of in-progression rows. Roman numeral in function color. Click any row = add that chord to progression.

---

### 4.6 Theme System

Two themes. Switchable via ☾/☀ toggle in header. Applied by setting a class on the root div: `theme-studio` or `theme-canvas`. All components use CSS custom properties exclusively — they are theme-agnostic.

#### THE STUDIO — Dark Mode

```css
.theme-studio {
  /* Backgrounds */
  --bg:          #111111;
  --panel-bg:    #181818;
  --card-bg:     #212121;
  --input-bg:    #1c1c1c;
  --header-bg:   #0e0e0e;

  /* Accent — Warm Amber */
  --accent:         #f59e0b;
  --accent-faint:   rgba(245, 158, 11, 0.08);
  --accent-border:  rgba(245, 158, 11, 0.22);

  /* Chord function colors */
  --tonic:  #f59e0b;
  --sub:    #3b82f6;
  --dom:    #ef4444;
  --rel:    #a78bfa;

  /* Text */
  --text:       #e5e0d8;
  --text-muted: #555555;
  --text-dim:   #303030;

  /* Borders and pills */
  --border:      #272727;
  --pill-bg:     #222222;
  --pill-border: #303030;

  /* Buttons */
  --btn-primary-bg:   #f59e0b;
  --btn-primary-text: #000000;

  /* Geometry */
  --radius:    8px;
  --radius-sm: 5px;

  /* Typography */
  --font-heading: 'Bebas Neue', sans-serif;
  --font-chord:   'JetBrains Mono', monospace;
  --font-body:    'Source Sans 3', sans-serif;

  /* Pattern match box */
  --match-bg:     rgba(59, 130, 246, 0.07);
  --match-border: rgba(59, 130, 246, 0.20);

  /* Fretboard rendering */
  --nut-color:    #ccc8c0;
  --string-color: #7a6040;
  --fret-color:   #2a2a2a;
  --dot-color:    #f59e0b;
  --marker-color: #252525;

  /* Shadows */
  --card-shadow: 0 2px 10px rgba(0,0,0,0.40);
}
```

#### CANVAS — Light Mode

```css
.theme-canvas {
  /* Backgrounds */
  --bg:          #f3f2ee;
  --panel-bg:    #ffffff;
  --card-bg:     #ffffff;
  --input-bg:    #f8f7f4;
  --header-bg:   #ffffff;

  /* Accent — Deep Teal */
  --accent:         #0e7ea8;
  --accent-faint:   rgba(14, 126, 168, 0.07);
  --accent-border:  rgba(14, 126, 168, 0.20);

  /* Chord function colors */
  --tonic:  #0e7ea8;
  --sub:    #7c3aed;
  --dom:    #dc2626;
  --rel:    #059669;

  /* Text */
  --text:       #1c1917;
  --text-muted: #78716c;
  --text-dim:   #c4bdb8;

  /* Borders and pills */
  --border:      #e8e5de;
  --pill-bg:     #f0ede7;
  --pill-border: #ddd9d0;

  /* Buttons */
  --btn-primary-bg:   #0e7ea8;
  --btn-primary-text: #ffffff;

  /* Geometry */
  --radius:    6px;
  --radius-sm: 4px;

  /* Typography */
  --font-heading: 'Fraunces', serif;
  --font-chord:   'Fira Code', monospace;
  --font-body:    'Source Sans 3', sans-serif;

  /* Pattern match box */
  --match-bg:     rgba(124, 58, 237, 0.06);
  --match-border: rgba(124, 58, 237, 0.18);

  /* Fretboard rendering */
  --nut-color:    #1c1917;
  --string-color: #b0a898;
  --fret-color:   #e0dbd2;
  --dot-color:    #0e7ea8;
  --marker-color: #e8e5de;

  /* Shadows */
  --card-shadow: 0 2px 10px rgba(0,0,0,0.07);
}
```

#### Google Fonts Link Tag (add to index.html)

```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;600&family=Source+Sans+3:wght@300;400;600&family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

---

## 5. FOLDER STRUCTURE

```
chordpath/
├── public/
│   └── samples/              ← guitar audio samples (E2.mp3, A2.mp3, D3.mp3, G3.mp3, B3.mp3, E4.mp3)
├── src/
│   ├── theory/
│   │   ├── fretboard.ts      ← ~20 lines: noteAtPosition, positionsToNotes
│   │   └── suggestions.ts    ← ~80 lines: suggestNextChords, pattern matching
│   ├── audio/
│   │   └── useProgressionAudio.ts  ← Tone.js play/loop hook
│   ├── components/
│   │   ├── Header/
│   │   │   └── Header.tsx
│   │   ├── LeftPanel/
│   │   │   └── LeftPanel.tsx
│   │   ├── ProgressionBoard/
│   │   │   ├── ProgressionBoard.tsx
│   │   │   ├── ChordCard.tsx      ← includes per-card Name/Board toggle
│   │   │   └── EmptySlot.tsx
│   │   ├── TheoryPanel/
│   │   │   ├── TheoryPanel.tsx
│   │   │   ├── KeyHero.tsx
│   │   │   ├── ScaleDisplay.tsx
│   │   │   ├── SuggestionList.tsx
│   │   │   ├── VoicingPanel.tsx   ← expanded chord + nav arrows + wide fretboard
│   │   │   ├── PatternMatch.tsx
│   │   │   └── DiatonicChords.tsx
│   │   └── SongBuilder/
│   │       └── SongBuilder.tsx
│   ├── store/
│   │   └── useAppStore.ts
│   ├── themes/
│   │   └── themes.ts          ← token definitions for both themes
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              ← Tailwind + CSS variable blocks for both themes
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 6. ZUSTAND STORE — COMPLETE INTERFACE

```typescript
// src/store/useAppStore.ts
import { create } from "zustand"
import { Chord, Key, Scale, Progression } from "tonal"
import { guitar } from "@tombatossals/chords-db"
import { suggestNextChords } from "../theory/suggestions"
import { positionsToNotes } from "../theory/fretboard"

type InputMode = "name" | "board"
type Theme = "studio" | "canvas"
interface FretPosition { string: number; fret: number }

interface ProgressionSlot {
  id: string
  chordName: string | null
  inputMode: InputMode       // independent per card
  boardPositions: FretPosition[]  // only used when inputMode === "board"
  romanNumeral: string | null
  chordFunction: "tonic" | "subdominant" | "dominant" | "relative" | null
  voicingIndex: number       // which voicing from chords-db to display in the chord box
}

interface ChordSuggestion {
  chordName: string
  romanNumeral: string
  reason: string
  strength: number    // 1-5
  fnKey: "tonic" | "sub" | "dom" | "rel"
}

interface DiatonicChord {
  chordName: string
  romanNumeral: string
  chordFunction: string
  fnKey: string
  inProgression: boolean
}

interface PatternMatch {
  name: string
  genre: string
  fullPattern: string[]   // Roman numerals
  currentLength: number   // how many are in the progression already
}

interface SavedProgression {
  id: string
  label: string
  slots: ProgressionSlot[]
}

interface AppState {
  theme: Theme
  globalFretPositions: FretPosition[]
  globalDetectedChord: string | null
  progression: ProgressionSlot[]     // max length 3
  autoDetectKey: boolean
  manualKey: string | null
  inferredKey: string | null
  inferredMode: "major" | "minor"
  keyToUse: string | null
  scaleNotes: string[]
  suggestions: ChordSuggestion[]
  diatonicChords: DiatonicChord[]
  patternMatch: PatternMatch | null
  confidence: number
  expandedSuggestion: string | null
  voicingPanelIndex: number
  savedProgressions: SavedProgression[]
  isLooping: boolean

  // Actions
  setTheme: (theme: Theme) => void
  tapGlobalFret: (string: number, fret: number) => void
  clearGlobalFretboard: () => void
  addChordToProgression: (chordName: string) => void
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
}
```

**Key implementation rule:** After every mutation that changes `progression`, immediately recompute all derived fields (inferredKey, inferredMode, scaleNotes, suggestions, diatonicChords, patternMatch, confidence, keyToUse). Do this inline in each action using `set()`.

**Key inference logic:**
```typescript
function inferKey(chordNames: string[]): { key: string; mode: "major" | "minor"; confidence: number } {
  if (!chordNames.length) return { key: "C", mode: "major", confidence: 0 }
  let best = { key: "C", mode: "major" as const, score: 0 }
  for (const root of ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"]) {
    for (const mode of ["major","minor"] as const) {
      const info = mode === "major" ? Key.majorKey(root) : Key.minorKey(root)
      const score = chordNames.filter(ch => info.chords.includes(ch)).length
      if (score > best.score) best = { key: root, mode, score }
    }
  }
  return { ...best, confidence: Math.round((best.score / Math.max(chordNames.length, 1)) * 5) }
}
```

---

## 7. KEY COMPONENT SPECIFICATIONS

### 7.1 fretboard.ts (complete file)

```typescript
import { Note } from "tonal"

export interface FretPosition { string: number; fret: number }

const STANDARD_TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"]

export function noteAtPosition(stringIndex: number, fret: number): string {
  const open = STANDARD_TUNING[stringIndex]
  const transposed = Note.transpose(open, Note.intervalFromSemitones(fret))
  return Note.pitchClass(transposed)
}

export function positionsToNotes(positions: FretPosition[]): string[] {
  return [...new Set(positions.map(p => noteAtPosition(p.string, p.fret)))]
}
```

### 7.2 suggestions.ts (complete file)

```typescript
import { Key, Progression } from "tonal"
import { FretPosition } from "./fretboard"

export interface ChordSuggestion {
  chordName: string; romanNumeral: string; reason: string
  strength: number; fnKey: "tonic" | "sub" | "dom" | "rel"
}

const PATTERNS = [
  { name: "I–V–vi–IV",    genre: "Pop",          pattern: ["I","V","vi","IV"] },
  { name: "I–IV–V",       genre: "Rock/Country",  pattern: ["I","IV","V"] },
  { name: "vi–IV–I–V",   genre: "Pop",           pattern: ["vi","IV","I","V"] },
  { name: "I–vi–IV–V",   genre: "Doo-wop/Pop",  pattern: ["I","vi","IV","V"] },
  { name: "ii–V–I",       genre: "Jazz",          pattern: ["ii","V","I"] },
  { name: "I–IV–vi–V",   genre: "Pop",           pattern: ["I","IV","vi","V"] },
  { name: "i–VII–VI–VII", genre: "Rock/Minor",    pattern: ["i","VII","VI","VII"] },
]

export function suggestNextChords(
  chordNames: string[], key: string, mode: "major" | "minor"
): ChordSuggestion[] {
  const keyString = `${key} ${mode}`
  const currentRomans = Progression.romanNumeral(keyString, chordNames)
  const suggestions: ChordSuggestion[] = []

  for (const pat of PATTERNS) {
    const prefix = pat.pattern.slice(0, currentRomans.length)
    if (JSON.stringify(currentRomans) === JSON.stringify(prefix)
        && currentRomans.length < pat.pattern.length) {
      const nextRoman = pat.pattern[currentRomans.length]
      const nextChord = Progression.fromRomanNumerals(keyString, [nextRoman])[0]
      if (nextChord && !suggestions.find(s => s.chordName === nextChord)) {
        suggestions.push({ chordName: nextChord, romanNumeral: nextRoman,
          reason: `Continues ${pat.name} (${pat.genre})`,
          strength: 5, fnKey: romanToFnKey(nextRoman) })
      }
    }
  }

  const keyInfo = mode === "major" ? Key.majorKey(key) : Key.minorKey(key)
  const romans = mode === "major"
    ? ["I","ii","iii","IV","V","vi","vii°"]
    : ["i","ii°","III","iv","v","VI","VII"]
  keyInfo.chords.forEach((chord, i) => {
    if (!chordNames.includes(chord) && !suggestions.find(s => s.chordName === chord)) {
      suggestions.push({ chordName: chord, romanNumeral: romans[i],
        reason: `Diatonic to ${key} ${mode}`, strength: 2,
        fnKey: romanToFnKey(romans[i]) })
    }
  })

  return suggestions.sort((a, b) => b.strength - a.strength).slice(0, 5)
}

function romanToFnKey(roman: string): "tonic" | "sub" | "dom" | "rel" {
  const r = roman.toLowerCase()
  if (r.startsWith("ii") || r.startsWith("iv")) return "sub"
  if (r.startsWith("v") || r.startsWith("vii")) return "dom"
  if (r === "vi" || r === "iii") return "rel"
  return "tonic"
}
```

### 7.3 useProgressionAudio.ts

```typescript
import { useRef, useCallback } from "react"
import * as Tone from "tone"
import { Chord } from "tonal"

export function useProgressionAudio() {
  const synthRef = useRef<Tone.PolySynth | null>(null)

  const init = useCallback(async () => {
    await Tone.start()
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.4, release: 1.5 },
      }).toDestination()
    }
  }, [])

  const playChord = useCallback(async (chordName: string) => {
    await init()
    const info = Chord.get(chordName)
    if (!info.notes.length) return
    const notes = info.notes.map((n, i) => `${n}${3 + Math.floor(i / 3)}`)
    synthRef.current?.triggerAttackRelease(notes, "2n")
  }, [init])

  const playProgression = useCallback(async (chords: string[], bpm = 80) => {
    await init()
    Tone.Transport.bpm.value = bpm
    let time = Tone.now()
    const beatDur = (60 / bpm) * 2
    for (const chordName of chords) {
      const info = Chord.get(chordName)
      if (!info.notes.length) continue
      const notes = info.notes.map((n, i) => `${n}${3 + Math.floor(i / 3)}`)
      synthRef.current?.triggerAttackRelease(notes, "2n", time)
      time += beatDur
    }
  }, [init])

  const stop = useCallback(() => {
    Tone.Transport.stop()
    synthRef.current?.releaseAll()
  }, [])

  return { playChord, playProgression, stop }
}
```

### 7.4 ChordCard Component — Key Implementation Notes

The Name/Board toggle at the top of each card sets `slot.inputMode` via `setSlotInputMode(slot.id, mode)`. This is completely independent per card.

**In Name mode:** Show a text input if `slot.chordName === null` (empty slot being filled). Show the chord name + svguitar diagram if the chord is confirmed.

**In Board mode:** Render a smaller react-guitar component inside the card:
```tsx
<Guitar
  strings={slotBoardPositionsToStrings(slot.boardPositions)}
  onChange={(strings) => {
    // Convert strings array back to FretPosition[]
    // Run Chord.detect(positionsToNotes(positions)) 
    // Update slot chordName in store
  }}
  onPlay={play}
  // Configure react-guitar theme for compact card size
/>
```

Add an accent-colored border around the board input area to visually signal it is in input mode.

**svguitar chord diagram:** Initialize in a `useEffect` with a `useRef` div target. Reinitialize when `slot.chordName` or `slot.voicingIndex` changes:
```typescript
import { SVGuitarChord } from "svguitar"
import { guitar } from "@tombatossals/chords-db"

useEffect(() => {
  if (!containerRef.current || !slot.chordName) return
  const voicings = guitar.chords[slot.chordName]
  if (!voicings?.length) return
  const v = voicings[slot.voicingIndex % voicings.length]
  new SVGuitarChord(containerRef.current)
    .configure({
      fingerColor: getComputedStyle(document.documentElement).getPropertyValue('--dot-color').trim(),
      fretColor: getComputedStyle(document.documentElement).getPropertyValue('--fret-color').trim(),
      stringColor: getComputedStyle(document.documentElement).getPropertyValue('--string-color').trim(),
      bgColor: 'transparent',
      nutColor: getComputedStyle(document.documentElement).getPropertyValue('--nut-color').trim(),
    })
    .chord({ fingers: v.frets.map((f, i) => [i+1, f]) as any, barres: v.barres, position: v.baseFret })
    .draw()
}, [slot.chordName, slot.voicingIndex, theme])
```

### 7.5 VoicingPanel Component — Key Implementation Notes

The voicing panel appears in the theory panel when `expandedSuggestion === suggestion.chordName`.

**Converting chords-db format to react-guitar strings:**
```typescript
import { guitar } from "@tombatossals/chords-db"

function getVoicingStrings(chordName: string, voicingIndex: number): number[] {
  const voicings = guitar.chords[chordName]
  if (!voicings?.length) return [0,0,0,0,0,0]
  const v = voicings[voicingIndex % voicings.length]
  // chords-db frets: -1=muted, 0=open, N=fret number
  // react-guitar strings: same convention
  return v.frets  // already in the right format
}
```

The fretboard inside VoicingPanel is react-guitar in **read-only mode** (omit the `onChange` prop). Set its width to fill the available panel width (about 240px). The `onPlay` prop connects to react-guitar-sound for audio on string tap.

Note pills: derive from the voicing by calling `noteAtPosition()` for each fretted string position.

---

## 8. BUILD STEPS — SEQUENTIAL FOR CLAUDE CODE

Execute in order. Verify compilation before each next step.

### STEP 1: Scaffold and install
```bash
npx create-vite@latest chordpath --template react-ts
cd chordpath
npm install zustand tonal tone react-guitar react-guitar-sound react-guitar-tunings svguitar @tombatossals/chords-db react-fretboard
npm install -D tailwindcss @tailwindcss/vite vitest
```

Configure Tailwind in `vite.config.ts`. Create `tailwind.config.ts` targeting `./src/**/*.{ts,tsx}`.

Create `src/index.css`: Tailwind imports + both `.theme-studio { }` and `.theme-canvas { }` CSS variable blocks (full token values in Section 4.6).

Add Google Fonts link to `index.html`.

Create complete folder structure from Section 5.

### STEP 2: Theory files and test

Write `src/theory/fretboard.ts` (complete file in Section 7.1).
Write `src/theory/suggestions.ts` (complete file in Section 7.2).

Write and run:
```typescript
// src/theory/suggestions.test.ts
import { suggestNextChords } from "./suggestions"
import { test, expect } from "vitest"
test("Am-F suggests G (V) for C major", () => {
  const s = suggestNextChords(["Am", "F"], "C", "major")
  expect(s.some(x => x.chordName === "G")).toBe(true)
})
```
`npx vitest run` — fix until green.

### STEP 3: Audio hook

Write `src/audio/useProgressionAudio.ts` from Section 7.3.

### STEP 4: Zustand store

Write `src/store/useAppStore.ts` implementing the complete interface from Section 6.

All actions that change `progression` must recompute derived state inline using the key inference logic and `suggestNextChords`.

Persist `savedProgressions` and `theme` to localStorage using Zustand `persist` middleware.

### STEP 5: Themes file

Write `src/themes/themes.ts` exporting both theme token objects.

Verify both `.theme-studio` and `.theme-canvas` CSS variable blocks in `index.css` match the token values in Section 4.6 exactly.

### STEP 6: Header

Build `Header.tsx`:
- App name + key dropdown + Major/Minor toggle + ☾/☀ theme toggle + auto-detect toggle
- Key dropdown should list all 24 keys (12 major + 12 minor)
- Theme toggle calls `setTheme()` and applies the class to `document.body` or the root div

### STEP 7: Left panel

Build `LeftPanel.tsx`:
- react-guitar component with onChange → positionsToNotes → Chord.detect → update store
- react-guitar-sound hook for per-string audio
- Detected chord display + Add button + Quick Add chips

### STEP 8: Chord cards

Build `ChordCard.tsx` with all features from Section 7.4:
- [Name | Board] toggle (per-card, independent)
- Name mode: text input OR chord name display with svguitar diagram
- Board mode: compact react-guitar for fret input + chord detection
- Function color stripe + roman numeral
- ▶ and × buttons

Build `EmptySlot.tsx`: dashed border, + icon, click handler.

### STEP 9: Progression board

Build `ProgressionBoard.tsx`:
- Map progression slots → ChordCard components
- → arrows between cards
- EmptySlot after last if fewer than 3
- Action row: Play / Loop / Save / Clear buttons
- Play → `playProgression(chordNames)` from audio hook
- SongBuilder strip at bottom

### STEP 10: Theory panel sub-components

Build in order:
1. `KeyHero.tsx` — key name at 32px + confidence dots + relative/parallel/mode row
2. `ScaleDisplay.tsx` — 7 note pills with degree numbers, highlight in-progression notes
3. `VoicingPanel.tsx` — full implementation from Section 7.5 (this is the most complex)
4. `SuggestionList.tsx` — map suggestions, render VoicingPanel for expanded one, collapsed rows for others
5. `PatternMatch.tsx` — conditional render, roman numeral pills row
6. `DiatonicChords.tsx` — 7-row list, highlight in-progression rows, click to add

Assemble in `TheoryPanel.tsx` in the vertical order listed in Section 4.5.

### STEP 11: App layout

Assemble `App.tsx`:
- Apply `theme-${theme}` class to root div
- CSS Grid: `150px 1fr 285px`
- Header above the grid
- LeftPanel | ProgressionBoard | TheoryPanel in grid

### STEP 12: Song builder

Build `SongBuilder.tsx`:
- Horizontal scroll container
- Saved progression blocks with labels and chord names
- Click block → load progression
- Inline rename on label click
- Clipboard export button (plain text format)

### STEP 13: Polish

- Keyboard shortcuts: Escape = clear active fretboard, Enter = confirm typed chord, Space = play/pause, Tab = move between chord slots
- Smooth theme transition: `transition: background 0.2s, color 0.15s` on root
- Card entry animation: slide in from right
- Voicing panel expand/collapse animation
- Full keyboard accessibility and focus states
- Safari compatibility: ensure `Tone.start()` only fires on user gesture

### STEP 14: Deploy

```bash
npm run build
npx vercel --prod
```

Or connect GitHub repo to Vercel for automatic deploys on push to main.

---

## 9. WHAT NOT TO BUILD IN V1

These were explicitly researched and cut from scope:

- **Tab notation input** — the fretboard is always a chord snapshot. Label it "Chord Diagram" not "Tab."
- **Backend or user accounts** — all state is local. localStorage for saved progressions.
- **AI-powered explanations** — ship hardcoded reason strings in suggestions.ts. Claude API enhancement is Phase 2.
- **Mobile native app** — the web app is responsive on tablet. Native iOS/Android is out of scope.
- **Circle of Fifths widget** — was designed but deprioritized. Add in Phase 2 (approximately 60 lines of SVG arc math).
- **Riff/melody input** — chord progressions only in v1.

---

## 10. DECISION LOG — ALL DECISIONS MADE DURING RESEARCH

| Area | Decision | Reason |
|---|---|---|
| Platform | React 18 + Vite | Best fretboard/SVG support, one-command Vercel deploy |
| Theory engine | Tonal.js (not custom) | Handles all edge cases; ~300 lines saved |
| Chord voicing database | @tombatossals/chords-db | Complete coverage, exact format for svguitar |
| Input fretboard | react-guitar | Interactive, accessible, real audio built in |
| Chord box diagrams | svguitar | Best theming control for both dark/light modes |
| Scale overlay | react-fretboard | Tonal.js native, built for this use case |
| Audio: per-string | react-guitar-sound | Real guitar samples, not synthesizer |
| Audio: progression | Tone.js | BPM control, sequence scheduling |
| State | Zustand | No boilerplate, sufficient for this app |
| Styling | Tailwind + CSS custom props | Tailwind for layout, vars for theme switching |
| Dark theme | THE STUDIO | Amber on charcoal, Bebas Neue + JetBrains Mono |
| Light theme | CANVAS | Teal on warm white, Fraunces + Fira Code |
| Third theme (Signal) | Removed | Two themes sufficient; studio and canvas cover the need |
| Per-card input | Each chord slot has its own Name/Board toggle | Real workflow: type known chords, tap unknown ones |
| Voicing expansion | Click suggestion → voicing panel with wide fretboard + nav arrows | Key UX: see the chord before adding it |
| Theory panel width | 285px (up from 202px) | 202px was too narrow; key info was unreadable |
| Left panel | 150px global detect panel | Separate from per-card; useful as scratchpad |
| Tab vs chord diagram | Always chord diagram (snapshot) | Tab is time-based riff notation — different scope |
| Custom theory engine | Rejected in favor of Tonal.js | Any custom implementation would have subtle bugs |
| Python alternative | Evaluated, rejected | Can't do interactive fretboard or audio in Python GUI |
