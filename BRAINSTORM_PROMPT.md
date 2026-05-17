# ChordPath — Design Brainstorm Prompt
## Open brainstorm: Best layout for a chord progression + music theory analysis page

---

## What is ChordPath?

ChordPath is a **browser-based guitar songwriting and music theory tool** built in React 19 + TypeScript + Vite. There is no backend — everything runs client-side. It has no mobile version (fixed desktop layout). The target user is a guitarist or songwriter who wants to understand what key and mode their chord ideas are in, what chords fit their progression, and where to go next musically.

The core workflow is:
1. User detects or manually enters chords (via a guitar fretboard or by typing chord names)
2. The app analyses the progression and detects the most likely key and mode
3. The app shows theory analysis: key match rankings, diatonic chords, Roman numerals, borrowed chords, suggestions for what chord to play next

---

## The Use Case (Design North Star)

The **analysis** is the product. The chord input is the means to get there.

A songwriter is noodling on guitar. They stumble on a progression — G, Em, C, D. They don't know what key it's in, whether they're in G Major or E Minor, what other chords fit, or what the harmonic function of each chord is. ChordPath tells them all of that. The moment of insight — "oh, this is G Major, the C is the IV (subdominant), and I could resolve to D (dominant) next" — is the core value. Everything else in the UI should serve that moment.

**The chord input should feel like a search bar. The analysis should feel like the results page.**

---

## Current Layout (the problem)

The app uses a 3-column CSS grid: `150px 1fr 285px`

- **Left column (150px):** Chord detection fretboard + chord library list
- **Centre column (1fr):** Interactive guitar fretboard (detect mode) + the Progression Board (chord cards)
- **Right column (285px):** Theory Panel — the analysis

The current Theory Panel (right 285px) stacks five separate components vertically:
1. **KeyHero** — detected key name, mode, confidence dots, rel/parallel info, borrowed chords list, tied keys
2. **ScaleDisplay** — 7 scale notes with scale degrees, highlighted if used in progression
3. **SuggestionList** — 5 suggested next chords with Roman numeral and reason
4. **PatternMatch** — detects if the progression matches a named pattern (I–V–vi–IV etc.)
5. **DiatonicChords** — all 7 diatonic chords as pills

**The problem:** The analysis panel feels like a sidebar footnote. It is visually equal to or smaller than the chord progression cards in the centre. The five components are stacked and hard to scan. There is no clear hierarchy — confidence, borrowed chords, next chord suggestions, and scale notes all compete for attention at the same visual weight.

---

## The Research Tool Inspiration

Before building ChordPath, a standalone research HTML tool was built to test the key detection engine. Its output was far more readable and informative. It showed:

- A **ranked table** of all 84 key matches (12 roots × 7 modes) sorted by score
- Each row: rank, key name + mode, score, confidence bar, all 7 diatonic chord pills, Roman numerals directly beneath each pill, fits (green) vs misses (red/amber) with specific note names
- **Colour-coded harmonic function**: tonic (teal), subdominant (indigo), dominant (red), relative (amber)
- Tied keys highlighted
- Borrowed/non-diatonic chords explicitly named
- Modal character description: "Bright, resolved, happy" / "Minor with raised 6th — jazzy, soulful" etc.

That tool felt like a proper reference. The current right panel does not.

---

## What Has Already Been Tried

Three text mockups were sketched, then Mockup 3 was built as an HTML prototype:

### Mockup 1 — "The Analysis Drawer" (not built)
- Eliminates the right sidebar entirely
- Adds a full-width collapsible bottom panel (48px collapsed, 240px expanded)
- Collapsed state: key name + confidence + fits tally + chevron toggle
- Expanded state: full-width ranked key table with chord pills, Roman numerals, fits/misses
- **Pros:** Maximum table width, great scanability, workspace gets full height
- **Cons:** Hidden by default — analysis requires a click to see

### Mockup 2 — "The Key Cards Strip" (not built)
- Removes right sidebar, adds a horizontal scrollable strip between the progression and chord library
- Each matched key is its own card, sorted left-to-right by likelihood
- Top card has teal border, "Use this key" button, chord pills + Roman numerals
- "Show all 84 matches" link on the right
- **Pros:** Card-based, very readable, ranked order is spatially intuitive
- **Cons:** Takes vertical space in the centre column, disrupts the build→analyse flow

