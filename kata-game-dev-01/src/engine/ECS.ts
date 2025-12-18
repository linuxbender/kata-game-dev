import type {ComponentKey, EventType} from '@engine/constants'
import {EVENT_TYPES} from '@engine/constants'

/**
 * Entity type
 * @example
 * ```ts
 * const entity: Entity = 1;
 * ```
 * @return Entity identifier
 */
export type Entity = number

/**
 * Resolve component key type
 * @template C Component schema type
 * @template K Component name/key
 * @returns Resolved key type
 * @example
 * ```ts
 * // Define component schema
 * interface MyComponents {
 *  position: { x: number; y: number };
 *  velocity: { dx: number; dy: number };
 *  }
 *  // Resolved key for 'position'
 *  type PositionKey = ResolvedKey<MyComponents, 'position'>; // 'position'
 *  // Resolved key for ComponentKey enum member
 *  type VelocityKey = ResolvedKey<MyComponents, ComponentKey.VELOCITY>; // 'velocity'
 *  ```
 */
type ResolvedKey<C, K> = Extract<K, keyof C>

/**
 * Component schema: maps component names/types to their data structures
 * @example
 * ```ts
 * // Define component schema
 * interface MyComponents {
 *   position: { x: number; y: number };
 *   velocity: { dx: number; dy: number };
 * }
 * ```
 * @return Component schema type
 */
export type ComponentSchema = Record<string, any>

/**
 * Known component event: for a specific component name/type
 * @template C Component schema type
 * @template K Component name/key
 * @example
 * ```ts
 * // Define component schema
 * interface MyComponents {
 *  position: { x: number; y: number };
 *  velocity: { dx: number; dy: number };
 *  }
 *  // Known component event for 'position'
 *  const positionEvent: KnownComponentEvent<MyComponents, 'position'> = {
 *  type: EVENT_TYPES.ADD,
 *  entity: 1,
 *  name: 'position',
 *  component: { x: 0, y: 0 }
 *  };
 *  // Known component event for ComponentKey enum member
 *  const velocityEvent: KnownComponentEvent<MyComponents, ComponentKey.VELOCITY> = {
 *  type: EVENT_TYPES.UPDATE,
 *  entity: 1,
 *  name: ComponentKey.VELOCITY,
 *  component: { dx: 1, dy: 1 }
 *  };
 *  ```
 */
export type KnownComponentEvent<C extends ComponentSchema, K extends keyof C | ComponentKey> =
    | {
    type: typeof EVENT_TYPES.ADD | typeof EVENT_TYPES.UPDATE;
    entity: Entity;
    name: K;
    component: C[ResolvedKey<C, K>]
}
    | { type: typeof EVENT_TYPES.REMOVE; entity: Entity; name: K }

/**
 * Component event: either a known component event or a generic one
 * for unknown component names/types
 * @template C Component schema type
 */
export type ComponentEvent<C extends ComponentSchema = ComponentSchema> =
    | { [K in keyof C]: KnownComponentEvent<C, K> }[keyof C]
    | { type: EventType; entity: Entity; name: string; component?: unknown }

/**
 * World: manages entities and their components
 * @template C Component schema type
 *
 * @example
 * ```ts
 * // Define component schema
 * interface MyComponents {
 *   position: { x: number; y: number };
 *   velocity: { dx: number; dy: number };
 * }
 *
 * // Create a world instance
 * const world = new World<MyComponents>();
 *
 * // Create an entity
 * const entity = world.createEntity();
 *
 * // Add components to the entity
 * world.addComponent(entity, 'position', { x: 0, y: 0 });
 * world.addComponent(entity, 'velocity', { dx: 1, dy: 1 });
 *
 * // Query entities with specific components
 * const results = world.query('position', 'velocity');
 * for (const { entity, comps } of results) {
 *   const [position, velocity] = comps;
 *   console.log(`Entity ${entity} - Position: (${position.x}, ${position.y}), Velocity: (${velocity.dx}, ${velocity.dy})`);
 * }
 *
 * // Listen for component events
 * const unsubscribe = world.onComponentEventFor('position', (event) => {
 *   console.log(`Position component event:`, event);
 * });
 */
export class World<C extends ComponentSchema = ComponentSchema> {
    private nextId = 1
    // Internal map uses string keys (the runtime values of the enum or raw strings)
    private components = new Map<string, Map<Entity, unknown>>()
    private listeners = new Set<(e: ComponentEvent<C>) => void>()
    private elapsedTime = 0

