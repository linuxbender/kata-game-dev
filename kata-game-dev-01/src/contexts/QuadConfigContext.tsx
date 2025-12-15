import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

// PersistedQuadConfig represents what we store in localStorage
export type PersistedQuadConfig = {
  mergeThreshold?: number
  rebalanceInterval?: number
}

const STORAGE_KEY = 'kata_quadtree_config_v1'

// Context value shape
type QuadConfigContextValue = {
  config: PersistedQuadConfig
  setConfig: (c: PersistedQuadConfig) => void
}

// Create context with default no-op implementations
const QuadConfigContext = createContext<QuadConfigContextValue>({
  config: {},
  setConfig: () => {}
})

// Provider component that persists quad config to localStorage
export const QuadConfigProvider = ({ children }: { children?: React.ReactNode }) => {
  const [config, setConfigState] = useState<PersistedQuadConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as PersistedQuadConfig
    } catch (e) {
      // ignore read errors
    }
    return {}
  })

  // Persist changes to localStorage whenever config updates
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch (e) { /* ignore write errors */ }
  }, [config])

  // Stable setter that merges partial updates
  const setConfig = (c: PersistedQuadConfig) => setConfigState(prev => ({ ...prev, ...c }))

  const value = useMemo(() => ({ config, setConfig }), [config])

  return (
    <QuadConfigContext.Provider value={value}>
      {children}
    </QuadConfigContext.Provider>
  )
}

// Hook to access persisted quad config
export const useQuadConfig = (): QuadConfigContextValue => useContext(QuadConfigContext)

