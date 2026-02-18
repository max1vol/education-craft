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
    label: 'Stone Circle Drone',
    era: 'Neolithic',
    src: '/assets/audio/bgm/neolithic-drones.wav'
  },
  {
    id: 'old-kingdom-procession',
    label: 'Pyramid Procession',
    era: 'Old Kingdom Egypt',
    src: '/assets/audio/bgm/old-kingdom-procession.wav'
  },
  {
    id: 'hellenic-cold-chant',
    label: 'Hellenic Frost Chant',
    era: 'Classical / Hellenistic',
    src: '/assets/audio/bgm/hellenic-cold-chant.wav'
  },
  {
    id: 'mesopotamian-ritual',
    label: 'Ziggurat Ritual',
    era: 'Bronze Age Mesopotamia',
    src: '/assets/audio/bgm/mesopotamian-ritual.wav'
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
