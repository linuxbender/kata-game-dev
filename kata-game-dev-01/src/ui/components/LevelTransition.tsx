import React, { useEffect, useRef, useState } from 'react'
import './LevelTransition.css'

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

  // Keep onComplete in a ref so changing the callback never restarts the timers.
  // Only isActive and duration should control the timer lifecycle.
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!isActive) {
      setPhase('hidden')
      return
    }

    const fadeIn  = duration * 0.4
    const hold    = duration * 0.2
    const fadeOut = duration * 0.4

    setPhase('fade-in')
    const t1 = setTimeout(() => setPhase('hold'),     fadeIn)
    const t2 = setTimeout(() => setPhase('fade-out'), fadeIn + hold)
    const t3 = setTimeout(() => {
      setPhase('hidden')
      onCompleteRef.current?.()
    }, fadeIn + hold + fadeOut)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [isActive, duration])

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
      className="level-transition-overlay"
      style={{
        opacity,
        transition: `opacity ${transitionDuration} ease-in-out`
      }}
    >
      {levelName && (
        <div className="level-transition-title">
          {levelName}
        </div>
      )}
      {levelDescription && (
        <div className="level-transition-description">
          {levelDescription}
        </div>
      )}
    </div>
  )
}

export default LevelTransition
