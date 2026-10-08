/**
 * Audio Call Ringtone & Ringback Tone Generator
 * Uses Web Audio API to synthesize smooth, pleasant ringing sounds
 * without relying on external audio files that could 404 or suffer network lag.
 */

class SoundManager {
  private ctx: AudioContext | null = null
  private ringtoneInterval: ReturnType<typeof setInterval> | null = null
  private ringbackInterval: ReturnType<typeof setInterval> | null = null
  private isRinging = false
  private isRingbacking = false

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          this.ctx = new AudioContextClass()
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume()
      }
      return this.ctx
    } catch {
      return null
    }
  }

  /**
   * Play a melodious dual-tone pulse for incoming calls.
   * Melodic chord: 523.25 Hz (C5) + 659.25 Hz (E5) + 783.99 Hz (G5)
   */
  private playIncomingPulse() {
    const ctx = this.getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const freqs = [523.25, 659.25, 783.99] // C Major chime

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)

      // Smooth attack and decay envelope
      gain.gain.setValueAtTime(0, now + idx * 0.08)
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.08)
      osc.stop(now + idx * 0.08 + 0.85)
    })
  }

  /**
   * Play a standard telecommunication ringback tone for caller (440Hz + 480Hz).
   */
  private playRingbackPulse() {
    const ctx = this.getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    ;[440, 480].forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.06, now + 0.05)
      gain.gain.setValueAtTime(0.06, now + 1.2)
      gain.gain.linearRampToValueAtTime(0.001, now + 1.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 1.35)
    })
  }

  /**
   * Start incoming call ringtone (repeats every 2 seconds).
   */
  public startRingtone() {
    if (this.isRinging) return
    this.isRinging = true
    this.playIncomingPulse()

    this.ringtoneInterval = setInterval(() => {
      if (this.isRinging) {
        this.playIncomingPulse()
      }
    }, 2200)
  }

  /**
   * Stop incoming call ringtone.
   */
  public stopRingtone() {
    this.isRinging = false
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval)
      this.ringtoneInterval = null
    }
  }

  /**
   * Start outgoing ringback tone.
   */
  public startRingback() {
    if (this.isRingbacking) return
    this.isRingbacking = true
    this.playRingbackPulse()

    this.ringbackInterval = setInterval(() => {
      if (this.isRingbacking) {
        this.playRingbackPulse()
      }
    }, 3500)
  }

  /**
   * Stop outgoing ringback tone.
   */
  public stopRingback() {
    this.isRingbacking = false
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval)
      this.ringbackInterval = null
    }
  }

  /**
   * Stop all sounds immediately.
   */
  public stopAll() {
    this.stopRingtone()
    this.stopRingback()
  }
}

export const soundManager = new SoundManager()
