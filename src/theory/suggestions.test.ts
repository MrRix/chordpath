import { suggestNextChords } from "./suggestions"
import { test, expect } from "vitest"

test("Am-F suggests G (V) for C major", () => {
  const s = suggestNextChords(["Am", "F"], "C", "major")
  expect(s.some(x => x.chordName === "G")).toBe(true)
})
