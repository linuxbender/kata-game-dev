import React, { useEffect, useState } from 'react'

export interface LevelTransitionProps {
  /** Whether transition is active */
  isActive: boolean
  /** Level name to display */
  levelName?: string
  /** Level description to display */
  levelDescription?: string
  /** Duration of fade in milliseconds */
  duration?: number
  /** Callback when transition completes */
  onComplete?: () => void
}

/**
 * Level Transition Component
 * 
 * Displays a fade effect with level name and description during level transitions.
 * Animation sequence:
 * 1. Fade in (black screen with level info)
 * 2. Hold for a moment
 * 3. Fade out
 * 4. Call onComplete
 */
export const LevelTransition: React.FC<LevelTransitionProps> = ({
  isActive,
  levelName,
  levelDescription,
  duration = 2000,
  onComplete
}) => {
  const [phase, setPhase] = useState<'fade-in' | 'hold' | 'fade-out' | 'hidden'>('hidden')

  useEffect(() => {
    if (!isActive) {
      setPhase('hidden')
      return
    }

    // Start transition sequence
    setPhase('fade-in')

    // Fade in duration (40% of total)
    const fadeInDuration = duration * 0.4
    // Hold duration (20% of total)
    const holdDuration = duration * 0.2
    // Fade out duration (40% of total)
    const fadeOutDuration = duration * 0.4

    const timer1 = setTimeout(() => {
      setPhase('hold')
    }, fadeInDuration)

    const timer2 = setTimeout(() => {
      setPhase('fade-out')
    }, fadeInDuration + holdDuration)

    const timer3 = setTimeout(() => {
      setPhase('hidden')
      if (onComplete) {
        onComplete()
      }
    }, fadeInDuration + holdDuration + fadeOutDuration)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isActive, duration, onComplete])

  if (phase === 'hidden') {
    return null
  }

  const opacity = phase === 'fade-in' 
    ? 1
    : phase === 'hold'
    ? 1
    : 0

  const transitionDuration = phase === 'fade-in'
    ? `${duration * 0.4}ms`
    : phase === 'fade-out'
    ? `${duration * 0.4}ms`
    : '0ms'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        opacity,
        transition: `opacity ${transitionDuration} ease-in-out`,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none'
      }}
    >
      {levelName && (
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        >
          {levelName}
        </div>
      )}
      {levelDescription && (
        <div
          style={{
            fontSize: '20px',
            color: '#cccccc',
            textAlign: 'center',
            maxWidth: '600px',
            padding: '0 20px'
          }}
        >
          {levelDescription}
        </div>
      )}
    </div>
  )
}

export default LevelTransition
