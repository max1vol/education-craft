import { BGM_TRACKS, SFX_TRACKS, type AudioTrackDefinition, type SfxDefinition } from '$lib/data/monument-realms/audio';

export interface VolumeState {
  master: number;
  music: number;
  sfx: number;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

export class MonumentAudioManager {
  private readonly bgmById = new Map<string, HTMLAudioElement>();
  private readonly sfxByType: Record<'break' | 'place', HTMLAudioElement[]> = { break: [], place: [] };
  private readonly volumes: VolumeState = { master: 0.8, music: 0.5, sfx: 0.7 };
  private currentTrackId: string | null = null;
  private unlocked = false;

  constructor(
    tracks: AudioTrackDefinition[] = BGM_TRACKS,
    sfx: SfxDefinition = SFX_TRACKS
  ) {
    for (const track of tracks) {
      const audio = new Audio(track.src);
      audio.loop = true;
      audio.preload = 'auto';
      this.bgmById.set(track.id, audio);
    }

    for (const src of sfx.break) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      this.sfxByType.break.push(audio);
    }

    for (const src of sfx.place) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      this.sfxByType.place.push(audio);
    }

    this.applyVolume();
  }

  setVolumes(next: Partial<VolumeState>): VolumeState {
    if (typeof next.master === 'number') this.volumes.master = clamp(next.master);
    if (typeof next.music === 'number') this.volumes.music = clamp(next.music);
    if (typeof next.sfx === 'number') this.volumes.sfx = clamp(next.sfx);
    this.applyVolume();
    return this.getVolumes();
  }

  getVolumes(): VolumeState {
    return { ...this.volumes };
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.currentTrackId) {
      this.playTrack(this.currentTrackId);
    }
  }

  playTrack(trackId: string): void {
    if (this.currentTrackId === trackId) {
      const existing = this.currentTrackId ? this.bgmById.get(this.currentTrackId) : null;
      if (existing && existing.paused && this.unlocked) {
        void existing.play().catch(() => {});
      }
      return;
    }

    if (this.currentTrackId) {
      const previous = this.bgmById.get(this.currentTrackId);
      if (previous) {
        previous.pause();
        previous.currentTime = 0;
      }
    }

    this.currentTrackId = trackId;
    if (!this.unlocked) return;
    this.playTrackNow(trackId);
  }

  playSfx(type: 'break' | 'place'): void {
    if (!this.unlocked) return;
    const candidates = this.sfxByType[type];
    if (!candidates.length) return;

    const index = Math.floor(Math.random() * candidates.length);
    const source = candidates[index];

    const voice = source.cloneNode() as HTMLAudioElement;
    voice.volume = this.volumes.master * this.volumes.sfx;
    voice.currentTime = 0;
    void voice.play().catch(() => {});
  }

  dispose(): void {
    for (const audio of this.bgmById.values()) {
      audio.pause();
      audio.src = '';
    }

    for (const group of Object.values(this.sfxByType)) {
      for (const audio of group) {
        audio.pause();
        audio.src = '';
      }
    }
  }

  private playTrackNow(trackId: string): void {
    const next = this.bgmById.get(trackId);
    if (!next) return;
    next.currentTime = 0;
    next.volume = this.volumes.master * this.volumes.music;
    void next.play().catch(() => {});
  }

  private applyVolume(): void {
    if (!this.currentTrackId) return;
    const current = this.bgmById.get(this.currentTrackId);
    if (!current) return;
    current.volume = this.volumes.master * this.volumes.music;
  }
}
