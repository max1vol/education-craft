export interface AudioTrackDefinition {
  id: string;
  label: string;
  era: string;
  src: string;
}

export interface SfxDefinition {
  break: string[];
  place: string[];
}

export const BGM_TRACKS: AudioTrackDefinition[] = [
  {
    id: 'stonehenge-drum-loop',
    label: 'Stonehenge Drum Loop',
    era: 'Neolithic Britain',
    src: '/assets/audio/bgm/stonehenge_drums.wav'
  },
  {
    id: 'desert-travel-loop',
    label: 'Desert Travel Loop',
    era: 'Roman Britain Context',
    src: '/assets/audio/bgm/desert_travel.ogg'
  },
  {
    id: 'portal-atmosphere-loop',
    label: 'Portal Atmosphere',
    era: 'Roman Engineering',
    src: '/assets/audio/bgm/portal.ogg'
  },
  {
    id: 'forest-ambience-loop',
    label: 'Forest Ambience',
    era: 'Neolithic Orkney',
    src: '/assets/audio/bgm/forest_ambience.mp3'
  }
];

export const SFX_TRACKS: SfxDefinition = {
  break: [
    '/assets/audio/sfx/break-01.wav',
    '/assets/audio/sfx/break-02.wav',
    '/assets/audio/sfx/break-03.wav',
    '/assets/audio/sfx/break-04.wav'
  ],
  place: ['/assets/audio/sfx/place-01.wav', '/assets/audio/sfx/place-02.wav', '/assets/audio/sfx/place-03.wav']
};
