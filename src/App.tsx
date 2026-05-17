import { useEffect } from 'react'
import './index.css'
import Nav from './components/Nav/Nav'
import ChordInputStrip from './components/ChordInputStrip/ChordInputStrip'
import KeyRows from './components/KeyRows/KeyRows'
import DiagramPanel from './components/DiagramPanel/DiagramPanel'
import FretboardPanel from './components/FretboardPanel/FretboardPanel'

function App() {
  // Always use canvas theme — dark mode infrastructure is preserved but not shown
  useEffect(() => {
    document.body.className = 'theme-canvas'
  }, [])

  return (
    <div
      className="theme-canvas"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        overflow: 'hidden',
      }}
    >
      {/* 38px nav bar */}
      <Nav />

      {/* 64px+ input bar */}
      <ChordInputStrip />

      {/* Canvas: key rows + diagram panel, with fretboard overlay */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left: key rows */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <KeyRows />
        </div>

        {/* Right: 224px diagram panel */}
        <DiagramPanel />

        {/* Absolute overlay: fretboard detect panel */}
        <FretboardPanel />
      </div>
    </div>
  )
}

export default App
