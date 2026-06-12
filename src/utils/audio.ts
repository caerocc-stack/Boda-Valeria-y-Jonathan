// Web Audio Synthesizer — Marcha Nupcial (Mendelssohn "Wedding March")
// Sintetiza la marcha nupcial clásica en vivo, sin archivos de audio.
class WeddingSynth {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private isPlaying = false;
  private melodyTimer: any = null;

  private tempo = 96; // BPM (marcha solemne)

  // Frecuencias de las notas necesarias (Hz)
  private notes: Record<string, number> = {
    // Octava 2
    'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    // Octava 3
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    // Octava 4
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    // Octava 5
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
  };

  // Melodía de la Marcha Nupcial (Mendelssohn) — [nota, duración en tiempos]. 24 tiempos por vuelta.
  private melody: [string, number][] = [
    // Compás 1 — fanfarria triunfal "ta ta-ta TAAA"
    ['C5', 1], ['C5', 0.5], ['C5', 0.5], ['C5', 2],
    // Compás 2 — C B C E  G————
    ['C5', 0.5], ['B4', 0.5], ['C5', 0.5], ['E5', 0.5], ['G5', 2],
    // Compás 3 — descenso A F D B
    ['A5', 1], ['F5', 1], ['D5', 1], ['B4', 1],
    // Compás 4 — resolución y enlace
    ['C5', 2], ['E5', 1], ['G5', 1],
    // Compás 5 — A G F E
    ['A5', 1], ['G5', 1], ['F5', 1], ['E5', 1],
    // Compás 6 — cadencia final
    ['D5', 1], ['G4', 1], ['C5', 2]
  ];

  // Acordes de acompañamiento — [tiempoInicio, duración, notas]
  private chords: [number, number, string[]][] = [
    [0, 4, ['C3', 'E3', 'G3']],      // C
    [4, 4, ['C3', 'E3', 'G3']],      // C
    [8, 4, ['G2', 'B2', 'D3', 'F3']],// G7
    [12, 4, ['C3', 'E3', 'G3']],     // C
    [16, 4, ['F3', 'A3', 'C4']],     // F
    [20, 2, ['G2', 'B2', 'D3', 'F3']],// G7
    [22, 2, ['C3', 'E3', 'G3']]      // C
  ];

  private totalBeats = 24;

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.value = 0.13; // volumen suave de fondo

    // Reverb/delay simple para un aire de iglesia/salón
    const delay = this.ctx.createDelay(1.0);
    const feedback = this.ctx.createGain();
    delay.delayTime.value = 0.42;
    feedback.gain.value = 0.22;

    this.masterVolume.connect(this.ctx.destination);
    this.masterVolume.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.ctx.destination);
  }

  // Sonido tipo arpa/piano suave con envolvente
  private playPluck(
    frequency: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'triangle',
    velocity = 1,
    brightness = 1400
  ) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(brightness, startTime);
    filter.frequency.exponentialRampToValueAtTime(350, startTime + duration);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.16 * velocity, startTime + 0.06); // ataque suave
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);  // decaimiento

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
    this.scheduleLoop();
  }

  private scheduleLoop = () => {
    if (!this.isPlaying || !this.ctx) return;
    const beat = 60 / this.tempo;
    const t0 = this.ctx.currentTime + 0.06;

    // Melodía
    let pos = 0;
    for (const [note, beats] of this.melody) {
      const f = this.notes[note];
      if (f) this.playPluck(f, t0 + pos * beat, beats * beat * 0.92, 'triangle', 0.85, 1800);
      pos += beats;
    }

    // Acordes (arpegiados, suaves, de fondo)
    for (const [startB, durB, chord] of this.chords) {
      chord.forEach((n, i) => {
        const f = this.notes[n];
        if (f) this.playPluck(f, t0 + startB * beat + i * 0.05, durB * beat * 0.95, 'sine', 0.45, 900);
      });
    }

    // Programar la siguiente vuelta
    this.melodyTimer = setTimeout(this.scheduleLoop, this.totalBeats * beat * 1000);
  };

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
