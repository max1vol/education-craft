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
    id: 'ring-plains',
    name: 'Ring Plains',
    center: { x: 0, z: 0 },
    seed: 11,
    monumentName: 'Ancient Stone Ring',
    topBlock: 'grass',
    fillerBlock: 'dirt',
    deepBlock: 'stone',
    waterLevel: 9,
    terrain: { base: 10, amplitude: 4.2, detailAmp: 1.8, ridgeAmp: 1.2, scale: 0.018, centerLift: 2.3 },
    skyColor: '#9dc7f0',
    fogColor: '#6ea0ca',
    portalTo: 'dune-pyramid',
    portalOffset: { x: 12, z: -2 },
    eraLabel: 'Neolithic',
    musicTrackId: 'neolithic-drones',
    ambientColor: '#cce5ff'
  },
  {
    id: 'dune-pyramid',
    name: 'Dune Pyramid',
    center: { x: 220, z: 12 },
    seed: 23,
    monumentName: 'Sun Pyramid',
    topBlock: 'sand',
    fillerBlock: 'sandstone',
    deepBlock: 'stone',
    waterLevel: 0,
    terrain: { base: 11, amplitude: 3.4, detailAmp: 2.2, ridgeAmp: 1.4, scale: 0.017, centerLift: 1.5 },
    skyColor: '#f0cb95',
    fogColor: '#d9a367',
    portalTo: 'frost-citadel',
    portalOffset: { x: -10, z: 8 },
    eraLabel: 'Old Kingdom Egypt',
    musicTrackId: 'old-kingdom-procession',
    ambientColor: '#f7d7a5'
  },
  {
    id: 'frost-citadel',
    name: 'Frost Citadel',
    center: { x: -208, z: 180 },
    seed: 37,
    monumentName: 'Glacial Bastion',
    topBlock: 'frost',
    fillerBlock: 'stone',
    deepBlock: 'stone',
    waterLevel: 11,
    terrain: { base: 13, amplitude: 5, detailAmp: 2, ridgeAmp: 1.8, scale: 0.016, centerLift: 2.7 },
    skyColor: '#b3d7ef',
    fogColor: '#88b4d6',
    portalTo: 'ember-terrace',
    portalOffset: { x: 8, z: 11 },
    eraLabel: 'Classical / Hellenistic',
    musicTrackId: 'hellenic-cold-chant',
    ambientColor: '#d6edff'
  },
  {
    id: 'ember-terrace',
    name: 'Ember Terrace',
    center: { x: -226, z: -164 },
    seed: 47,
    monumentName: 'Basalt Ziggurat',
    topBlock: 'basalt',
    fillerBlock: 'obsidian',
    deepBlock: 'stone',
    waterLevel: 0,
    terrain: { base: 12, amplitude: 4.6, detailAmp: 2.5, ridgeAmp: 1.5, scale: 0.02, centerLift: 2 },
    skyColor: '#b4866f',
    fogColor: '#7f5d50',
    portalTo: 'ring-plains',
    portalOffset: { x: -11, z: -6 },
    eraLabel: 'Bronze Age Mesopotamia',
    musicTrackId: 'mesopotamian-ritual',
    ambientColor: '#ffc7a7'
  }
];

export const BIOME_BY_ID = new Map(BIOMES.map((biome) => [biome.id, biome]));
