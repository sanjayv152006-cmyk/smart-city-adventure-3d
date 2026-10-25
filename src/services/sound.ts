/**
 * Procedural Web Audio API sound generator.
 * Zero external files, zero 404s, works reliably in any modern browser.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.7;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;

  constructor() {
    try {
      const storedSfx = localStorage.getItem('quiz_city_sfx');
      if (storedSfx !== null) {
        this.sfxEnabled = storedSfx === 'true';
      }
      const storedMusic = localStorage.getItem('quiz_city_music');
      if (storedMusic !== null) {
        this.musicEnabled = storedMusic === 'true';
      } else {
        this.musicEnabled = true;
      }
      const storedSfxVol = localStorage.getItem('quiz_city_sfx_volume');
      if (storedSfxVol !== null) {
        const val = parseFloat(storedSfxVol);
        if (!isNaN(val)) this.sfxVolume = Math.max(0, Math.min(1, val));
      }
      const storedMusicVol = localStorage.getItem('quiz_city_music_volume');
      if (storedMusicVol !== null) {
        const val = parseFloat(storedMusicVol);
        if (!isNaN(val)) this.musicVolume = Math.max(0, Math.min(1, val));
      }
    } catch {
      // Ignore localStorage issues
    }

    if (typeof window !== 'undefined') {
      // Prepare audio context on initial user interaction for sound effects and background music
      const handleUserGesture = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.musicEnabled && !this.bgmSource) {
          this.startBgm();
        }
      };

      window.addEventListener('pointerdown', handleUserGesture, { passive: true });
      window.addEventListener('click', handleUserGesture, { passive: true });
      window.addEventListener('keydown', handleUserGesture, { passive: true });
      window.addEventListener('touchstart', handleUserGesture, { passive: true });
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {
        console.warn('AudioContext creation blocked or not supported:', e);
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // --- Background Music Procedural Synthesizer ---
  private generateAdventureMusicBuffer(ctx: AudioContext): AudioBuffer {
    const sampleRate = 22050;
    const duration = 16.0;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, numSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Chords across 8 bars (2.0s per bar, 120 BPM)
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G
      [164.81, 196.00, 246.94, 329.63], // Em7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 261.63, 329.63, 392.00], // Fmaj9
      [196.00, 246.94, 293.66, 329.63], // G6
      [130.81, 196.00, 261.63, 329.63], // Cmaj7
      [164.81, 196.00, 246.94, 293.66], // Em7
    ];

    // Melodic notes [startTime, freq, duration]
    const melody: [number, number, number][] = [
      [0.0, 523.25, 0.45], [0.5, 659.25, 0.45], [1.0, 783.99, 0.45], [1.5, 880.00, 0.45],
      [2.0, 987.77, 0.45], [2.5, 783.99, 0.45], [3.0, 587.33, 0.45], [3.5, 659.25, 0.45],
      [4.0, 783.99, 0.45], [4.5, 987.77, 0.45], [5.0, 659.25, 0.45], [5.5, 783.99, 0.45],
      [6.0, 880.00, 0.45], [6.5, 1046.5, 0.45], [7.0, 659.25, 0.45], [7.5, 523.25, 0.45],
      [8.0, 523.25, 0.45], [8.5, 659.25, 0.45], [9.0, 783.99, 0.45], [9.5, 1046.5, 0.45],
      [10.0, 1174.66, 0.45], [10.5, 987.77, 0.45], [11.0, 783.99, 0.45], [11.5, 880.00, 0.45],
      [12.0, 783.99, 0.45], [12.5, 659.25, 0.45], [13.0, 523.25, 0.45], [13.5, 587.33, 0.45],
      [14.0, 659.25, 0.45], [14.5, 783.99, 0.45], [15.0, 987.77, 0.45], [15.5, 659.25, 0.45],
    ];

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let padL = 0;
      let padR = 0;

      // 1. Synth Pad: Warm chord progression with gentle envelope
      const barIdx = Math.min(Math.floor(t / 2.0), 7);
      const barTime = t % 2.0;
      const barEnv = Math.sin((barTime / 2.0) * Math.PI);
      const chord = chords[barIdx];

      for (let c = 0; c < chord.length; c++) {
        const f = chord[c];
        const waveL = Math.sin(2 * Math.PI * f * t) * 0.7 + (Math.asin(Math.sin(2 * Math.PI * (f - 0.25) * t)) * (2 / Math.PI)) * 0.3;
        const waveR = Math.sin(2 * Math.PI * f * t) * 0.7 + (Math.asin(Math.sin(2 * Math.PI * (f + 0.25) * t)) * (2 / Math.PI)) * 0.3;
        padL += waveL * 0.038 * barEnv;
        padR += waveR * 0.038 * barEnv;
      }

      // 2. Futuristic Plucked Melodies
      let melL = 0;
      let melR = 0;
      for (let m = 0; m < melody.length; m++) {
        const [mStart, mFreq, mDur] = melody[m];
        if (t >= mStart && t < mStart + mDur + 0.1) {
          const dt = t - mStart;
          const melEnv = Math.exp(-dt * 6.5);
          const melWave = Math.sin(2 * Math.PI * mFreq * dt) * 0.045 * melEnv;
          const pan = m % 2 === 0 ? 0.35 : 0.65;
          melL += melWave * (1 - pan);
          melR += melWave * pan;
        }
      }

      // 3. Gentle Rhythmic Beat (Soft heartbeat thump on beat + light tick)
      let beat = 0;
      const beatTime = t % 1.0;
      if (beatTime < 0.14) {
        const kickFreq = 85 - beatTime * 280;
        const kickEnv = Math.exp(-beatTime * 28);
        beat = Math.sin(2 * Math.PI * kickFreq * beatTime) * 0.04 * kickEnv;
      }

      const subTime = t % 0.5;
      if (subTime < 0.035) {
        const tick = (Math.random() * 2 - 1) * 0.01 * Math.exp(-subTime * 90);
        beat += tick;
      }

      let sampleL = padL + melL + beat;
      let sampleR = padR + melR + beat;

      // 4. Equal-Power Seamless Crossfade at loop boundaries (0.25s)
      const crossfadeLen = 0.25;
      if (t < crossfadeLen) {
        const fade = t / crossfadeLen;
        sampleL *= Math.sin(fade * Math.PI * 0.5);
        sampleR *= Math.sin(fade * Math.PI * 0.5);
      } else if (t > duration - crossfadeLen) {
        const fade = (duration - t) / crossfadeLen;
        sampleL *= Math.sin(fade * Math.PI * 0.5);
        sampleR *= Math.sin(fade * Math.PI * 0.5);
      }

      left[i] = sampleL;
      right[i] = sampleR;
    }

    return buffer;
  }

  public getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    try {
      localStorage.setItem('quiz_city_sfx', String(enabled));
    } catch {}
  }

  public toggleSfx(): boolean {
    this.setSfxEnabled(!this.sfxEnabled);
    if (this.sfxEnabled) {
      this.playClick();
    }
    return this.sfxEnabled;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('quiz_city_sfx_volume', String(this.sfxVolume));
    } catch {}
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('quiz_city_music_volume', String(this.musicVolume));
    } catch {}

    if (this.bgmGain && this.ctx && this.musicEnabled) {
      try {
        const target = 0.06 * this.musicVolume;
        this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.ctx.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.05);
      } catch {}
    }
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    try {
      localStorage.setItem('quiz_city_music', String(enabled));
    } catch {}

    if (enabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  public toggleMusic(): boolean {
    this.setMusicEnabled(!this.musicEnabled);
    return this.musicEnabled;
  }

  public startBgm() {
    if (!this.musicEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    if (this.bgmSource) return; // Prevent duplicate playback

    try {
      if (!this.bgmBuffer) {
        this.bgmBuffer = this.generateAdventureMusicBuffer(ctx);
      }
      const targetGain = 0.06 * this.musicVolume;
      if (!this.bgmGain) {
        this.bgmGain = ctx.createGain();
        this.bgmGain.gain.setValueAtTime(targetGain, ctx.currentTime);
        this.bgmGain.connect(ctx.destination);
      } else {
        this.bgmGain.gain.cancelScheduledValues(ctx.currentTime);
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, ctx.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.2);
      }

      const source = ctx.createBufferSource();
      source.buffer = this.bgmBuffer;
      source.loop = true;
      source.connect(this.bgmGain);
      source.start(0);
      this.bgmSource = source;
    } catch {
      // Audio errors do not break the game
    }
  }

  public stopBgm() {
    if (this.bgmGain && this.ctx) {
      try {
        this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.ctx.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
        setTimeout(() => {
          if (!this.musicEnabled && this.bgmSource) {
            try {
              this.bgmSource.stop();
              this.bgmSource.disconnect();
            } catch {}
            this.bgmSource = null;
          }
        }, 220);
      } catch {
        if (this.bgmSource) {
          try {
            this.bgmSource.stop();
          } catch {}
          this.bgmSource = null;
        }
      }
    }
  }

  // UI Click sound
  public playClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

      const peak = 0.08 * this.sfxVolume;
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  // Answer selected sound
  public playSelect() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08);

      const peak = 0.07 * this.sfxVolume;
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  }

  // Correct answer chime (bright friendly major triad)
  public playCorrect() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const peak = 0.12 * this.sfxVolume;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(peak, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  }

  // Incorrect answer (gentle encouraging low chime, never harsh)
  public playIncorrect() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 0.2);

      const peak = 0.08 * this.sfxVolume;
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.24);
    } catch {}
  }

  // Round victory fanfare
  public playRoundWin() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Fanfare: C5 -> G5 -> C6 -> E6
      const notes = [
        { f: 523.25, d: 0.12, t: 0.0 },
        { f: 523.25, d: 0.1, t: 0.14 },
        { f: 659.25, d: 0.12, t: 0.26 },
        { f: 783.99, d: 0.18, t: 0.4 },
        { f: 1046.5, d: 0.45, t: 0.6 },
      ];

      const peak = 0.15 * this.sfxVolume;
      notes.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, ctx.currentTime + item.t);

        const startTime = ctx.currentTime + item.t;
        gain.gain.setValueAtTime(peak, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + item.d + 0.05);
      });
    } catch {}
  }

  // Location unlocked sound (magical ascending sparkle)
  public playUnlock() {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const frequencies = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
      const peak = 0.08 * this.sfxVolume;
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(peak, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {}
  }
}

export const soundService = new SoundService();
