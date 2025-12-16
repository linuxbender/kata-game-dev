// Example declaration merging for adding components from plugins or other modules.
// Drop this in any module that needs to augment the global component map.

import type { Health } from '@components/Health'

declare module './componentTypes' {
  interface GlobalComponents {
    // Add Health component to the global map
    Health: Health
  }
}

