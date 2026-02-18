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
    id: 'neolithic-drones',
    label: 'Stonehenge Drum Loop',
    era: 'Neolithic',
    src: '/assets/audio/bgm/stonehenge_drums.mp3'
  },
  {
    id: 'old-kingdom-procession',
    label: 'Desert Travel Loop',
    era: 'Old Kingdom Egypt',
    src: '/assets/audio/bgm/desert_travel.mp3'
  },
  {
    id: 'hellenic-cold-chant',
    label: 'Outer Space Ambience',
    era: 'Classical / Hellenistic',
    src: '/assets/audio/bgm/outer_space.mp3'
  },
  {
    id: 'mesopotamian-ritual',
    label: 'Forest Ambience',
    era: 'Bronze Age Mesopotamia',
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
