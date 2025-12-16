// Component keys centralized to avoid string duplication and typos
export const COMPONENTS = {
    TRANSFORM: 'Transform',
    VELOCITY: 'Velocity',
    RENDERABLE: 'Renderable',
    ENEMY: 'Enemy'
} as const

export type ComponentKey = typeof COMPONENTS[keyof typeof COMPONENTS]
