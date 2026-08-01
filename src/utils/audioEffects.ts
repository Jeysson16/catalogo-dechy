// Web Audio API Sound Synthesizer for Interactive Flipbook
// Provides realistic paper flip acoustics & soothing spa-like reading ambient sound

class AudioController {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private oscs: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;

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

      // Generate pink/white noise simulating heavy glossy paper texture
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Filter to emulate paper friction acoustics
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
   * Starts a calming, warm ambient background harmony for relaxing reading
   */
  startAmbientMusic() {
    try {
      if (this.isAmbientPlaying) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.06, now + 2.5); // Smooth fade in
      this.ambientGain.connect(this.ctx.destination);

      // Harmonize a relaxing, meditative warm chord (F major 9 / D minor 7 soothing atmosphere)
      const frequencies = [130.81, 174.61, 220.0, 261.63, 329.63]; // C3, F3, A3, C4, E4
      this.oscs = [];

      frequencies.forEach((freq, idx) => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        // Use soft sine and triangle waves for spa warmth
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), now); // Tiny organic detuning

        // Balance amplitudes across harmonics
        oscGain.gain.setValueAtTime(1 / (idx + 2), now);

        osc.connect(oscGain);
        oscGain.connect(this.ambientGain);
        osc.start();
        this.oscs.push(osc);
      });

      // Add gentle slow frequency modulation (LFO) for breathing oceanic movement
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.12, now); // Gentle oscillation every 8 seconds
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, now);
      this.lfo.connect(lfoGain);
      if (this.oscs[0]) lfoGain.connect(this.oscs[0].frequency);
      this.lfo.start();

      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn("Could not start ambient music:", e);
    }
  }

  /**
   * Smoothly fades out and stops the ambient reading harmony
   */
  stopAmbientMusic() {
    if (!this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
    try {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 1.2); // Smooth fade out

      setTimeout(() => {
        this.oscs.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (_) {}
        });
        if (this.lfo) {
          try {
            this.lfo.stop();
            this.lfo.disconnect();
          } catch (_) {}
        }
        this.oscs = [];
        this.lfo = null;
        this.ambientGain?.disconnect();
        this.isAmbientPlaying = false;
      }, 1250);
    } catch (e) {
      console.warn("Error stopping ambient sound:", e);
      this.isAmbientPlaying = false;
    }
  }

  toggleAmbient(): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbientMusic();
      return false;
    } else {
      this.startAmbientMusic();
      return true;
    }
  }

  isPlaying(): boolean {
    return this.isAmbientPlaying;
  }
}

export const flipbookAudio = new AudioController();