    createEntity = (): Entity => this.nextId++
    getTime = (): number => this.elapsedTime
    updateTime = (dt: number): void => {
        this.elapsedTime += dt
    }
    /**
     * Register a callback for all component events
     * @param cb Callback to invoke on component events
     * @returns Unsubscribe function
     * @example
     * ```ts
     * const unsubscribe = world.onComponentEvent((event) => {
     *   console.log(`Component event:`, event);
     * });
     * // To unsubscribe later:
     * unsubscribe();
     * ```
     */
    onComponentEvent = (cb: (e: ComponentEvent<C>) => void) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb)
    }

    /**
     * Register a callback for specific component events
     * @param name Component name or key to listen for
     * @param cb Callback to invoke on matching component events
     * @returns Unsubscribe function
     * @example
     * ```ts
     * const unsubscribe = world.onComponentEventFor('position', (event) => {
     *   console.log(`Position component event:`, event);
     * });
     * // To unsubscribe later:
     * unsubscribe();
     * ```
     */
    onComponentEventFor = <K extends keyof C | ComponentKey>(name: K, cb: (ev: KnownComponentEvent<C, K>) => void) => {
        const wrapper = (e: ComponentEvent<C>) => {
            if (e.name === (name as unknown as string)) cb(e as KnownComponentEvent<C, K>)
        }
        this.listeners.add(wrapper)
        return () => this.listeners.delete(wrapper)
    }

    /**
     * Emit a component event to all listeners
     * @param ev Component event to emit
     * @private
     */
    private emit = (ev: ComponentEvent<C>) => {
        for (const l of Array.from(this.listeners)) {
            try {
                l(ev)
            } catch (e) { /* swallow listener errors */
            }
        }
    }

    /**
     * Add a component to an entity
     * @param entity Entity identifier
     * @param name Component name or key
     * @param comp Component data to add
     * @example
     * ```ts
     * world.addComponent(entity, 'position', { x: 0, y: 0 });
     * ```
     * @returns void
     */
    addComponent = <K extends keyof C | ComponentKey>(entity: Entity, name: K, comp: C[ResolvedKey<C, K>]): void => {
        const key = String(name)
        let map = this.components.get(key) as Map<Entity, C[ResolvedKey<C, K>]> | undefined
        if (!map) {
            map = new Map<Entity, C[ResolvedKey<C, K>]>()
            this.components.set(key, map as Map<Entity, unknown>)
        }
        const existed = map.has(entity)
        map.set(entity, comp as unknown as C[ResolvedKey<C, K>])
        const ev: KnownComponentEvent<C, K> = {
            type: existed ? EVENT_TYPES.UPDATE : EVENT_TYPES.ADD,
            entity,
            name,
            component: comp as unknown as C[ResolvedKey<C, K>]
        }
        this.emit(ev)
    }

    /**
     * Get a component from an entity
     * @param entity Entity identifier
     * @param name Component name or key
     * @returns Component data or undefined if not found
     * @example
     * ```ts
     * const position = world.getComponent(entity, 'position');
     * ```
     */
    getComponent = <K extends keyof C | ComponentKey>(entity: Entity, name: K): C[ResolvedKey<C, K>] | undefined => {
        const key = String(name)
        const map = this.components.get(key) as Map<Entity, C[ResolvedKey<C, K>]> | undefined
        return map?.get(entity)
    }

    /**
     * Mark a component as updated and emit update event
     * @param entity Entity identifier
     * @param name Component name or key
     * @example
     * ```ts
     * world.markComponentUpdated(entity, 'position');
     * ```
     * @returns void
     */
    markComponentUpdated = <K extends keyof C | ComponentKey>(entity: Entity, name: K) => {
        const comp = this.getComponent(entity, name)
        if (comp !== undefined) {
            const ev: KnownComponentEvent<C, K> = {
                type: EVENT_TYPES.UPDATE,
                entity,
                name,
                component: comp as C[ResolvedKey<C, K>]
            }
            this.emit(ev)
        }
    }

    /**
     * Query entities with specific components
     * @param names Component names or keys to query for
     * @returns Array of entities with their components
     * @example
     * ```ts
     * const results = world.query('position', 'velocity');
     * for (const { entity, comps } of results) {
     *   const [position, velocity] = comps;
     *   console.log(`Entity ${entity}
     *                  Position: (${position.x}, ${position.y}),
     *                  Velocity: (${velocity.dx}, ${velocity.dy})`);
     * }
     * ```
     */
    query = <K extends readonly (keyof C | ComponentKey)[]>(...names: K): {
        entity: Entity;
        comps: { [P in keyof K]: K[P] extends keyof C ? C[K[P]] : K[P] extends ComponentKey ? C[ResolvedKey<C, K[P]>] : never }
    }[] => {
        if (names.length === 0) return []
        const firstKey = String(names[0])
        const first = this.components.get(firstKey)
        if (!first) return []
        const result: { entity: Entity; comps: any[] }[] = []
        for (const [entity] of first) {
            let ok = true
            const comps: unknown[] = []
            for (const n of names) {
                const key = String(n)
                const map = this.components.get(key) as Map<Entity, unknown> | undefined
                if (!map || !map.has(entity)) {
                    ok = false;
                    break
                }
                comps.push(map.get(entity))
            }
            if (ok) result.push({entity, comps})
        }
        return result as any
    }
}
