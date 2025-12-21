/**
 * SaveSystem tests
 * 
 * Tests for game save/load functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ReactiveWorld } from '@engine/ReactiveWorld'
import { COMPONENTS } from '@engine/constants'
import {
  saveGame,
  loadGame,
  deleteSave,
  getAllSaveSlots,
  hasSave,
  MAX_SAVE_SLOTS,
  SAVE_VERSION
} from './SaveSystem'

describe('SaveSystem', () => {
  let world: ReactiveWorld
  let playerId: number
  
  // Clear localStorage before and after each test
  beforeEach(() => {
    localStorage.clear()
    world = new ReactiveWorld()
    playerId = world.createEntity()
    
    // Add player components
    world.addComponent(playerId, COMPONENTS.TRANSFORM, { x: 100, y: 200, rotation: 0 })
    world.addComponent(playerId, COMPONENTS.HEALTH, { current: 80, max: 100 })
    world.addComponent(playerId, COMPONENTS.INVENTORY, [
      { id: 'potion_health', uid: 'item_1', quantity: 3 }
    ])
    world.addComponent(playerId, COMPONENTS.EQUIPMENT, { 
      slots: { mainHand: 'sword_1', offHand: undefined } 
    })
  })
  
  afterEach(() => {
    localStorage.clear()
  })
  
  describe('saveGame', () => {
    it('should save game to specified slot', () => {
      const result = saveGame(world, playerId, 'level_1_forest', 0, 'Test Save')
      expect(result).toBe(true)
      
      // Check localStorage
      const key = 'kata_game_save_slot_0'
      const saved = localStorage.getItem(key)
      expect(saved).toBeTruthy()
    })
    
    it('should save player data correctly', () => {
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const key = 'kata_game_save_slot_0'
      const saved = JSON.parse(localStorage.getItem(key) || '{}')
      
      expect(saved.playerData.entityId).toBe(playerId)
      expect(saved.playerData.position).toEqual({ x: 100, y: 200 })
      expect(saved.playerData.health).toEqual({ current: 80, max: 100 })
    })
    
    it('should save world state with all entities', () => {
      // Create additional entities
      const enemy = world.createEntity()
      world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 300, y: 400, rotation: 0 })
      world.addComponent(enemy, COMPONENTS.HEALTH, { current: 50, max: 50 })
      world.addComponent(enemy, COMPONENTS.ENEMY, { 
        type: 'goblin', 
        difficulty: 'easy', 
        spawnX: 300, 
        spawnY: 400 
      })
      
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const key = 'kata_game_save_slot_0'
      const saved = JSON.parse(localStorage.getItem(key) || '{}')
      
      // Should have at least 2 entities (player + enemy)
      expect(saved.worldState.entities.length).toBeGreaterThanOrEqual(2)
    })
    
    it('should include version and timestamp', () => {
      const before = Date.now()
      saveGame(world, playerId, 'level_1_forest', 0)
      const after = Date.now()
      
      const key = 'kata_game_save_slot_0'
      const saved = JSON.parse(localStorage.getItem(key) || '{}')
      
      expect(saved.version).toBe(SAVE_VERSION)
      expect(saved.timestamp).toBeGreaterThanOrEqual(before)
      expect(saved.timestamp).toBeLessThanOrEqual(after)
    })
    
    it('should reject invalid slot numbers', () => {
      expect(saveGame(world, playerId, 'level_1_forest', -1)).toBe(false)
      expect(saveGame(world, playerId, 'level_1_forest', MAX_SAVE_SLOTS)).toBe(false)
      expect(saveGame(world, playerId, 'level_1_forest', 100)).toBe(false)
    })
    
    it('should support multiple save slots', () => {
      saveGame(world, playerId, 'level_1_forest', 0, 'Save 1')
      saveGame(world, playerId, 'level_2_cave', 1, 'Save 2')
      saveGame(world, playerId, 'level_3_fortress', 2, 'Save 3')
      
      expect(hasSave(0)).toBe(true)
      expect(hasSave(1)).toBe(true)
      expect(hasSave(2)).toBe(true)
      expect(hasSave(3)).toBe(false)
    })
  })
  
  describe('loadGame', () => {
    it('should load game from specified slot', () => {
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const newWorld = new ReactiveWorld()
      const loaded = loadGame(newWorld, 0)
      
      expect(loaded).toBeTruthy()
      expect(loaded?.levelId).toBe('level_1_forest')
    })
    
    it('should restore player data', () => {
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const newWorld = new ReactiveWorld()
      const loaded = loadGame(newWorld, 0)
      
      expect(loaded?.playerData.entityId).toBe(playerId)
      expect(loaded?.playerData.position).toEqual({ x: 100, y: 200 })
      expect(loaded?.playerData.health).toEqual({ current: 80, max: 100 })
    })
    
    it('should restore all entities', () => {
      // Create additional entity
      const enemy = world.createEntity()
      world.addComponent(enemy, COMPONENTS.TRANSFORM, { x: 300, y: 400, rotation: 0 })
      world.addComponent(enemy, COMPONENTS.HEALTH, { current: 50, max: 50 })
      
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const newWorld = new ReactiveWorld()
      const loaded = loadGame(newWorld, 0)
      
      expect(loaded?.worldState.entities.length).toBeGreaterThanOrEqual(2)
    })
    
    it('should return null for empty slot', () => {
      const loaded = loadGame(world, 5)
      expect(loaded).toBeNull()
    })
    
    it('should reject invalid slot numbers', () => {
      expect(loadGame(world, -1)).toBeNull()
      expect(loadGame(world, MAX_SAVE_SLOTS)).toBeNull()
      expect(loadGame(world, 100)).toBeNull()
    })
  })
  
  describe('deleteSave', () => {
    it('should delete save from specified slot', () => {
      saveGame(world, playerId, 'level_1_forest', 0)
      expect(hasSave(0)).toBe(true)
      
      const result = deleteSave(0)
      expect(result).toBe(true)
      expect(hasSave(0)).toBe(false)
    })
    
    it('should handle deleting empty slot', () => {
      const result = deleteSave(5)
      expect(result).toBe(true)
    })
    
    it('should reject invalid slot numbers', () => {
      expect(deleteSave(-1)).toBe(false)
      expect(deleteSave(MAX_SAVE_SLOTS)).toBe(false)
    })
  })
  
  describe('getAllSaveSlots', () => {
    it('should return array of all slots', () => {
      const slots = getAllSaveSlots()
      expect(slots).toHaveLength(MAX_SAVE_SLOTS)
    })
    
    it('should return null for empty slots', () => {
      const slots = getAllSaveSlots()
      expect(slots.every(s => s === null)).toBe(true)
    })
    
    it('should return metadata for occupied slots', () => {
      saveGame(world, playerId, 'level_1_forest', 0, 'Save 1')
      saveGame(world, playerId, 'level_2_cave', 2, 'Save 2')
      
      const slots = getAllSaveSlots()
      
      expect(slots[0]).toBeTruthy()
      expect(slots[0]?.slot).toBe(0)
      expect(slots[0]?.levelId).toBe('level_1_forest')
      expect(slots[0]?.slotName).toBe('Save 1')
      
      expect(slots[1]).toBeNull()
      
      expect(slots[2]).toBeTruthy()
      expect(slots[2]?.slot).toBe(2)
      expect(slots[2]?.levelId).toBe('level_2_cave')
      expect(slots[2]?.slotName).toBe('Save 2')
    })
  })
  
  describe('hasSave', () => {
    it('should return true for occupied slots', () => {
      saveGame(world, playerId, 'level_1_forest', 0)
      expect(hasSave(0)).toBe(true)
    })
    
    it('should return false for empty slots', () => {
      expect(hasSave(0)).toBe(false)
      expect(hasSave(5)).toBe(false)
    })
    
    it('should return false for invalid slot numbers', () => {
      expect(hasSave(-1)).toBe(false)
      expect(hasSave(MAX_SAVE_SLOTS)).toBe(false)
    })
  })
  
  describe('serialization', () => {
    it('should preserve undefined values in components', () => {
      world.addComponent(playerId, COMPONENTS.EQUIPMENT, {
        slots: { mainHand: 'sword_1', offHand: undefined }
      })
      
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const newWorld = new ReactiveWorld()
      const loaded = loadGame(newWorld, 0)
      
      expect(loaded?.playerData.equipment).toEqual({
        slots: { mainHand: 'sword_1', offHand: undefined }
      })
    })
    
    it('should handle complex nested data', () => {
      const inventory = [
        { id: 'potion', uid: 'p1', quantity: 5, metadata: { rarity: 'common' } },
        { id: 'sword', uid: 's1', quantity: 1, metadata: { level: 10, enchantments: ['fire', 'ice'] } }
      ]
      world.addComponent(playerId, COMPONENTS.INVENTORY, inventory)
      
      saveGame(world, playerId, 'level_1_forest', 0)
      
      const newWorld = new ReactiveWorld()
      const loaded = loadGame(newWorld, 0)
      
      expect(loaded?.playerData.inventory).toEqual(inventory)
    })
  })
})
