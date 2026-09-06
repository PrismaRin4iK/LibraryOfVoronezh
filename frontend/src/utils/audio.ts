/**
 * Ambient Library Audio & Sound Effects Synthesizer using Web Audio API.
 * Completely self-contained, no external audio assets required.
 */

class LibraryAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private oscillators: OscillatorNode[] = [];
  private noiseNode: AudioNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Start subtle ambient library drone (warm deep frequencies, echoing quiet chamber)
   */
  public startAmbient() {
    if (this.isAmbientPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    // Fade in gently
    this.ambientGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 3);
    this.ambientGain.connect(this.ctx.destination);

    // Deep drone 1 (55Hz - A1 note)
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Low octave drone (110Hz - A2 note)
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // E2 - fifth

    // Filtered noise for subtle air/hall whisper
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to soft low-pass (like muffled library air)
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);

    osc1.connect(this.ambientGain);
    osc2.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    whiteNoise.start();

    this.oscillators = [osc1, osc2];
    this.noiseNode = whiteNoise;
    this.isAmbientPlaying = true;
  }

  /**
   * Stop ambient library drone
   */
  public stopAmbient() {
    if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;

    // Fade out gently
    this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.oscillators = [];
      if (this.noiseNode) {
        try {
          (this.noiseNode as AudioScheduledSourceNode).stop();
          this.noiseNode.disconnect();
        } catch {
          // ignore
        }
        this.noiseNode = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
      this.isAmbientPlaying = false;
    }, 1600);
  }

  public toggleAmbient(): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isAmbientPlaying;
  }

  /**
   * Subtle paper page turn effect (filtered noise burst)
   */
  public playPageTurn() {
    this.initContext();
    if (!this.ctx) return;

    const dur = 0.18;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }
}

export const libraryAudio = new LibraryAudioEngine();
