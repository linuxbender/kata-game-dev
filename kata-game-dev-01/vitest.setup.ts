import { beforeEach, afterEach } from 'vitest'

/**
 * Global localStorage mock for all tests
 *
 * Provides a complete in-memory implementation of the Storage API
 * Automatically cleared before/after each test
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    // @ts-ignore - these properties are used by tests even if not marked
    getItem: (key: string) => store[key] || null,
    // @ts-ignore
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    // @ts-ignore
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null
  }
})()

// Set up global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Clear before each test
beforeEach(() => {
  localStorageMock.clear()
})

// Clear after each test
afterEach(() => {
  localStorageMock.clear()
})

