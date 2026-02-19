export interface TerrainProfile {
  base: number;
  amplitude: number;
  detailAmp: number;
  ridgeAmp: number;
  scale: number;
  centerLift: number;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  center: { x: number; z: number };
  spawnOffset: { x: number; z: number };
  spawnLookAtOffset: { x: number; z: number };
  seed: number;
  monumentName: string;
  topBlock: string;
  fillerBlock: string;
  deepBlock: string;
  waterLevel: number;
  terrain: TerrainProfile;
  skyColor: string;
  fogColor: string;
  portalTo: string;
  portalOffset: { x: number; z: number };
  eraLabel: string;
  musicTrackId: string;
  ambientColor: string;
}

export const BIOMES: BiomeDefinition[] = [
  {
    id: 'stonehenge-salisbury',
    name: 'Salisbury Plain',
    center: { x: 0, z: 0 },
    spawnOffset: { x: -22, z: 10 },
    spawnLookAtOffset: { x: 0, z: 0 },
    seed: 111,
    monumentName: 'Stonehenge',
    topBlock: 'grass',
    fillerBlock: 'dirt',
    deepBlock: 'stone',
    waterLevel: 8,
    terrain: { base: 10, amplitude: 3.6, detailAmp: 1.3, ridgeAmp: 0.8, scale: 0.017, centerLift: 2.9 },
    skyColor: '#9dc7f0',
    fogColor: '#749ec4',
    portalTo: 'colosseum-rome',
    portalOffset: { x: 16, z: -2 },
    eraLabel: 'Neolithic Britain',
    musicTrackId: 'stonehenge-drum-loop',
    ambientColor: '#cce5ff'
  },
  {
    id: 'colosseum-rome',
    name: 'Roman Heartlands',
    center: { x: 248, z: 26 },
    spawnOffset: { x: -26, z: 8 },
    spawnLookAtOffset: { x: 0, z: 0 },
    seed: 223,
    monumentName: 'Colosseum',
    topBlock: 'stone',
    fillerBlock: 'dirt',
    deepBlock: 'stone',
    waterLevel: 0,
    terrain: { base: 11, amplitude: 2.8, detailAmp: 1.1, ridgeAmp: 0.9, scale: 0.016, centerLift: 2.4 },
    skyColor: '#afcbec',
    fogColor: '#8ca7c3',
    portalTo: 'roman-aqueduct',
    portalOffset: { x: 14, z: -10 },
    eraLabel: 'Roman Britain Context',
    musicTrackId: 'desert-travel-loop',
    ambientColor: '#dcecff'
  },
  {
    id: 'roman-aqueduct',
    name: 'Aqueduct Frontier',
    center: { x: -228, z: -164 },
    spawnOffset: { x: -30, z: 0 },
    spawnLookAtOffset: { x: 8, z: 0 },
    seed: 337,
    monumentName: 'Roman Aqueduct',
    topBlock: 'sand',
    fillerBlock: 'sandstone',
    deepBlock: 'stone',
    waterLevel: 0,
    terrain: { base: 10, amplitude: 3.2, detailAmp: 1.1, ridgeAmp: 1.1, scale: 0.018, centerLift: 1.9 },
    skyColor: '#d8c6a9',
    fogColor: '#af9780',
    portalTo: 'skara-brae',
    portalOffset: { x: 18, z: 6 },
    eraLabel: 'Roman Engineering',
    musicTrackId: 'portal-atmosphere-loop',
    ambientColor: '#ffe0c4'
  },
  {
    id: 'skara-brae',
    name: 'Orkney Coast',
    center: { x: -204, z: 184 },
    spawnOffset: { x: -18, z: 14 },
    spawnLookAtOffset: { x: 0, z: -2 },
    seed: 447,
    monumentName: 'Skara Brae',
    topBlock: 'skara_earth',
    fillerBlock: 'skara_earth',
    deepBlock: 'skara_stone',
    waterLevel: 9,
    terrain: { base: 12, amplitude: 4.1, detailAmp: 1.6, ridgeAmp: 1.4, scale: 0.016, centerLift: 2.2 },
    skyColor: '#b6d4ed',
    fogColor: '#87abc9',
    portalTo: 'stonehenge-salisbury',
    portalOffset: { x: 12, z: -12 },
    eraLabel: 'Neolithic Orkney',
    musicTrackId: 'forest-ambience-loop',
    ambientColor: '#d6edff'
  }
];

export const BIOME_BY_ID = new Map(BIOMES.map((biome) => [biome.id, biome]));
