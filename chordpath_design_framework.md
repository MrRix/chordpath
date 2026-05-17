# ChordPath — Design Framework
## Implementation handoff document for Claude Code

---

## 1. Product Definition

**What ChordPath is:**
A browser-based songwriting compass for guitarists. Not a music theory reference. Not a lookup tool. A chord palette unlocking tool that shows a songwriter the full territory they are already standing in, so they can navigate it intentionally rather than by accident.

**The core loop:**
1. User types (or fretboard-detects) 2–4 chords they are noodling on
2. ChordPath identifies the most likely keys those chords live in
3. ChordPath reveals the full chord palette available in each key, framed by feel
4. User picks up the guitar and tries new chords from the palette
5. Over weeks and months, vocabulary expands and songs become more harmonically interesting

**The growth mechanism is repetition over time, not any single session.**
A user who comes back with a new progression every week will gradually start writing in different keys and modes — not because they studied theory, but because the chords were in front of them and available to try.

**What ChordPath is not:**
- Not a reference tool with ranked tables of 84 key matches (that belongs behind a disclosure)
- Not an audio tool (the guitar is the audio — no playback)
- Not a lesson platform (theory is learned through osmosis, not explanation)
- Not a DAW integration (standalone browser tool)

---

## 2. Target User

**Primary persona:** A noodling guitarist who writes songs and is curious about music theory but has no formal training. They strum 3–4 chords, they sing along, they want to take the song somewhere different. They are tired of defaulting to the same key (usually G Major or C Major). They do not know what "subdominant" or "Ionian" means yet — but they will, gradually, through repeated use.

**Key behavioural constraints that drive every layout decision:**
- Hands are on a guitar during use. Every tap costs a hand movement. Design for minimum taps.
- They think in terms of feel and mood, not mode names. "Dark" and "bright" and "bluesy" land. "Aeolian" does not.
- They will not tolerate front-loaded theory. The why must be accessible but never the main event.
- They use this tool briefly, mid-session, then put the screen down and pick up the guitar. The tool must deliver value in under 10 seconds of screen time.
- They are not comparing ChordPath against other tools. They want to know what chords to try next.

**What success looks like for the user:**
After 3 months of use, they are writing in E Minor and D Mixolydian sometimes — not just G Major. They do not know they learned music theory. They just know more chords and their songs sound different.

---

## 3. Product North Star

**"The chord palette is the hero. The analysis exists to frame the palette."**

The moment a user sees seven chord cards they didn't know were available to them is the core value event. Everything else in the interface — key detection, confidence scores, ranked tables, mode names — exists to set up that moment of palette discovery.

**"The input strip is a search bar. The analysis is the results page."**
The chord input should feel lightweight and fast. The analysis below should feel like the destination. Spatially, the analysis dominates the page.

**"ChordPath is a more complex Circle of Fifths wheel."**
It orients the user within harmonic space, shows them what is nearby and reachable, and lets them navigate by feel. It does not lecture.

**The guitar is the audio.** There is no playback in ChordPath. The user hears chords by playing them on the instrument. This is intentional — it keeps learning embodied and musical. Do not add playback as a feature.

---

## 4. Information Hierarchy (resolved and final)

From most to least important, spatially and visually:

1. **The chord palette** — the 7 available chords in each detected key, always visible, immediately scannable without interaction
2. **The key paths** — the top 3 most relevant keys the progression fits, framed by mood/feel not mode name
3. **The chord diagram** — revealed on single tap, shows fingering so the user can immediately play the chord
4. **The theory context** — what this chord does in this key context, shown in the diagram panel beneath the fingering
5. **The input progression** — the chords the user entered, always visible in the input strip as a persistent reference
6. **Technical theory language** — mode names (Ionian, Dorian, etc.), full Roman numeral analysis, confidence scores — accessible behind secondary interactions, never foregrounded

---

## 5. Language and Framing Rules

### Feel-first, always
- Row 1 feel label: "Bright & resolved" — key name "G Major" shown smaller beside it
- Row 2 feel label: "Dark & introspective" — key name "E Minor"
- Row 3 feel label: "Bluesy" — key name "D Mixolydian"
- Mode name (Ionian, Aeolian, Mixolydian) is accessible behind a secondary tap on the key name — never shown in the primary view

### Feel label lookup by mode name (for dynamic key detection)
```
Ionian     → "Bright & resolved"
Aeolian    → "Dark & introspective"
Dorian     → "Minor with raised sixth — soulful"
Phrygian   → "Dark, Spanish feel"
Lydian     → "Bright with a raised fourth — ethereal"
Mixolydian → "Bluesy"
Locrian    → "Unstable, tense"
```

### Chord descriptions must be functional, not atmospheric

**Bad (rejected):** "Bittersweet tension. Sits between stability and wanting to move somewhere."

**Good (approved):** "Mediant (iii) — connects the tonic to the subdominant. Common moves: Bm → C or Bm → Em."

The description explains what the chord typically does in that key context — how it moves, what it resolves to, what function it plays. No vague emotional language.

### Descriptions are key-context-sensitive

The same physical chord shows a different description depending on which key row it was tapped from. This is a core learning moment.

Example — chord G:
- G tapped from G Major row: "Tonic (I) — home base. The most stable chord in the key. Progressions naturally resolve here."
- G tapped from E Minor row: "Relative major (III) — the brightest chord in the minor key. A natural contrast before returning to Em."
- G tapped from D Mixolydian row: "Subdominant (IV) — moves naturally to and from the ♭7 (C). A cornerstone of rock and blues writing."

### Roman numerals — present but secondary
Roman numerals appear small beneath the chord name on each palette card. They are not explained or labelled anywhere. Over repeated use, the user begins to recognise the patterns without being taught. Do not add explanatory text like "Roman numerals show harmonic function" to the primary UI.

---

## 6. Resolved Layout Architecture

### The winning layout: A+C Hybrid ("The Compass with Anchor")

Three layout concepts were prototyped and evaluated:
- **A (The Compass):** Full-width stacked key rows, diagram appears below all palettes
- **B (The Grid):** Three palettes side by side as columns — rejected because chord chips compress and three parallel vertical reading tracks increase cognitive load
- **C (The Anchor):** Diagram fixed in a left column, palettes in a scrollable right column

**The chosen layout combines A and C:** full-width stacked key rows (from A) with the diagram panel anchored as a persistent right column (from C). The palettes get full left-panel width; the diagram never disappears when switching between rows.

### Final layout structure

