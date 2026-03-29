import React, { useEffect, useState } from 'react'
import './GameStartScreen.css'

interface GameStartScreenProps {
  onStart: () => void
}

const GameStartScreen: React.FC<GameStartScreenProps> = ({ onStart }) => {
  const [blink, setBlink] = useState(true)

  // Blink "press to start" text
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 600)
    return () => clearInterval(id)
  }, [])

  // Allow keyboard start
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onStart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onStart])

  return (
    <div className="start-screen" onClick={onStart}>
      <div className="start-screen__bg" aria-hidden />

      <div className="start-screen__content">
        <div className="start-screen__subtitle">AN ECS GAME ENGINE DEMO</div>
        <h1 className="start-screen__title">KATA<br />QUEST</h1>
        <div className="start-screen__divider" />
        <div className="start-screen__features">
          <span>⚔ Combat</span>
          <span>🗺 3 Levels</span>
          <span>🧙 NPCs</span>
          <span>🎒 Inventory</span>
        </div>
        <div className={`start-screen__prompt${blink ? '' : ' start-screen__prompt--hidden'}`}>
          PRESS ENTER OR CLICK TO START
        </div>
        <div className="start-screen__hints">
          <kbd>WASD</kbd> Move &nbsp;·&nbsp;
          <kbd>Space</kbd> Attack &nbsp;·&nbsp;
          <kbd>?</kbd> Controls
        </div>
      </div>
    </div>
  )
}

export default GameStartScreen
