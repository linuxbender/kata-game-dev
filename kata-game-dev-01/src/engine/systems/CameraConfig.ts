// Camera configuration and utilities for smooth, frame-rate independent camera follow

export type CameraConfig = {
  // Damping factor in seconds (0.05-0.2 recommended; smaller = snappier)
  dampingSeconds?: number
  // Dead zone radius around target in world units (prevents jitter)
  deadZoneRadius?: number
  // Look-ahead multiplier to predict movement (0-1; 0.3-0.5 feels good)
  lookAheadFactor?: number
  // Optional velocity component name for predictive follow
  velocityComponentName?: string
}

// Compute frame-rate independent exponential smoothing alpha
export const computeSmoothing = (dt: number, dampingSeconds: number): number => {
  const tau = Math.max(1e-4, dampingSeconds)
  return 1 - Math.exp(-dt / tau)
}

// Linear interpolation with optional easing
export const lerp = (current: number, target: number, alpha: number): number => {
  return current + (target - current) * alpha
}

// Apply dead zone to camera movement (prevent small oscillations)
export const applyDeadZone = (
  current: number,
  target: number,
  deadZone: number
): number => {
  const distance = Math.abs(target - current)
  if (distance < deadZone) return current
  return target
}

// Default camera configuration
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  dampingSeconds: 0.12,
  deadZoneRadius: 5,
  lookAheadFactor: 0
}

