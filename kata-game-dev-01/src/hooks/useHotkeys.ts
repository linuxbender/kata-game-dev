import { useEffect, useRef } from 'react'

export type HotkeyHandler = (e: KeyboardEvent) => void

/**
 * Map of lowercase key string → handler.
 *
 * Key strings are matched against `e.key.toLowerCase()`, so:
 *   'escape' matches Escape, 'i' matches I/i, ' ' matches Space.
 *
 * @example
 * ```ts
 * useHotkeys({
 *   i: () => toggleInventory(),
 *   escape: (e) => { e.preventDefault(); closePanel() },
 * })
 * ```
 */
export type HotkeyMap = Record<string, HotkeyHandler>

/**
 * Registers a single keydown listener on window and dispatches to
 * per-key handlers. Handlers are stored in a ref so they are always
 * current without re-attaching the DOM listener on every render.
 *
 * @param hotkeys - Mapping of lowercase key string → handler
 * @param enabled - When false the listener is not attached (default: true)
 */
export function useHotkeys(hotkeys: HotkeyMap, enabled = true): void {
  const hotkeysRef = useRef<HotkeyMap>(hotkeys)
  // Update ref synchronously so the closure always reads the latest handlers
  hotkeysRef.current = hotkeys

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      hotkeysRef.current[key]?.(e)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}
