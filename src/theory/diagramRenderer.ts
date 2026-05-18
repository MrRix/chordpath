/**
 * diagramRenderer.ts — Custom SVG chord diagram renderer.
 *
 * Standard chord chart proportions — compact portrait shape.
 *
 * Padding design:
 *   padL = 32  — left space for fret-position label (fits "10fr" at 10px mono)
 *   padR = 16  — right clearance >= dotR so rightmost dot never clips
 *   padT = 26  — top space for ○/× indicators above nut
 *   padB = 14  — bottom breathing room so bottom-slot dot never clips
 *
 * Coordinate system:
 *   - String index 0 = low E (leftmost), index 5 = high e (rightmost)
 *   - frets[i]: 0=open, -1=muted, 1–N = relative slot position within grid
 *   - baseFret: actual guitar fret number at the top of the displayed grid
 */

import type { ChordPosition } from './chordsDb'

interface DiagramOptions {
  bassNote?: string   // e.g. 'B' for G/B — label shown below lowest active string
  width?:   number   // default 148
  height?:  number   // default 178
}

export function drawDiagram(voicing: ChordPosition, opts: DiagramOptions = {}): string {
  const w = opts.width  ?? 148
  const h = opts.height ?? 178

  const { frets, fingers, barres, baseFret } = voicing
  const numStrings = 6
  const numFrets   = 5

  // Fixed padding — chosen so fret labels and edge dots never clip
  const padL = 32
  const padR = 16
  const padT = 26
  const padB = opts.bassNote ? 22 : 14

  const gW   = w - padL - padR          // grid width  (between outer strings)
  const gH   = h - padT - padB          // grid height (top fret → bottom fret)
  const sGap = gW / (numStrings - 1)
  const fGap = gH / numFrets

  const isOpen = baseFret === 1

  // Dot radius — relative to fret slot height, capped so adjacent dots don't touch
  const dotR    = Math.min(10, Math.max(8, Math.round(fGap * 0.38)))
  const dotFont = dotR                    // finger number font size (same as radius)
  const mrkFont = Math.round(dotR * 1.1) // ○/× marker font size

  // ── Theme colours ──────────────────────────────────────────────────────────
  const cs  = typeof document !== 'undefined' ? getComputedStyle(document.body) : null
  const get = (v: string, fb: string) => cs?.getPropertyValue(v).trim() || fb

  const dotColor  = '#5EBEC4'
  const bgDot     = get('--panel-bg',   '#F9F6EC')
  const fretColor = get('--fret-color', '#D4CAA8')
  const strColor  = get('--string-color','#9A8E7A')
  // For nut, fret label, and markers: use the app's primary text color (dark)
  const darkColor = get('--text',       '#2D2926')

  // ── Helpers ────────────────────────────────────────────────────────────────
  // y-centre of a relative fret slot (1-based within displayed grid)
  const slotY = (rel: number) => padT + (rel - 0.5) * fGap
  // x position of a string (0=low E, 5=high e)
  const strX  = (si: number) => Math.round(padL + si * sGap)

  // ── SVG root ───────────────────────────────────────────────────────────────
  let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ` +
    `xmlns="http://www.w3.org/2000/svg" ` +
    `style="width:100%;height:auto;display:block;max-width:${w}px">`

  // ── Nut or fret-position label + cap line ──────────────────────────────────
  if (isOpen) {
    // Thick nut bar at the top of the grid
    svg += `<rect x="${padL}" y="${padT - 3}" width="${gW}" height="4.5" rx="1.5" ` +
      `fill="${darkColor}" opacity="0.85"/>`
  } else {
    // Thin cap line closes the top of the frame
    svg += `<line x1="${padL}" y1="${padT}" x2="${padL + gW}" y2="${padT}" ` +
      `stroke="${fretColor}" stroke-width="1.2"/>`
    // Fret-position label — LEFT of grid, vertically centred in first fret slot.
    // padL=32 accommodates "10fr" (4 chars at 10px mono ≈ 24px) with 8px left margin.
    // text-anchor="end" right-aligns the label flush with the grid edge.
    const labelY = slotY(1) + dotFont * 0.35
    svg += `<text x="${padL - 6}" y="${labelY}" font-size="10" fill="${darkColor}" ` +
      `font-family="'JetBrains Mono',monospace" font-weight="700" ` +
      `text-anchor="end">${baseFret}fr</text>`
  }

  // ── Fret lines ─────────────────────────────────────────────────────────────
  for (let f = 1; f <= numFrets; f++) {
    const y = padT + f * fGap
    svg += `<line x1="${padL}" y1="${y}" x2="${padL + gW}" y2="${y}" ` +
      `stroke="${fretColor}" stroke-width="0.7"/>`
  }

  // ── String lines ───────────────────────────────────────────────────────────
  for (let s = 0; s < numStrings; s++) {
    const x = strX(s)
    svg += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + gH}" ` +
      `stroke="${strColor}" stroke-width="0.7"/>`
  }

  // ── Barre pills ────────────────────────────────────────────────────────────
  // Infer span from which strings share the same fret slot value.
  barres.forEach(barreRel => {
    const barredIdxs = frets
      .map((f, i) => f === barreRel ? i : -1)
      .filter(i => i >= 0)
    if (barredIdxs.length < 2) return

    const fromSi = Math.min(...barredIdxs)
    const toSi   = Math.max(...barredIdxs)
    const cy  = slotY(barreRel)
    const x1  = strX(fromSi)
    const x2  = strX(toSi)
    const r   = dotR

    svg += `<rect x="${x1 - r}" y="${cy - r}" width="${x2 - x1 + r * 2}" height="${r * 2}" ` +
      `rx="${r}" fill="${dotColor}"/>`
    svg += `<text x="${(x1 + x2) / 2}" y="${cy + dotFont * 0.38}" ` +
      `font-size="${dotFont}" fill="${bgDot}" font-weight="700" ` +
      `text-anchor="middle" font-family="'JetBrains Mono',monospace">1</text>`
  })

  // ── Per-string indicators ─────────────────────────────────────────────────
  const aboveY = padT - 8

  frets.forEach((fret, si) => {
    const x = strX(si)

    if (fret === -1) {
      svg += `<text x="${x}" y="${aboveY}" font-size="${mrkFont}" fill="${darkColor}" ` +
        `text-anchor="middle" font-family="'JetBrains Mono',monospace" opacity="0.55">×</text>`
    } else if (fret === 0) {
      const r = Math.round(dotR * 0.46)
      svg += `<circle cx="${x}" cy="${aboveY - r}" r="${r}" fill="none" ` +
        `stroke="${darkColor}" stroke-width="1.2" opacity="0.55"/>`
    } else {
      // Skip strings covered by the barre
      if (barres.includes(fret)) return
      const cy = slotY(fret)
      svg += `<circle cx="${x}" cy="${cy}" r="${dotR}" fill="${dotColor}"/>`
      const fn = fingers[si] ?? 0
      if (fn > 0) {
        // fn === 5 = thumb-over voicing — render "T" (slightly smaller to fit)
        const fnLabel  = fn === 5 ? 'T' : fn
        const fnSize   = fn === 5 ? Math.round(dotFont * 0.82) : dotFont
        svg += `<text x="${x}" y="${cy + fnSize * 0.38}" ` +
          `font-size="${fnSize}" fill="${bgDot}" font-weight="700" ` +
          `text-anchor="middle" font-family="'JetBrains Mono',monospace">${fnLabel}</text>`
      }
    }
  })

  // ── Bass note label (slash chords) ─────────────────────────────────────────
  if (opts.bassNote) {
    const activeSi = frets.findIndex(f => f !== -1)
    const lx = activeSi >= 0 ? strX(activeSi) : padL
    const ly = padT + gH + 15
    svg += `<text x="${lx}" y="${ly}" font-size="9" fill="${dotColor}" ` +
      `text-anchor="middle" font-family="'JetBrains Mono',monospace" font-weight="600">${opts.bassNote}</text>`
  }

  svg += `</svg>`
  return svg
}
