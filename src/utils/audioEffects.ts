// Audio Controller for Interactive Flipbook
// Features "Bad Bunny - Eoow" background audio track with synthesized ambient fallback
// and crisp paper flip acoustic effects.

class AudioController {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isMusicPlaying = false;
  private oscs: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private trackAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Bad Bunny - Eoow audio track source (with reliable stream URL)
      this.trackAudio = new Audio("https://ia801602.us.archive.org/27/items/bad-bunny-eoow/Bad%20Bunny%20-%20EOOW.mp3");
      this.trackAudio.loop = true;
      this.trackAudio.volume = 0.55;
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Synthesizes a realistic, crisp paper flipping sound
   */
  playPageFlip() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const duration = 0.22;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(800, this.ctx.currentTime);
      bandpass.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + duration * 0.5);
      bandpass.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      whiteNoise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Could not play page flip sound:", e);
    }
  }

  /**
   * Starts playing "Bad Bunny - Eoow" music track with synthesized ambient fallback
   */
  startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Try playing the Bad Bunny - Eoow track first
    if (this.trackAudio) {
      this.trackAudio.currentTime = 0;
      const promise = this.trackAudio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn("Audio element playback blocked/failed, starting ambient fallback:", err);
          this.startAmbientFallback();
        });
      }
    } else {
      this.startAmbientFallback();
    }
  }

  private startAmbientFallback() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.06, now + 2.5);
      this.ambientGain.connect(this.ctx.destination);

      const frequencies = [130.81, 174.61, 220.0, 261.63, 329.63];
      this.oscs = [];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), now);

        oscGain.gain.setValueAtTime(1 / (idx + 2), now);

        osc.connect(oscGain);
        oscGain.connect(this.ambientGain);
        osc.start();
        this.oscs.push(osc);
      });

      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.12, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, now);
      this.lfo.connect(lfoGain);
      if (this.oscs[0]) lfoGain.connect(this.oscs[0].frequency);
      this.lfo.start();
    } catch (e) {
      console.warn("Error starting fallback ambient synth:", e);
    }
  }

  /**
   * Stops the active music track & synth
   */
  stopMusic() {
    this.isMusicPlaying = false;
    if (this.trackAudio) {
      try {
        this.trackAudio.pause();
      } catch (_) {}
    }

    if (this.ambientGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
        setTimeout(() => {
          this.oscs.forEach((osc) => {
            try { osc.stop(); osc.disconnect(); } catch (_) {}
          });
          if (this.lfo) {
            try { this.lfo.stop(); this.lfo.disconnect(); } catch (_) {}
          }
          this.oscs = [];
          this.lfo = null;
          this.ambientGain?.disconnect();
        }, 850);
      } catch (e) {
        console.warn("Error stopping synth:", e);
      }
    }
  }

  toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  isPlaying(): boolean {
    return this.isMusicPlaying;
  }
}

export const flipbookAudio = new AudioController();
