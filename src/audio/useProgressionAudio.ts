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
    Tone.getTransport().bpm.value = bpm
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
    Tone.getTransport().stop()
    synthRef.current?.releaseAll()
  }, [])

  return { playChord, playProgression, stop }
}
