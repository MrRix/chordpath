import { useEffect } from 'react'
import './index.css'
import Nav from './components/Nav/Nav'
import ChordInputStrip from './components/ChordInputStrip/ChordInputStrip'
import KeyRows from './components/KeyRows/KeyRows'
import DiagramPanel from './components/DiagramPanel/DiagramPanel'
import FretboardPanel from './components/FretboardPanel/FretboardPanel'
import { useIsMobile } from './hooks/useIsMobile'

function App() {
  const isMobile = useIsMobile()

  // Always use canvas theme
  useEffect(() => {
    document.body.className = 'theme-canvas'
  }, [])

  return (
    <div
      className="theme-canvas"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        overflow: 'hidden',
      }}
    >
      <Nav />
      <ChordInputStrip />

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Key rows — full width on mobile */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <KeyRows />
        </div>

        {/* Diagram panel — side column on desktop, bottom sheet on mobile */}
        <DiagramPanel isMobile={isMobile} />

        {/* Fretboard overlay */}
        <FretboardPanel isMobile={isMobile} />
      </div>
    </div>
  )
}

export default App
