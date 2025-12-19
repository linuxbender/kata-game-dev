import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Persisted Quad Tree configuration
 *
 * Stores optional performance tuning parameters for the quad tree spatial partitioning system.
 * These values are persisted to localStorage for consistency across sessions.
 *
 * @property mergeThreshold - Number of entities below which a quad node merges with parent
 * @property rebalanceInterval - Time in milliseconds between quad tree rebalance operations
 *
 * @example
 * ```ts
 * const config: PersistedQuadConfig = {
 *   mergeThreshold: 4,
 *   rebalanceInterval: 1000
 * }
 * ```
 */
export type PersistedQuadConfig = {
  mergeThreshold?: number
  rebalanceInterval?: number
}

/**
 * Local storage key for persisted quad tree configuration
 * Version suffix ensures compatibility when config structure changes
 */
const STORAGE_KEY = 'kata_quadtree_config_v1'

/**
 * Context value shape: provides access to quad tree configuration and setter
 *
 * @property config - Current configuration object (may be empty if not customized)
 * @property setConfig - Function to update configuration (merges with existing values)
 */
type QuadConfigContextValue = {
  config: PersistedQuadConfig
  setConfig: (c: PersistedQuadConfig) => void
}

/**
 * React Context for quad tree configuration management
 *
 * Provides a centralized way to access and modify quad tree performance settings.
 * Default implementations are no-ops to ensure graceful degradation if context is not provided.
 *
 * @internal Use `useQuadConfig()` hook instead of accessing context directly
 */
const QuadConfigContext = createContext<QuadConfigContextValue>({
  config: {},
  setConfig: () => {
    // no-op default implementation
  }
})

/**
 * Provider component for quad tree configuration
 *
 * Responsibilities:
 * - Initialize configuration from localStorage
 * - Persist configuration changes back to localStorage
 * - Provide stable context value via useMemo
 * - Handle JSON serialization errors gracefully
 *
 * Should be placed at a high level in the component tree (e.g., in App.tsx)
 * to ensure all game components can access the configuration.
 *
 * @param props Component props
 * @param props.children React child components that consume the context
 *
 * @example
 * ```tsx
 * import { QuadConfigProvider } from '@contexts/QuadConfigContext'
 *
 * export const App = () => (
 *   <QuadConfigProvider>
 *     <GameCanvas />
 *   </QuadConfigProvider>
 * )
 * ```
 */
export const QuadConfigProvider = ({ children }: { children?: React.ReactNode }) => {
  /**
   * Configuration state with localStorage initialization
   *
   * - Attempts to load from localStorage on first render
   * - Defaults to empty object if no stored value or parse error occurs
   * - Empty config means quad tree uses its own defaults
   */
  const [config, setConfigState] = useState<PersistedQuadConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as PersistedQuadConfig
    } catch (e) {
      // Silently ignore read errors - corrupted storage is not fatal
    }
    return {}
  })

  /**
   * Persist configuration changes to localStorage
   *
   * Runs whenever config updates. Errors are silently ignored
   * to prevent localStorage issues from breaking the application.
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (e) {
      // Silently ignore write errors (storage full, private browsing, etc.)
    }
  }, [config])

  /**
   * Setter function that merges partial updates
   *
   * Allows partial config updates without losing other properties:
   * ```ts
   * setConfig({ mergeThreshold: 5 }) // Keeps existing rebalanceInterval
   * ```
   */
  const setConfig = (c: PersistedQuadConfig) =>
    setConfigState((prev) => ({ ...prev, ...c }))

  /**
   * Memoized context value to prevent unnecessary re-renders
   *
   * Depends only on config, not setConfig, since setConfig is stable
   */
  const value = useMemo(() => ({ config, setConfig }), [config])

  return (
    <QuadConfigContext.Provider value={value}>
      {children}
    </QuadConfigContext.Provider>
  )
}

/**
 * Hook to access persisted quad tree configuration
 *
 * Provides read-only access to the current config and a setter for updates.
 * Must be used within a `QuadConfigProvider` component.
 *
 * @returns Object containing config object and setConfig function
 *
 * @throws If used outside of QuadConfigProvider, returns default no-op implementation
 *
 * @example
 * ```tsx
 * const ConfigDisplay = () => {
 *   const { config, setConfig } = useQuadConfig()
 *
 *   return (
 *     <div>
 *       <p>Merge Threshold: {config.mergeThreshold ?? 'default'}</p>
 *       <button onClick={() => setConfig({ mergeThreshold: 8 })}>
 *         Update
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export const useQuadConfig = (): QuadConfigContextValue => useContext(QuadConfigContext)

