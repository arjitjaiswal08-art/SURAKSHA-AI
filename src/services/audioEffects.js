/**
 * Procedural Audio Effects Synthesizer using Web Audio API
 * Generates soft, pleasant acoustic tones and gentle reminder chimes
 * with zero harsh frequencies, gentle exponential envelopes, and strict anti-spam cooldowns.
 */
class AudioEffectsService {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // Default to muted for peaceful, non-irritating start
    this.masterVolume = 0.3; // Soft, gentle volume (0.0 to 1.0)
    this.lastSoundTimes = {
      chime: 0,
      warning: 0,
      alarm: 0,
    };
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, Number(vol) || 0.3));
  }

  // Soft, warm acoustic notification chime (gentle sine wave chord)
  playChime() {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastSoundTimes.chime < 4000) return; // 4s cooldown
    this.lastSoundTimes.chime = nowMs;

    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

    const baseVol = 0.08 * this.masterVolume;
    gain.gain.setValueAtTime(baseVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Soft, polite two-tone collision advisory ping (NOT a screeching buzzer)
  playCollisionWarningBeep(ttc = 2.0) {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastSoundTimes.warning < 6000) return; // 6s cooldown between pings
    this.lastSoundTimes.warning = nowMs;

    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pleasant dual-frequency acoustic chime
    const freqs = [440, 554.37]; // A4, C#5 (warm major third)
    const baseVol = 0.07 * this.masterVolume;

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(baseVol, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.22);
    });
  }

  // Composed, non-screeching emergency alarm (deep harmonic pulse, never harsh sawtooth)
  playCriticalEmergencyAlarm() {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastSoundTimes.alarm < 5000) return; // 5s cooldown
    this.lastSoundTimes.alarm = nowMs;

    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low, calm, authoritative tone (F#4 370Hz / A4 440Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(370, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);

    const baseVol = 0.12 * this.masterVolume;
    gain.gain.setValueAtTime(baseVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }
}

export const audioEffects = new AudioEffectsService();
