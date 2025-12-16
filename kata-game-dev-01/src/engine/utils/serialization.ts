import { SENTINELS } from '@engine/constants'

/**
 * JSON stringify replacer which converts `undefined` values to a string sentinel
 * so they survive JSON serialization (JSON.stringify drops undefined properties).
 */
function undefinedReplacer(_key: string, value: any) {
  if (value === undefined) return SENTINELS.UNDEFINED_STRING
  return value
}

/**
 * JSON parse reviver which converts the sentinel string back to `undefined`.
 */
function undefinedReviver(_key: string, value: any) {
  if (value === SENTINELS.UNDEFINED_STRING) return undefined
  return value
}

/**
 * Serialize an object to JSON preserving `undefined` values by encoding them as a sentinel string.
 * Use for storage or transport when you need to preserve property existence.
 */
export function stringifyWithUndefined(obj: unknown): string {
  return JSON.stringify(obj, undefinedReplacer)
}

/**
 * Parse JSON produced by `stringifyWithUndefined` and restore `undefined` values.
 */
export function parseWithUndefined<T = any>(json: string): T {
  return JSON.parse(json, undefinedReviver) as T
}

export default {
  stringifyWithUndefined,
  parseWithUndefined
}

