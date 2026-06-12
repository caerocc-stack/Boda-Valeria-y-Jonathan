// Web Audio Synthesizer for Classic Wedding Melodies (Canon in D / Wedding March vibes)
class WeddingSynth {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private isPlaying = false;
  private melodyTimer: any = null;
  private currentStep = 0;

  // Canon in D chord sequence / melody
  // Notes and their frequencies (Hz)
  private notes = {
    // Octave 3
    'F#3': 185.00, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C#4': 277.18, 'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00,
    'B4': 493.88, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00
  };

  // Melody and bass steps
  private score: { melody: string[]; harmony: string[] }[] = [
    { melody: ['F#5', 'D5'], harmony: ['D4', 'A3', 'F#3'] },
    { melody: ['E5', 'C#5'], harmony: ['A3', 'E3', 'C#3'] },
    { melody: ['D5', 'B4'], harmony: ['B3', 'F#3', 'D3'] },
    { melody: ['C#5', 'A4'], harmony: ['F#3', 'C#3', 'A2'] },
    { melody: ['B4', 'G4'], harmony: ['G3', 'D3', 'B2'] },
    { melody: ['A4', 'F#4'], harmony: ['D3', 'A2', 'F#2'] },
    { melody: ['B4', 'G4'], harmony: ['G3', 'D3', 'B2'] },
    { melody: ['C#5', 'E5'], harmony: ['A3', 'E3', 'C#3'] }
  ];

  constructor() {}

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.value = 0.12; // soft volume
    
    // Add a simple delay/reverb node for rich acoustic classic feel
    const delay = this.ctx.createDelay(1.0);
    const feedback = this.ctx.createGain();
    
    delay.delayTime.value = 0.45; // 450ms delay
    feedback.gain.value = 0.25; // suttle feed
    
    this.masterVolume.connect(this.ctx.destination);
    
    // Connect volume to delay, delay back to feedback, and delay to destination
    this.masterVolume.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.ctx.destination);
  }

  // Generate a soft harp/piano pluck sound
  private playPluck(frequency: number, startTime: number, duration: number, type: 'sine' | 'triangle' = 'triangle', velocity = 1) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Dynamic filtering for a warmer acoustic/classic timber
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, startTime);
    filter.frequency.exponentialRampToValueAtTime(180, startTime + duration);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.15 * velocity, startTime + 0.08); // soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // smooth decay

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.currentStep = 0;
    const tempo = 120; // BPM
    const beatDuration = 60 / tempo; // 0.5s per quarter note
    const measureDuration = beatDuration * 4; // 2.0s per measure

    const playMeasure = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const stepData = this.score[this.currentStep % this.score.length];

      // Play bass / harmony chord (arpeggiated)
      stepData.harmony.forEach((noteName, idx) => {
        const freq = (this.notes as any)[noteName];
        if (freq) {
          // staggered arpeggio arpeggio
          this.playPluck(freq, now + (idx * 0.12), beatDuration * 3.5, 'sine', 0.6);
        }
      });

      // Play melody
      stepData.melody.forEach((noteName, idx) => {
        const freq = (this.notes as any)[noteName];
        if (freq) {
          // Play melody notes spaced in time
          this.playPluck(freq, now + (idx * beatDuration * 1.5), beatDuration * 2.5, 'triangle', 0.82);
        }
      });

      this.currentStep++;
      // Schedule next measure
      const nextTimeMs = measureDuration * 1000;
      this.melodyTimer = setTimeout(playMeasure, nextTimeMs);
    };

    playMeasure();
  }

  stop() {
    this.isPlaying = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }

  get isSynthPlaying() {
    return this.isPlaying;
  }

  setVolume(vol: number) {
    this.init();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }
}

export const weddingMusic = new WeddingSynth();