```
┌─────────────────────────────────────────────────────────┐
│  Nav bar (38px)                                         │
├─────────────────────────────────────────────────────────┤
│  Input bar (64px min, wraps if needed)                  │
│  [chord chips] [text input + Add] │ [Fretboard] [key]  │
├──────────────────────────────────────┬──────────────────┤
│  Left panel (flex: 1)                │ Right panel      │
│                                      │ (224px fixed)    │
│  ● Bright & resolved    G Major      │                  │
│  [G][Am][Bm][C][D][Em][F#°]          │  [Chord name]    │
│                                      │  [Role in key]   │
│  ● Dark & introspective E Minor      │  [Fingering SVG] │
│  [Em][F#°][G][Am][Bm][C][D]          │  ──────────────  │
│                                      │  [Description]   │
│  ● Bluesy              D Mixolydian  │                  │
│  [D][Em][F#°][G][Am][Bm][C]          │  (empty state    │
│                                      │   shows faint    │
│  Show more matched keys →            │   fret grid +    │
│                                      │   hint text)     │
└──────────────────────────────────────┴──────────────────┘
```

### What was tried and rejected

**Original 3-column grid (150px | 1fr | 285px):**
The 285px theory panel felt like a sidebar footnote — visually equal to the chord progression cards in the centre. The analysis must dominate the page spatially.

**Full ranked table as primary surface:**
84 key matches with confidence bars, fit/miss indicators, and all 7 diatonic pills per key is a reference tool. Powerful, but wrong for the primary surface for this user. It belongs behind "Show more matched keys →".

**Accordion (one row open, others collapsed):**
Nielsen Norman Group (2024): when users need to compare content across sections, collapsing panels increases cognitive load and lowers usability. The guitarist cannot hold three 7-chord palettes in short-term memory. All palettes must be permanently visible.

**Tabs between key views:**
NN/G tabs research: tabs increase cognitive load when users need to compare across sections. Creates three parallel reading tracks requiring more cognitive effort than one vertical scan.

**"Yours" and "Try it" text labels on chord chips:**
Redundant once colour coding is in place. Removed.

**Diagram below all palettes (Concept A pure):**
When the user switches key rows and the diagram is at the bottom of a scrollable list, they lose context. The fixed right panel solves this permanently.

---

## 7. Input Bar — Detailed Specification

### Primary chord entry: text input (not fretboard)
The main workflow is typing. The user types "Am", presses Enter or clicks Add, and the chord appears in the strip. The fretboard is a secondary optional tool for users who cannot identify the chord name themselves.

### Input bar overall container
- min-height: 64px (grows if chord strip wraps to second line)
- Background: var(--color-background-primary) — white/light
- Border-bottom: 2px solid var(--color-border-secondary) — slightly heavier than other borders to visually separate input zone from analysis zone
- Padding: 9px 14px (allows wrapping)
- Display: flex, align-items: center, flex-wrap: wrap, gap: 8px

### Chord strip (leftmost, takes remaining space)
Display: flex, align-items: center, flex-wrap: wrap, gap: 5px

**Each chord chip in the strip:**
- Background: var(--color-background-secondary)
- Border: 1px solid var(--color-border-secondary)
- Border-radius: var(--border-radius-md)
- Padding: 4px 22px 4px 9px (extra right padding to accommodate the × button)
- Display: flex, flex-direction: column, align-items: center, gap: 1px
- Position: relative (to position the × button)
- Flex-shrink: 0

Chord name inside chip:
- Font: JetBrains Mono, 14px, weight 500
- Color: var(--color-text-primary)

Roman numeral inside chip (below chord name):
- Font: JetBrains Mono, 8px
- Color: the harmonic function colour for that chord in the primary detected key
  - I (tonic) → #085041 (dark teal)
  - ii, IV (subdominant-function) → indigo variant
  - V, vii° (dominant-function) → red variant
  - vi (relative minor) → amber variant
  - Use the existing ChordPath `--chord-tonic`, `--chord-subdominant`, `--chord-dominant`, `--chord-relative` tokens

Remove (×) button inside chip:
- Position: absolute, top: 3px, right: 3px
- Width: 13px, height: 13px
- Border-radius: 50%
- Font-size: 9px, line-height: 1
- Color: var(--color-text-tertiary)
- Background: none, border: none
- Cursor: pointer
- Display: flex, align-items: center, justify-content: center, padding: 0
- Hover: color #dc2626 (red), background: rgba(220,38,38,.1)
- On click: removes this chord from the progression array and re-renders

### Text input field
- Width: 80px
- Height: 34px
- Padding: 0 8px
- Font: JetBrains Mono, 13px
- Border: 1px solid var(--color-border-secondary)
- Border-radius: var(--border-radius-md)
- Background: var(--color-background-primary)
- Color: var(--color-text-primary)
- Placeholder: "e.g. Am" in var(--color-text-tertiary) at 11px
- Focus state: border-color #0d9488, box-shadow: 0 0 0 2px rgba(13,148,136,.12), outline: none
- On Enter key: triggers chord add (same as clicking Add)
- On invalid chord name submission: brief shake animation or border flash in red (rgba(220,38,38,.5)) — do not silently add unrecognised chord names

### Add button
- Height: 34px, padding: 0 11px
- Background: #0d9488 (teal, filled)
- Color: white
- Font: 11px, weight 500
- Border: none
- Border-radius: var(--border-radius-md)
- Cursor: pointer
- Hover: background #0f6e56 (darker teal)
- Label: "Add"

### Separator between chord entry area and fretboard button
- Width: 0.5px, height: 30px
- Background: var(--color-border-tertiary)
- Flex-shrink: 0

### Fretboard button (secondary — clearly demoted from primary)
- Display: flex, align-items: center, gap: 5px
- Font: 11px, color: var(--color-text-secondary)
- Background: none (transparent)
- Border: 0.5px solid var(--color-border-secondary)
- Border-radius: var(--border-radius-md)
- Padding: 6px 10px
- Cursor: pointer
- Flex-shrink: 0
- Transition: all .12s
- Contains: small fretboard SVG icon (26×18px, 3 strings × 3 frets, one dot at intersection, see section 12 for exact path data) + text label "Fretboard"
- Hover state: border-color #0d9488, color #085041, background rgba(13,148,136,.07)
- Active/open state (when fretboard panel is open): same as hover, maintained while panel is open
- This button toggles the fretboard detect panel (see section 9)

