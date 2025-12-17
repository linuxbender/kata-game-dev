/**
 * Audio system (prepared, not yet integrated)
 * Manages sound effects and background music with volume control.
 */

export interface AudioConfig {
  sfx: Record<string, string> // name -> url
  music: Record<string, string> // name -> url
  sfxVolume: number // 0-1
  musicVolume: number // 0-1
  masterVolume: number // 0-1
}

export const AUDIO_EVENTS = {
  PLAYER_JUMP: 'playerJump',
  PLAYER_DAMAGE: 'playerDamage',
  ENEMY_HIT: 'enemyHit',
  ENEMY_DEATH: 'enemyDeath',
  COLLECT_ITEM: 'collectItem',
  UI_CLICK: 'uiClick'
} as const satisfies Record<string, string>

export type AudioEvent = typeof AUDIO_EVENTS[keyof typeof AUDIO_EVENTS]

const DEFAULT_CONFIG: AudioConfig = {
  sfx: {},
  music: {},
  sfxVolume: 0.7,
  musicVolume: 0.5,
  masterVolume: 1.0
}

/**
 * Audio system using Web Audio API
 * Supports spatial audio, volume control, and music looping.
 */
export const createAudioSystem = (config: Partial<AudioConfig> = {}) => {
  const finalConfig: AudioConfig = { ...DEFAULT_CONFIG, ...config }

  let audioContext: AudioContext | null = null
  const sfxBuffers = new Map<string, AudioBuffer>()
  const musicNodes = new Map<string, AudioBufferSourceNode>()
  let currentMusic: string | null = null

  // Initialize audio context on first user interaction (browser requirement)
  const ensureContext = () => {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }

  const loadSound = async (name: string, url: string): Promise<void> => {
    ensureContext()
    if (!audioContext) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await audioContext.decodeAudioData(arrayBuffer)
      sfxBuffers.set(name, buffer)
    } catch (error) {
      console.error(`Failed to load sound '${name}':`, error)
    }
  }

  const playSfx = (name: string, volume: number = 1) => {
    ensureContext()
    if (!audioContext) return

    const buffer = sfxBuffers.get(name)
    if (!buffer) {
      console.warn(`Sound '${name}' not loaded`)
      return
    }

    const source = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()

    gainNode.gain.value = volume * finalConfig.sfxVolume * finalConfig.masterVolume

    source.buffer = buffer
    source.connect(gainNode).connect(audioContext.destination)
    source.start()
  }

  const playMusic = (name: string, loop: boolean = true) => {
    ensureContext()
    if (!audioContext) return

    // Stop current music
    if (currentMusic && musicNodes.has(currentMusic)) {
      const node = musicNodes.get(currentMusic)!
      node.stop()
      musicNodes.delete(currentMusic)
    }

    const buffer = sfxBuffers.get(name)
    if (!buffer) {
      console.warn(`Music '${name}' not loaded`)
      return
    }

    const source = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()

    gainNode.gain.value = finalConfig.musicVolume * finalConfig.masterVolume
    source.buffer = buffer
    source.loop = loop

    source.connect(gainNode).connect(audioContext.destination)
    source.start()

    musicNodes.set(name, source)
    currentMusic = name
  }

  const stopMusic = () => {
    if (currentMusic && musicNodes.has(currentMusic)) {
      const node = musicNodes.get(currentMusic)!
      node.stop()
      musicNodes.delete(currentMusic)
      currentMusic = null
    }
  }

  const stopAll = () => {
    stopMusic()
    // Note: individual SFX cannot be stopped once started with this simple approach
  }

  const setVolume = (type: 'sfx' | 'music' | 'master', value: number) => {
    const clamped = Math.max(0, Math.min(1, value))
    if (type === 'sfx') finalConfig.sfxVolume = clamped
    if (type === 'music') finalConfig.musicVolume = clamped
    if (type === 'master') finalConfig.masterVolume = clamped

    // Update current music volume if playing
    if (currentMusic && musicNodes.has(currentMusic) && audioContext) {
      // Would need to store gainNode reference to update in real-time
    }
  }

  return {
    loadSound,
    playSfx,
    playMusic,
    stopMusic,
    stopAll,
    setVolume,
    getConfig: () => ({ ...finalConfig }),
    isPlaying: () => currentMusic !== null
  }
}

