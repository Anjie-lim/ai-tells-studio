class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.1) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playClick() {
    this.playTone(500, 'sine', 0.06, 0.04);
  }

  playSuccess() {
    if (!this.enabled) return;
    setTimeout(() => this.playTone(523.25, 'triangle', 0.12, 0.08), 0); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.08), 100); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.1), 200); // G5
  }

  playError() {
    if (!this.enabled) return;
    this.playTone(180, 'sawtooth', 0.18, 0.08);
  }

  playHint() {
    this.playTone(392, 'sine', 0.18, 0.06);
  }

  playVictory() {
    if (!this.enabled) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.1), i * 140);
    });
  }
}

export const AudioFX = new SoundEngine();