### Live key chip (right side, pushed by margin-left: auto)
- Background: rgba(13,148,136,.1)
- Border: 1.5px solid rgba(13,148,136,.32)
- Border-radius: var(--border-radius-md)
- Padding: 4px 10px
- Display: flex, flex-direction: column, align-items: flex-end, gap: 2px
- Flex-shrink: 0

Contents:
- "Detected key" label: 9px, text-transform uppercase, letter-spacing .8px, weight 500, color #085041
- Key name: JetBrains Mono, 18–20px, weight 500, color #0d9488, line-height 1
- Confidence dots row: 5 circles, 5×5px, border-radius 50%
  - Filled: background #0d9488
  - Empty: background var(--color-border-secondary)
  - Number of filled dots = confidence level (1–5) from the Zustand store

This chip updates in real time as chords are added or removed. It represents `keyToUse` and `confidence` from the store.

---

## 8. Key Row — Detailed Specification

### Three key rows, always visible, never collapsible

All three rows are permanently displayed. There is no expand/collapse behaviour. This is a hard requirement driven by UX research: users cannot hold three 7-chord palettes in short-term memory simultaneously, and tapping to reveal a palette while holding a guitar is too much friction.

The three rows are derived from the top 3 scoring keys from `scoreAllKeys()`. They are not hard-coded to G Major, E Minor, D Mixolydian — they are dynamic based on the current progression.

### Key row overall
- Border-bottom: 0.5px solid var(--color-border-tertiary)
- Flex-shrink: 0 (does not compress)
- Border-left: 4px solid [key colour at 50% opacity] — the primary visual differentiator between rows

### Key row header
- Display: flex, align-items: center
- Padding: 10px 14px 10px 10px (note left padding is 10px after the 4px border, giving 14px total visual indent)
- Gap: 8px
- Background: [key colour at ~9% opacity]

**Colour indicator dot (first item in header):**
- SVG circle, 10×10px
- Fill: [key full-strength colour]
- Flex-shrink: 0
- This dot is the clearest visual anchor for the key's colour identity

**Feel label (primary text):**
- Font: Source Sans 3, 14px, weight 500
- Color: [key dark-variant colour] — this is a darker, more accessible version of the key colour
- Flex: 1 (takes remaining space)
- Content is derived from the feel label lookup table in section 5

**Key name (secondary text):**
- Font: JetBrains Mono, 11px
- Color: [key full-strength colour]
- Flex-shrink: 0
- Content: e.g. "G Major", "E Minor", "D Mixolydian"
- Future: tapping this reveals the mode name (Ionian, Aeolian, Mixolydian) and a character description. Not in v1 scope.

### Chord palette
- Display: flex, gap: 5px
- Padding: 8px 12px 12px
- No flex-wrap — all 7 cards in a single horizontal row
- At full desktop width (1024px+), each card gets approximately 70–80px width, which is comfortable

### Palette chord card
- Flex: 1 (7 cards share available width equally)
- Padding: 8px 4px
- Border-radius: var(--border-radius-md)
- Text-align: center
- Cursor: pointer
- Min-width: 0 (allows shrinking below content width if needed)
- Transition: all 0.12s

**Card states:**

