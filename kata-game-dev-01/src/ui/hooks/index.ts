/**
 * UI Hooks
 *
 * React hooks for game state management.
 * All hooks in one place for easy imports.
 */

// Component watching
export {
  useComponentWatch,
  useMultipleComponentWatch,
} from './useComponentWatch'

// World querying
export {
  useWorldQuery,
  useWorldQueryWithComponents,
  useWorldQueryFilter,
  type QueryResult,
} from './useWorldQuery'

// Convenience hooks
export {
  usePlayerHealth,
  usePlayerTransform,
  usePlayerInventory,
  usePlayerEquipment,
  usePlayerStats,
  useAllEnemies,
  useAllNPCs,
  useAllItems,
  useAllLivingEntities,
  useEntityCount,
} from './useConvenience'

