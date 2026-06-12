// Reproductor de música de fondo — usa un archivo de audio propio en bucle.
import musicUrl from '../assets/wedding-music.m4a';

class WeddingMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playing = false;

  private init() {
    if (this.audio) return;
    this.audio = new Audio(musicUrl);
    this.audio.loop = true;        // se repite indefinidamente
    this.audio.preload = 'auto';
    this.audio.volume = 0.6;       // volumen de fondo
  }

  start() {
    this.init();
    if (!this.audio) return;
    // play() debe llamarse desde un gesto del usuario (clic) por políticas de autoplay
    const p = this.audio.play();
    if (p && typeof (p as any).catch === 'function') {
      (p as Promise<void>).catch((e) => console.warn('No se pudo reproducir el audio:', e));
    }
    this.playing = true;
  }

  stop() {
    if (this.audio) this.audio.pause();
    this.playing = false;
  }

  get isSynthPlaying() {
    return this.playing;
  }

  setVolume(vol: number) {
    this.init();
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, vol));
  }
}

export const weddingMusic = new WeddingMusicPlayer();
