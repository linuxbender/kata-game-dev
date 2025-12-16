// Health component - simple hitpoints component
export type Health = {
  current: number
  max: number
}

export const createHealth = (max: number): Health => ({ current: max, max })