### Mockup 3 — "The Smart Panel" (built as HTML prototype)
- Keeps the 285px right sidebar position, completely rebuilds its contents
- Adds a tab bar: Analysis | Next Chord | Scale
- #1 Best Match gets a full accent-tinted card (key name, character, 7 chord pills, Roman numerals, fits confirmation)
- #2–#N are compact collapsible rows (rank + key + character + confidence dots, expandable body)
- "Also fits" pills for tied keys, "+4 more" link to full overlay
- Colour legend: Tonic / Sub / Dom / Rel
- **Pros:** Zero layout change, lowest implementation risk, tabbed removes component stacking
- **Cons:** The 285px column still feels like a sidebar — the analysis and the chord cards feel like visual equals, but the analysis IS the more important element

### The Feedback on Mockup 3
The user's response: *"This is good but this should take on more of a role on the page than the chords being added themselves. They are key but the analysis is what matters."*

This is the core design challenge: **how do you make the analysis the hero of the page without making chord input cumbersome?**

---

## Technical Constraints

- **React 19 + TypeScript + Vite + Tailwind CSS v4**
- **No router** — single page app, one view
- **No mobile** — desktop only, minimum ~1024px wide
- **CSS custom properties for theming** — two themes: `.theme-studio` (dark, amber accent) and `.theme-canvas` (light, teal accent). The brainstorm should focus on **light mode (Canvas theme)**
- **Colour palette (light/Canvas):**
  - Background: `#f7f6f2`
  - Surface: `#ffffff`
  - Surface 2: `#f0efe9`
  - Border: `#dedad2`
  - Text: `#1a1916`
  - Accent (teal): `#0d9488`
  - Tonic: teal `#0d9488`
  - Subdominant: indigo `#6366f1`
  - Dominant: red `#dc2626`
  - Relative: amber `#d97706`
- **Fonts:**
  - UI: Source Sans 3
  - Chord names / Roman numerals / monospace data: JetBrains Mono
  - Display headings: Fraunces (serif)
- **State managed by Zustand** — all theory data is derived and already available:
  - `keyToUse` (string, e.g. "G")
  - `inferredMode` (string, e.g. "Major", "Dorian", "Minor")
  - `confidence` (1–5 integer)
  - `borrowedChords` (string array — non-diatonic chords in the progression)
  - `tiedKeys` (string array — keys that scored equally)
  - `scaleNotes` (string array — 7 notes of the detected scale)
  - `progression` (array of chord slots — each has chordName and detected chordData)
  - `suggestions` (ChordSuggestion array — up to 5, each with chordName, romanNumeral, reason, strength, fnKey)
  - Full 84-key score table available from `scoreAllKeys()` — scores, fits/misses per key

---

## The Brainstorm Goal

Design the best possible single-page layout where:

1. **The music theory analysis is the visual and spatial hero** — it should dominate the page, be immediately legible, and feel like the destination, not a sidebar
2. **Chord input remains fast and frictionless** — adding chords should not feel buried or de-prioritised in interaction terms, even if it's visually secondary
3. **The ranked key analysis reads like the research tool** — full diatonic chord set visible per key, Roman numerals beneath each chord, clear fits/misses indication, confidence, mode character
4. **Harmonic function colour coding is consistent** — tonic/sub/dom/rel colours applied to chord pills and Roman numerals everywhere
5. **Next chord suggestions are discoverable** — the "where do I go next?" question should be easy to find without cluttering the analysis
6. **Scale visualisation has a place** — the 7-note scale with degree labels should exist but not compete

Feel free to throw out the current 3-column grid entirely. Consider: full-page layouts, split views, overlay panels, progressive disclosure, tabbed sections, scrollable analysis columns, bottom sheets, floating panels, or anything else. The only constraints are desktop browser (no mobile), React component architecture, and the colour/font system above.

What is the best possible layout for this tool?

---

## Supplementary: Current Component File Structure

```
src/
  components/
    LeftPanel/
      LeftPanel.tsx          ← fretboard detect + chord library list
    Fretboard/
      Fretboard.tsx          ← interactive SVG fretboard
    ProgressionBoard/
      ProgressionBoard.tsx   ← chord card strip
      ChordCard.tsx          ← individual chord card (input + mini diagram)
      EmptySlot.tsx          ← "+" add chord button
    TheoryPanel/
      TheoryPanel.tsx        ← right column wrapper
      KeyHero.tsx            ← key name + confidence + borrowed
      ScaleDisplay.tsx       ← 7 scale notes
      SuggestionList.tsx     ← next chord suggestions
      PatternMatch.tsx       ← named pattern detection
      DiatonicChords.tsx     ← 7 diatonic chord pills
  store/
    useAppStore.ts           ← Zustand store, all state + derived values
  theory/
    keyDetection.ts          ← 84-key scoring engine, parseChord, MODES
    suggestions.ts           ← next chord suggestions, pattern matching
```
