import React, { useEffect } from 'react'
import './GameOverScreen.css'

interface GameOverScreenProps {
  /** Elapsed game seconds */
  elapsedSeconds: number
  onRestart: () => void
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ elapsedSeconds, onRestart }) => {
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = Math.floor(elapsedSeconds % 60)
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') onRestart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onRestart])

  return (
    <div className="gameover-screen">
      <div className="gameover-screen__content">
        <div className="gameover-screen__skull" aria-hidden>💀</div>
        <h1 className="gameover-screen__title">GAME OVER</h1>
        <p className="gameover-screen__message">You have been defeated</p>

        <div className="gameover-screen__stats">
          <div className="gameover-screen__stat">
            <span className="gameover-screen__stat-label">Time Survived</span>
            <span className="gameover-screen__stat-value">{timeStr}</span>
          </div>
        </div>

        <button className="gameover-screen__btn" onClick={onRestart}>
          PLAY AGAIN
          <span className="gameover-screen__btn-hint">R / Enter</span>
        </button>
      </div>
    </div>
  )
}

export default GameOverScreen