Default (chord not in user's progression):
- Background: var(--color-background-primary)
- Border: 0.5px solid var(--color-border-tertiary)
- Hover: border-color var(--color-border-secondary)

In-progression ("yours" — chord appears in the user's entered progression):
- Background: rgba(13,148,136,.10) — teal tint
- Border-color: rgba(13,148,136,.35) — teal border
- CRITICAL: This colour is ALWAYS TEAL regardless of which key row the card appears in. "Yours" chips do not take the key row's colour. This was tried and rejected — it caused chips to blend with the row background and lost the "your ownership" meaning. The teal chip = "you play this chord" — consistent everywhere.

Selected (user has tapped this card to view its diagram):
- Background: rgba(13,148,136,.18) — stronger teal tint
- Border: 1px solid #0d9488 — full-strength teal, 1px (not 0.5px)
- Tapping a selected card again deselects it (toggle behaviour)

**Chord name inside card:**
- Font: JetBrains Mono, 13px, weight 500
- Color: var(--color-text-primary) for default/new chords
- Color: #085041 (dark teal) for in-progression and selected cards

**Roman numeral inside card (below chord name):**
- Font: JetBrains Mono, 9px
- Margin-top: 2px
- Color for in-progression and selected cards: rgba(13,148,136,.85) (teal, since the chip itself is teal-tinted)
- Color for default (non-progression) cards: [the key row's full-strength colour]
  - G Major row: #0d9488
  - E Minor row: #6366f1
  - D Mixolydian row: #d97706
- This is where the circle-of-fifths colour coding is most functionally visible: the Roman numeral tells you this chord's role in this key, and its colour tells you which key that is.

### "Show more matched keys →" link
- Positioned below all three key rows, inside the left panel
- Padding: 8px 14px 14px
- Font: 11px, color: var(--color-text-tertiary)
- Hover: color #0d9488
- This opens the full 84-key ranked analysis view (see section 8b)

### 8b. Full ranked analysis view (behind "Show more")
The full ranked table from the original research tool belongs here. It is NOT removed — it is placed behind disclosure. The ranked table shows:
- All matched keys sorted by score
- Each row: rank, key name + mode, confidence bar, all 7 diatonic chord pills, Roman numerals beneath each pill, fit indicators (which progression chords appear in this key), modal character description
- Harmonic function colour coding: tonic (teal), subdominant (indigo), dominant (red), relative (amber)
- This view is appropriate for intermediate/advanced users who want the full reference

---

## 9. Right Diagram Panel — Detailed Specification

### Container
- Width: 224px, fixed (flex-shrink: 0)
- Background: var(--color-background-primary)
- Border-left: 0.5px solid var(--color-border-secondary)
- Display: flex, flex-direction: column, overflow: hidden
- Height: fills the full canvas height

### Empty state (no chord selected)
Shown on initial load and after deselection.

Layout: flex column, align-items: center, justify-content: center, padding: 24px, gap: 14px

Contents:
- Decorative fret grid SVG (52×46px, opacity .12):
  - 5 vertical lines (strings), 4 horizontal lines (frets), no dots
  - Uses currentColor so it adapts to theme
  - This simply communicates "a chord diagram will appear here" without text
- Hint text: "Tap any chord to see its fingering and how it's used in that key"
  - Font: 12px, color var(--color-text-tertiary), line-height 1.6, text-align center

Panel header area in empty state:
- Shows "CHORD" label only
- No close button in empty state (nothing to close)

### Filled state (chord selected)

**Panel header row:**
- Padding: 12px 14px 0
- Display: flex, align-items: center
- "CHORD" label: 9px, text-transform uppercase, letter-spacing .8px, weight 500, color var(--color-text-tertiary), flex: 1
- Close (×) button: 20×20px, border-radius 50%, font-size 12px, color var(--color-text-tertiary), no background or border, cursor pointer
  - Hover: background var(--color-background-secondary), color var(--color-text-primary)
  - On click: deselects chord, returns to empty state

**Chord name (large display text):**
- Font: Fraunces (serif), 28px, weight 500
- Color: var(--color-text-primary)
- Padding: 4px 14px 2px
- Line-height: 1
- Example: "Am", "F#°", "G" — large, serif, immediately readable at a glance

**Role line:**
- Font: JetBrains Mono, 11px
- Padding: 0 14px 12px
- Color: the full-strength colour of the key row this chord was selected from
  - If selected from G Major row: #0d9488
  - If selected from E Minor row: #6366f1
  - If selected from D Mixolydian row: #d97706
- Content format: "[Roman numeral] in [Key name]"
- Examples: "ii in G Major", "iv in E Minor", "♭7 in D Mixolydian"
- CRITICAL BEHAVIOUR: This line updates when the user taps a chord from a different key row while a chord is already selected. The fingering diagram stays the same (same physical chord shape). The role line and description update to reflect the new key context. This is the core multi-key learning moment.

**Fingering diagram:**
- Container padding: 0 14px
- SVG: 160px wide, 88px tall (fits the 196px content width with room)
- viewBox: "0 0 160 88"

SVG elements:
- 6 string lines (vertical): x positions calculated from SX array, from y=NY (nut) to y=NY+4*FH
  - String spacing: approximately 28px apart for 6 strings in 148px (SX = [8, 36, 64, 92, 120, 148])
  - stroke: currentColor, stroke-opacity .14, stroke-width .6
- 4 fret lines (horizontal): y = NY + f*FH for f=1..4
  - FH (fret height): 16px
  - stroke: currentColor, stroke-opacity .14, stroke-width .6
- Nut (top horizontal line at y=NY where NY=18):
  - If open position chord (start=1): stroke-opacity .58, stroke-width 2.5
  - If barre chord (start>1): stroke-opacity .2, stroke-width .8 (nut is visually de-emphasised)
  - For barre chords, show "[start]fr" text label at right edge (font-size 9, fill-opacity .4)
- Open string circles (above nut at y≈9):
  - r=4, fill none, stroke currentColor, stroke-opacity .28, stroke-width 1
- Muted string (×) markers (above nut at y≈11):
  - Text element, font-size 9, fill currentColor, fill-opacity .3, text-anchor middle
  - Character: × (U+00D7 multiplication sign)
- Finger dots at fret intersections:
  - r=6
  - fill: #0d9488 (always teal — the dot represents the physical finger position, not the harmonic context)
  - Position: cx = SX[stringIndex], cy = NY + (fretValue - 0.5) * FH

Standard chord fingerings (string order: [low E, A, D, G, B, high e], value = fret number, -1 = muted, 0 = open):
```
G:    frets [3,2,0,0,0,3], start: 1
Am:   frets [-1,0,2,2,1,0], start: 1
Bm:   frets [-1,1,3,3,2,1], start: 2  (relative positions displayed at fret 2)
C:    frets [-1,3,2,0,1,0], start: 1
D:    frets [-1,-1,0,2,3,2], start: 1
Em:   frets [0,2,2,0,0,0], start: 1
F#°:  frets [-1,-1,1,2,1,2], start: 4  (relative positions displayed at fret 4)
```

**Horizontal divider:**
- Height: 0.5px
- Background: var(--color-border-tertiary)
- Margin: 12px 14px (horizontal margin to inset from panel edges)

**Theory description:**
- Padding: 0 14px
- Font: 12px, color var(--color-text-secondary), line-height 1.65
- Flex: 1 (fills remaining panel height)
- Content: key-context-sensitive copy — see section 11

### Diagram panel behaviour rules

1. Tapping an unselected chord: selects it, shows filled state with that chord's fingering and role in that row's key
2. Tapping an already-selected chord (same chord, same row): deselects it, returns to empty state
3. Tapping a different chord (any row): updates the diagram to the new chord and its role in that row's key
4. Tapping the same chord in a different key row: updates role line and description to reflect the new key context; fingering diagram stays the same (same physical chord)
5. Clicking the × close button: deselects, returns to empty state
6. Opening the fretboard panel: does NOT close the diagram panel
7. Scrolling or using the input bar: does NOT close or reset the diagram panel

---

## 10. Circle of Fifths Colour Coding System

This is the key visual system differentiating the three key path rows. It must be clearly visible — not subtle. The left border is the primary visual anchor.

### Colour values by key

**G Major — Teal** (existing ChordPath accent colour)
```
Full-strength:     #0d9488
Dark variant:      #0f6e56  (for feel label text — accessible on light bg)
Row bg tint:       rgba(13,148,136,.09)
Left border:       4px solid rgba(13,148,136,.50)
```

**E Minor — Indigo** (cool, introspective — maps to minor/darker character)
```
Full-strength:     #6366f1
Dark variant:      #4338ca  (for feel label text)
Row bg tint:       rgba(99,102,241,.08)
Left border:       4px solid rgba(99,102,241,.52)
```

**D Mixolydian — Amber** (warm, earthy — maps to blues/rock character)
```
Full-strength:     #d97706
Dark variant:      #92400e  (for feel label text — good contrast on light)
Row bg tint:       rgba(217,119,6,.08)
Left border:       4px solid rgba(217,119,6,.52)
```

### Where each colour is applied

| Element | Colour applied |
|---|---|
| Key row left border (4px) | Key colour at 50–52% opacity |
| Key row header background | Key colour at 8–9% opacity |
| Colour indicator dot in header (10px circle) | Key full-strength colour |
| Feel label text | Key dark-variant colour |
| Key name text | Key full-strength colour |
| Roman numerals on non-progression chips in this row | Key full-strength colour |
| Roman numerals on in-progression chips in this row | rgba(13,148,136,.85) — teal, because chip background is already teal |
| Right panel role line (when chord from this row is selected) | Key full-strength colour |

### What the colour system does NOT do
- "Yours" chip backgrounds and borders are ALWAYS TEAL (rgba(13,148,136,.1) and rgba(13,148,136,.35)) regardless of key row — this is critical for consistency
- Selected chip state is ALWAYS TEAL (stronger fill, #0d9488 border) regardless of key row
- Finger dots in SVG diagrams are ALWAYS TEAL (#0d9488) regardless of key context
- The key colour does not affect any chord chip background

### New CSS custom properties to add
Add to `.theme-canvas` and equivalent dark mode overrides in `.theme-studio`:

```css
/* Key path circle-of-fifths colours */
--key-major-h: #0d9488;
--key-major-dk: #0f6e56;
--key-major-bg: rgba(13,148,136,.09);
--key-major-border: rgba(13,148,136,.50);

--key-minor-h: #6366f1;
--key-minor-dk: #4338ca;
--key-minor-bg: rgba(99,102,241,.08);
--key-minor-border: rgba(99,102,241,.52);

--key-mixo-h: #d97706;
--key-mixo-dk: #92400e;
--key-mixo-bg: rgba(217,119,6,.08);
--key-mixo-border: rgba(217,119,6,.52);
```

For `.theme-studio` (dark mode), the text variants need to be lighter:
```css
--key-major-dk: #5DCAA5;   /* light teal readable on dark */
--key-minor-dk: #a5b4fc;   /* light indigo */
--key-mixo-dk:  #fcd34d;   /* light amber */
```

### Why these three colours
The three colours map to mood and position in harmonic space:
- Teal: already established as ChordPath's accent — the "home" colour for the natural major
- Indigo: cool, introspective — maps to the inward character of natural minor
- Amber: warm, earthy, blues-adjacent — maps to the unresolved quality of Mixolydian

These are also three of ChordPath's existing harmonic function colours (tonic = teal, subdominant = indigo, relative = amber) — the visual system reinforces existing token meanings.

---

## 11. Theory Copy — Complete for All 21 Combinations

This is the text shown in the right panel description field. It is key-context-sensitive and must be implemented as a lookup keyed on both chord name and key context.

### G Major key context

| Chord | Roman | Description |
|---|---|---|
| G | I | Tonic — home base. The most stable chord in the key. Progressions naturally resolve here. |
| Am | ii | Supertonic — gentle tension. Often moves to D (V) to set up a resolution back to G. |
| Bm | iii | Mediant — connects the tonic to the subdominant. Common moves: Bm → C or Bm → Em. |
| C | IV | Subdominant — lifts away from home without strong tension. One of the most natural chord changes in pop and folk. |
| D | V | Dominant — the strongest tension point in the key. Creates a pull that almost always resolves to G. |
| Em | vi | Relative minor — shares all notes with G Major. Adds emotional depth without leaving the key. |
| F#° | vii° | Leading tone chord — highly unstable. Almost always resolves directly to G (I). Use for dramatic pull. |

### E Minor key context

| Chord | Roman | Description |
|---|---|---|
| Em | i | Tonic — home in the minor key. Darker and more restless than a major tonic. Progressions return here. |
| F#° | ii° | Supertonic diminished — tense and unstable. Typically moves to III (G) or v (Bm) to release. |
| G | III | Relative major — the brightest chord in the minor key. A natural contrast before returning to Em. |
| Am | iv | Subdominant — deepens the dark, introspective feel. Very common in ballads and emotional writing. |
| Bm | v | Minor dominant — softer tension than a major V chord. Floats rather than pulling hard toward home. |
| C | VI | Submediant — a brief moment of warmth and brightness before the minor pulls back. |
| D | VII | Subtonic — adds forward drive. A common sequence: D → Em brings you directly home. |

### D Mixolydian key context

| Chord | Roman | Description |
|---|---|---|
| D | I | Tonic — home in Mixolydian. Sounds major but carries a slightly open, unresolved quality. |
| Em | ii | Supertonic — a minor chord that adds a touch of melancholy to the otherwise bright mode. |
| F#° | iii° | Mediant diminished — rarely used in Mixolydian. Tense and chromatic against the mode's character. |
| G | IV | Subdominant — moves naturally to and from the ♭7 (C). A cornerstone of rock and blues writing. |
| Am | v | Minor dominant — no strong pull home. Keeps the floating, unresolved feel of the mode alive. |
| Bm | vi | Submediant — adds depth and melancholy. Less common in Mixolydian but usable for contrast. |
| C | ♭7 | Subtonic — the chord that defines Mixolydian. The gap between D (I) and C (♭7) is where the bluesy colour lives. |

---

## 12. Fretboard Detection Panel — Detailed Specification

### Role in the product (important framing)
The fretboard panel is a secondary, optional tool. It exists for users who cannot identify the name of a chord they're playing. The primary chord entry workflow is typing. This is a helper — a separate workflow that the user picks up and puts down. It must not feel like the main entry point.

### How it is triggered
- "Fretboard" button in the input bar (see section 7)
- "Fretboard" button in the nav bar
- Both toggle the panel open and closed
- Both show an active/open state while the panel is open

### Panel positioning
- Position: absolute within the canvas div (which must be position: relative)
- Covers the full canvas area (below the nav bar and input bar — NOT covering those)
- The user can still see their chord progression in the input bar while the fretboard panel is open
- Background: rgba(0,0,0,.38) — overlay behind the panel
- Panel is centred in the canvas: display flex, align-items center, justify-content center, z-index 10
- Do NOT use position: fixed

### Panel container
- Width: 340px
- Background: var(--color-background-primary)
- Border: 0.5px solid var(--color-border-secondary)
- Border-radius: var(--border-radius-lg)
- Padding: 18px

### Panel contents (top to bottom)

**Header row:**
- "Identify a chord" — font 14px, weight 500, var(--color-text-primary), flex: 1
- × close button: 24×24px, border-radius 50%, no background or border, font-size 14px, var(--color-text-secondary), hover adds background

**Subtitle:**
- "Tap the fret positions matching your finger placement, or type the chord name directly in the input bar above."
- Font: 11px, var(--color-text-tertiary), line-height 1.5, margin-bottom: 14px

**Fretboard SVG:**
- Width: 304px (fills panel minus 18px padding each side)
- Height: 170px
- 6 strings labelled E A D G B e at top (9px monospace, opacity .38)
- String x positions: 10, 66, 122, 178, 234, 290 (spacing ~56px across 304px width — generous for touch targets)
- Nut at y=28: stroke-width 2.5, opacity .6
- 4 fret lines at y=63, 98, 133, 168: stroke-width .8, opacity .18
- 6 vertical string lines from nut to bottom fret: stroke-width .8, opacity .18
- Fret number labels (1, 2, 3, 4) at x≈298, 9px, opacity .28
- Open string indicators above nut: circles at y≈20, r=5, fill none, stroke opacity .25
- Finger dot radius: 12px (larger than the mini diagram — this is an interactive touch target)
- Finger dots fill: #0d9488
- Position marker dot at fret 3 (between strings 3 and 4): r=4, fill currentColor, opacity .1 — decorative

**Initial/default fretboard state:**
Shows Em pattern (the chord that will most commonly come up if no prior input): string A at fret 2, string D at fret 2.

**Real implementation:**
The fretboard should be interactive — tapping a string/fret intersection toggles a finger dot, and the detected chord name updates in real time using the existing chord parsing logic in `theory/keyDetection.ts`. The `parseChord` function or equivalent should accept a set of (string, fret) positions and return a chord name with confidence. The initial implementation can use the static prototype state; wire to real detection in a second pass.

**Detected chord indicator row:**
- Background: rgba(13,148,136,.07)
- Border: 0.5px solid rgba(13,148,136,.25)
- Border-radius: var(--border-radius-md)
- Padding: 9px 12px
- Display: flex, align-items: center, gap: 10px
- "Detected" label: 11px, var(--color-text-tertiary)
- Chord name: JetBrains Mono, 18px, weight 500, color #085041
- Confidence dots: 5 dots, same style as the key chip dots, margin-left: auto
- Margin: 12px 0

**Action buttons row:**
- Display: flex, gap: 8px, margin-top: 14px
- "Add [chord] to progression" button: flex 1, padding 9px, background #0d9488, color white, font-size 12px, weight 500, border-radius var(--border-radius-md), no border — clicking adds detected chord to strip and closes panel
- "Done" button: padding 9px 14px, background none, border 0.5px solid var(--color-border-secondary), color var(--color-text-secondary), font-size 12px — closes panel without adding chord

### Small fretboard SVG icon (for the Fretboard button in input bar)
```svg
<svg width="14" height="11" viewBox="0 0 14 11" fill="none">
  <!-- 3 horizontal strings -->
  <line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" stroke-opacity=".6" stroke-width=".8"/>
  <line x1="0" y1="5.5" x2="14" y2="5.5" stroke="currentColor" stroke-opacity=".6" stroke-width=".8"/>
  <line x1="0" y1="9" x2="14" y2="9" stroke="currentColor" stroke-opacity=".6" stroke-width=".8"/>
  <!-- 3 vertical frets -->
  <line x1="3.5" y1="0" x2="3.5" y2="11" stroke="currentColor" stroke-opacity=".4" stroke-width=".8"/>
  <line x1="7" y1="0" x2="7" y2="11" stroke="currentColor" stroke-opacity=".4" stroke-width=".8"/>
  <line x1="10.5" y1="0" x2="10.5" y2="11" stroke="currentColor" stroke-opacity=".4" stroke-width=".8"/>
  <!-- Single finger dot -->
  <circle cx="7" cy="5.5" r="2" fill="currentColor" fill-opacity=".7"/>
</svg>
```

---

## 13. Navigation Bar — Specification

- Height: 38px
- Background: var(--color-text-primary) — near-black in Canvas (light) mode, providing contrast
- Display: flex, align-items: center, padding: 0 14px, gap: 8px, flex-shrink: 0

**Logo:**
- "Chord" in var(--color-background-primary) (white/light against dark nav)
- "Path" in #5DCAA5 (lighter teal, readable against dark nav)
- Font: Fraunces (serif), 17px, weight 500

**Spacer:** flex: 1

**Nav buttons (right, left to right):**
1. "Fretboard" — triggers fretboard panel
2. "Library" — opens chord library (existing feature, keep)
3. "◑ Canvas" — theme toggle (existing feature, keep)

**Nav button style:**
- Font: 11px
- Color: rgba(255,255,255,.45)
- Background: rgba(255,255,255,.07)
- Border: 0.5px solid rgba(255,255,255,.15)
- Border-radius: var(--border-radius-md)
- Padding: 3px 10px
- Cursor: pointer
- Transition: all .12s
- Hover: background rgba(255,255,255,.16), color rgba(255,255,255,.85)
- Active/open (Fretboard button while panel is open): background rgba(13,148,136,.3), border-color rgba(13,148,136,.5), color #5DCAA5

---

## 14. Typography System

No changes to the font system. Ensure all three fonts are loaded.

- **UI / body text:** Source Sans 3 — all labels, descriptions, body copy, button labels
- **Chord names / Roman numerals / key names / monospace data:** JetBrains Mono — chord names in chips, palette cards, diagram panel chord name display (when Fraunces not available), input field text, key name text in row headers
- **Display:** Fraunces (serif) — logo, chord name in right panel (the large 28px display), optionally key name in future hero treatment

**Font size guide:**
- Nav logo: 17px
- Feel label in row header: 14px
- Chord name in palette card: 13px
- Chord name in input strip chip: 14px (JetBrains Mono)
- Chord name in right panel: 28px (Fraunces)
- Key name in row header: 11px (JetBrains Mono)
- Role line in right panel: 11px (JetBrains Mono)
- Theory description in right panel: 12px (Source Sans 3)
- Roman numeral in palette card: 9px (JetBrains Mono) — acceptable at this size since it's supplementary information
- Roman numeral in input strip chip: 8px (JetBrains Mono)
- "Detected key" label in key chip: 9px uppercase
- Key name in key chip: 18–20px (JetBrains Mono or Fraunces)
- "Show more matched keys →": 11px
- Fretboard button label: 11px
- Add button label: 11px
- Placeholder text in chord input: 11px

---

## 15. Colour Tokens — Full Reference

### Existing ChordPath Canvas theme tokens (do not change)
```
--color-background:    #f7f6f2
--color-surface:       #ffffff
--color-surface-2:     #f0efe9
--color-border:        #dedad2
--color-text:          #1a1916
--color-accent:        #0d9488
--chord-tonic:         #0d9488
--chord-subdominant:   #6366f1
--chord-dominant:      #dc2626
--chord-relative:      #d97706
```

### New tokens to add (key path circle-of-fifths colours)

For `.theme-canvas` (light mode):
```css
--key-major-h:      #0d9488;
--key-major-dk:     #0f6e56;
--key-major-bg:     rgba(13,148,136,.09);
--key-major-border: rgba(13,148,136,.50);

--key-minor-h:      #6366f1;
--key-minor-dk:     #4338ca;
--key-minor-bg:     rgba(99,102,241,.08);
--key-minor-border: rgba(99,102,241,.52);

--key-mixo-h:       #d97706;
--key-mixo-dk:      #92400e;
--key-mixo-bg:      rgba(217,119,6,.08);
--key-mixo-border:  rgba(217,119,6,.52);
```

For `.theme-studio` (dark mode) — text variants need to be lighter for dark backgrounds:
```css
--key-major-dk:     #5DCAA5;
--key-minor-dk:     #a5b4fc;
--key-mixo-dk:      #fcd34d;
/* Background tints and border values remain the same (rgba values adapt) */
```

---

## 16. Component Mapping — Existing Code to New Design

### Keep unchanged (do not touch)
- `theory/keyDetection.ts` — 84-key scoring engine, parseChord, MODES
- `theory/suggestions.ts` — next chord suggestions, pattern matching
- `store/useAppStore.ts` — Zustand store (may need new state fields — see section 17)
- `Fretboard/Fretboard.tsx` — the interactive SVG fretboard component (moved to the detect panel)

### Restructure (not rewrite)

**ProgressionBoard → Input Strip:**
`ProgressionBoard.tsx` and `ChordCard.tsx` are restructured as the compact horizontal input strip. Changes:
- Chord cards become compact chips (smaller, monospace name + small Roman numeral + × button)
- Add: text input + Add button as a new sibling to the chips
- Add: thin separator
- Add: "Fretboard" secondary button
- Remove: the large fretboard-first layout
- Move the live key indicator from wherever it currently is to the right side of this bar

**TheoryPanel → Left Panel Key Rows + Right Diagram Panel:**
`TheoryPanel.tsx` is replaced by two new components:

Left panel receives content from:
- `KeyHero.tsx` → row headers (feel label + key name + dot) and the live key chip in the input bar
- `DiatonicChords.tsx` → the palette row inside each key row
- `ScaleDisplay.tsx` → moved to secondary disclosure (behind "show more"), not in primary view in v1
- `SuggestionList.tsx` → moved to secondary disclosure, not in primary view in v1
- `PatternMatch.tsx` → moved to secondary disclosure, not in primary view in v1

Right panel is a new component receiving:
- Selected chord name and key context from new state fields
- Fingering diagram rendered from the chord data lookup (see section 9)
- Theory description from the ROLES lookup (see section 11)

### New components to create

`KeyRow.tsx`:
- Props: keyId ('major' | 'minor' | 'mixo'), feel (string), name (string), chords (string[]), progressionChords (string[]), selectedChord (string | null), selectedKeyContext (string | null), colours (KeyColour object)
- Renders: header row (dot + feel label + key name) with circle-of-fifths colour system + palette

`PaletteCard.tsx`:
- Props: chordName, romanNumeral, isInProgression, isSelected, keyColour, onTap
- Renders: a single chord card with correct state styling

`DiagramPanel.tsx`:
- Props: selectedChord (string | null), selectedKeyContext (string | null), onClose
- Renders: empty state or filled state depending on selectedChord

`ChordInputStrip.tsx` (or extend existing ProgressionBoard):
- Contains: chord chips, text input, add button, separator, fretboard button, key chip

`FretboardPanel.tsx`:
- Wraps existing `Fretboard.tsx`
- Adds: detected chord indicator, add/done action buttons
- Position: absolute overlay on the canvas

### Layout grid change (critical)
**Current:** CSS grid `150px 1fr 285px` applied at the top level
**New:** Flex column:
```
<AppContainer> (height: 100vh, display: flex, flex-direction: column)
  <Nav>            (height: 38px, flex-shrink: 0)
  <InputBar>       (min-height: 64px, flex-shrink: 0)
  <Canvas>         (flex: 1, display: flex, flex-direction: row, position: relative, overflow: hidden)
    <LeftPanel>      (flex: 1, overflow-y: auto)
    <RightPanel>     (width: 224px, flex-shrink: 0)
    <FretboardOverlay>  (position: absolute, covers full Canvas)
```

The `150px` left column is retired entirely. The chord library (currently in `LeftPanel.tsx`) may be accessed via the "Library" nav button in a future slide-out panel — it is not a primary surface.

---

## 17. State Management — New Fields Required

### Existing store state (confirmed available, do not remove)
- `keyToUse` — string, e.g. "G"
- `inferredMode` — string, e.g. "Major", "Dorian", "Minor"
- `confidence` — integer 1–5
- `borrowedChords` — string[]
- `tiedKeys` — string[]
- `scaleNotes` — string[]
- `progression` — array of chord slots
- `suggestions` — ChordSuggestion[]
- `scoreAllKeys()` — function returning full 84-key score table

### New state fields to add to `useAppStore.ts`

```typescript
// Diagram panel selection state
selectedChordName: string | null;        // which chord is selected in the right panel
selectedChordKeyContext: string | null;  // 'major' | 'minor' | 'mixo' — which row it came from

// Fretboard panel state
fretboardPanelOpen: boolean;
detectedChordName: string | null;       // chord currently identified in the fretboard panel
detectedChordConfidence: number;        // 0–5 confidence from fretboard detection

// Actions
setSelectedChord: (chordName: string | null, keyContext: string | null) => void;
clearSelectedChord: () => void;
setFretboardOpen: (open: boolean) => void;
setDetectedChord: (chord: string | null, confidence: number) => void;
```

### Dynamic key rows from scoreAllKeys()
The three key rows are not hard-coded. They are derived from the top 3 results of `scoreAllKeys()`. A key-to-context mapping is needed:

```typescript
// Map a scoring result to a key context identifier ('major' | 'minor' | 'mixo')
// This determines which circle-of-fifths colour set to use
function getKeyContext(mode: string): 'major' | 'minor' | 'mixo' {
  switch(mode) {
    case 'Ionian': return 'major';
    case 'Lydian': return 'major';    // bright, major-like
    case 'Aeolian': return 'minor';
    case 'Dorian': return 'minor';    // minor-like
    case 'Phrygian': return 'minor';  // minor-like
    case 'Mixolydian': return 'mixo';
    case 'Locrian': return 'mixo';    // unstable, use mixo colour
    default: return 'major';
  }
}
```

This is a simplification for v1. In future, each mode could have its own colour token.

---

## 18. UX Research Findings That Drove Final Decisions

| Principle | Source | Decision Made |
|---|---|---|
| Primary user flow content must always be visible | NN/G; UX Bootcamp | All key palettes permanently expanded, no collapse |
| Every click has an interaction cost | UX Bootcamp | One tap to see a chord diagram — the only required action in a session |
| Accordion panels: give users capability to open multiple sections; opened sections stay open until user changes them | NN/G (2024) accordion guidance | Never auto-collapse a key row |
| Tabs increase cognitive load when users need to compare across sections | NN/G tabs research | No tabs between key views — all visible simultaneously |
| When users need to simultaneously see information under different sections, showing everything on one page outperforms tabs | NN/G tabs research | Three always-open key rows |
| Glanceable design: prioritise key metrics on first screen | Mobile/dashboard UX | Chord name, feel label, key name all readable without interaction |
| Companion-to-physical-instrument design: minimal screen time per interaction | Electronic instrument cluster UX principles | Designed for 10 seconds of screen use per session; minimum taps |
| Information density: desktop creative tools should lean denser than consumer apps | LogRocket information density research | 7 chord cards per row, Roman numerals always visible, no excessive whitespace |
| Context-sensitive content outperforms generic content | Content strategy principles | Theory descriptions are key-context-specific (21 distinct descriptions) |
| Colour as primary signal; text as secondary | Visual hierarchy principles | "Yours" chord state communicated by teal tint, no text label needed |

---

## 19. Decisions Resolved (no longer open)

**How is the fretboard integrated?**
As a separate overlay panel triggered by a secondary "Fretboard" button. Primary chord entry is typing. Fretboard is an optional tool for users who cannot identify a chord by name. The fretboard does not disrupt the main layout.

**How many key paths to show?**
3 always-visible, always-expanded rows. The 4th–Nth are behind "Show more matched keys →". Three covers the bright/dark/modal triad produced by most 4-chord progressions without making the page unscannably long.

**Where does the diagram panel live?**
Fixed right column, 224px, always present. It is always on screen. It does not appear or disappear; it changes state (empty vs filled). This permanently solves the "diagram disappears when switching rows" problem.

**Should the diagram stay open when switching key rows?**
Yes. The fingering stays the same; the role line and description update. This is the core multi-key learning moment — same hand shape, different harmonic meaning.

**Should the diagram dismiss when tapping the same chord again?**
Yes — toggle behaviour. Tapping an already-selected chord deselects it and returns the right panel to empty state.

**Should there be a close button on the diagram panel?**
Yes — a small × (20×20px, rounded) in the panel header. Always visible in the filled state.

**Should "yours" chips use the key row's colour?**
No. This was prototyped and rejected. "Yours" chips are always teal. The key colour lives in the Roman numerals, feel label, left border, and role line — not the chip background.

**High-fidelity mockup before building?**
No. The interactive prototypes built during design are already functionally high-fidelity. They use the actual ChordPath colour system, real chord data, and real interactions. A Figma file would be a translation layer that adds time without adding information. ChordPath is a single view, the colour tokens exist, the component structure is mapped. Build and tweak as you go.

---

## 20. Implementation Order

Work in this sequence to avoid structural rework:

**Step 1: Replace layout grid**
Remove the `150px 1fr 285px` CSS grid. Implement the new flex layout:
- AppContainer: flex column, height 100vh
- Nav: 38px
- InputBar: min-height 64px
- Canvas: flex 1, flex row, position relative

Do not touch component internals yet. Get the structure correct first.

**Step 2: Build InputBar**
- Chord chips (compact: name + small Roman numeral + × button)
- Text input + Add button (primary chord entry)
- Thin separator
- Fretboard secondary button (outline style, icon + label)
- Live key chip on the right

Wire text input to add chords to the progression state. Wire × buttons to remove chords. Wire Enter key to submit.

**Step 3: Build left panel key rows**
- Create KeyRow component
- Create PaletteCard component
- Derive top 3 keys from scoreAllKeys()
- Apply circle-of-fifths colours per row
- "Yours" state on cards (always teal)
- Roman numeral colours (key colour for new cards, teal tint for yours cards)
- Card selection state

**Step 4: Build right diagram panel**
- Create DiagramPanel component
- Empty state: faint fret grid SVG + hint text
- Filled state: chord name (Fraunces), role line (key colour), fingering SVG, divider, description
- Close button
- Chord fingering SVG renderer function (takes chord name → SVG)
- Description lookup (chord × key context → copy from section 11)
- Connect to selectedChordName and selectedChordKeyContext state

**Step 5: Apply circle-of-fifths colours**
- Add new CSS custom properties to both themes
- Apply to key row left borders, header backgrounds, dots, feel label text, key name text, Roman numerals
- Verify all three rows are visually distinct at a glance
- Verify "yours" chips remain consistently teal in all rows

**Step 6: Build fretboard overlay panel**
- Create FretboardPanel component wrapping existing Fretboard.tsx
- Position: absolute over Canvas
- Detected chord indicator
- Add and Done action buttons
- Wire open/close to fretboardPanelOpen state
- Wire "Add to progression" button

**Step 7: Secondary features and cleanup**
- Move ScaleDisplay, SuggestionList, PatternMatch to behind "Show more matched keys →"
- Wire full 84-key ranked table to the "Show more" disclosure
- Add mode name disclosure (tapping key name shows Ionian / Aeolian / Mixolydian label) — lower priority
- Dark mode (Studio theme) adjustments for new colour tokens

---

## 21. Scope Boundaries — What v1 Does Not Include

Do not implement these in the initial redesign pass:

- Audio playback of chords
- Mobile layout (desktop only, minimum 1024px wide)
- User accounts or session persistence
- Cross-session memory ("you've been writing in G Major for 3 months")
- Autocomplete suggestions in the chord text input
- Drag-to-reorder chord chips in the progression strip
- Full fretboard interactive chord detection (panel UI is built; detection logic connection can be a second pass)
- Mode name tap-to-reveal interaction on key name (panel UI structure supports it; wire logic later)

---

*Document version: Post-design-brainstorm, pre-implementation*
*Compiled from: initial brief, multiple prototype iterations, UX research review, interactive prototype testing across 3 layout concepts and multiple interaction refinements*
*Purpose: Primary implementation handoff document for Claude Code*
*Covers: product definition, user research, information hierarchy, language rules, layout architecture, detailed component specs, circle-of-fifths colour system, theory copy (all 21 combinations), fingering data, fretboard panel spec, nav spec, typography, colour tokens, component mapping, state management, UX research basis, and implementation order*
