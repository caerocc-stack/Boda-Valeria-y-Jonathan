// Reproductor de música de fondo — usa un archivo de audio propio en bucle, con fade-in/out.
import musicUrl from '../assets/wedding-music.m4a';

class WeddingMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private targetVolume = 0.6;     // volumen final de fondo
  private fadeTimer: any = null;

  private init() {
    if (this.audio) return;
    this.audio = new Audio(musicUrl);
    this.audio.loop = true;        // se repite indefinidamente
    this.audio.preload = 'auto';
    this.audio.volume = 0;
  }

  private clearFade() {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  // Anima el volumen desde el actual hasta "to" en "durationMs". onDone opcional.
  private fadeTo(to: number, durationMs: number, onDone?: () => void) {
    if (!this.audio) return;
    this.clearFade();
    const steps = 40;
    const stepMs = Math.max(10, durationMs / steps);
    const from = this.audio.volume;
    let i = 0;
    this.fadeTimer = setInterval(() => {
      i++;
      const v = from + (to - from) * (i / steps);
      if (this.audio) this.audio.volume = Math.max(0, Math.min(1, v));
      if (i >= steps) {
        this.clearFade();
        if (this.audio) this.audio.volume = Math.max(0, Math.min(1, to));
        onDone?.();
      }
    }, stepMs);
  }

  start() {
    this.init();
    if (!this.audio) return;
    // play() debe llamarse desde un gesto del usuario (clic) por políticas de autoplay
    this.audio.volume = 0;
    const p = this.audio.play();
    if (p && typeof (p as any).catch === 'function') {
      (p as Promise<void>).catch((e) => console.warn('No se pudo reproducir el audio:', e));
    }
    this.playing = true;
    // Fade-in suave (≈ 3 s)
    this.fadeTo(this.targetVolume, 3000);
  }

  stop() {
    if (!this.audio) {
      this.playing = false;
      return;
    }
    this.playing = false;
    const audio = this.audio;
    // Fade-out suave (≈ 0.8 s) y luego pausa
    this.fadeTo(0, 800, () => {
      if (!this.playing) audio.pause();
    });
  }

  get isSynthPlaying() {
    return this.playing;
  }

  setVolume(vol: number) {
    this.init();
    this.targetVolume = Math.max(0, Math.min(1, vol));
    if (this.audio && this.playing) this.audio.volume = this.targetVolume;
  }
}

export const weddingMusic = new WeddingMusicPlayer();
