import { Note, Interval } from "tonal"

export interface FretPosition { string: number; fret: number }

const STANDARD_TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"]

export function noteAtPosition(stringIndex: number, fret: number): string {
  const open = STANDARD_TUNING[stringIndex]
  const transposed = Note.transpose(open, Interval.fromSemitones(fret))
  return Note.pitchClass(transposed)
}

export function positionsToNotes(positions: FretPosition[]): string[] {
  return [...new Set(positions.map(p => noteAtPosition(p.string, p.fret)))]
}
