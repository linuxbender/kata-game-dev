// Enemy AI behavior utilities - pure utility functions for AI logic

import type { Velocity } from '@components/Velocity'

// Calculate squared distance between two points (faster, avoids sqrt for comparisons)
export const calculateDistanceSquared = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

// Calculate distance between two points
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(calculateDistanceSquared(x1, y1, x2, y2))
}

// Normalize a direction vector
export const normalizeVector = (dx: number, dy: number): { nx: number; ny: number } => {
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length === 0) return { nx: 0, ny: 0 }
  return { nx: dx / length, ny: dy / length }
}

// Calculate direction from source to target
export const calculateDirection = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): { dx: number; dy: number; nx: number; ny: number; distance: number } => {
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const distance = calculateDistance(sourceX, sourceY, targetX, targetY)
  const { nx, ny } = normalizeVector(dx, dy)
  return { dx, dy, nx, ny, distance }
}

// Apply velocity based on direction and speed
export const applyVelocity = (
  velocity: Velocity,
  nx: number,
  ny: number,
  speed: number
): void => {
  velocity.vx = nx * speed
  velocity.vy = ny * speed
}

// Stop entity (set velocity to zero)
export const stopMovement = (velocity: Velocity): void => {
  velocity.vx = 0
  velocity.vy = 0
}
