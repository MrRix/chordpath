import { KeyHero } from "./KeyHero"
import { ScaleDisplay } from "./ScaleDisplay"
import { SuggestionList } from "./SuggestionList"
import { PatternMatch } from "./PatternMatch"
import { DiatonicChords } from "./DiatonicChords"

export function TheoryPanel() {
  return (
    <aside style={{
      width: 285,
      background: "var(--panel-bg)",
      borderLeft: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "12px 14px",
      gap: 16,
      overflowY: "auto",
    }}>
      <KeyHero />
      <ScaleDisplay />
      <SuggestionList />
      <PatternMatch />
      <DiatonicChords />
    </aside>
  )
}
