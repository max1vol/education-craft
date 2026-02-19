export interface BlockDefinition {
  label: string;
  color: string;
  accent: string;
  texture: string;
  solid: boolean;
  breakable: boolean;
  placeable: boolean;
  transparent?: boolean;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  emissive?: string;
}

export const BLOCKS: Record<string, BlockDefinition> = {
  bedrock: {
    label: 'Bedrock',
    color: '#2d2d33',
    accent: '#222329',
    texture: '/assets/textures/blocks/bedrock/winner.png',
    solid: true,
    breakable: false,
    placeable: false
  },
  dirt: {
    label: 'Dirt',
    color: '#7f5a39',
    accent: '#986947',
    texture: '/assets/textures/blocks/dirt/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  grass: {
    label: 'Grass',
    color: '#5fa048',
    accent: '#79bd5e',
    texture: '/assets/textures/blocks/grass/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  stone: {
    label: 'Stone',
    color: '#80858f',
    accent: '#9ca3ad',
    texture: '/assets/textures/blocks/stone/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  sand: {
    label: 'Sand',
    color: '#d8c27a',
    accent: '#ebd89a',
    texture: '/assets/textures/blocks/sand/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  sandstone: {
    label: 'Sandstone',
    color: '#c9ae73',
    accent: '#d9c08d',
    texture: '/assets/textures/blocks/sandstone/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  marble: {
    label: 'Marble',
    color: '#e6e2d7',
    accent: '#faf6eb',
    texture: '/assets/textures/blocks/marble/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  skara_earth: {
    label: 'Skara Earth',
    color: '#9d998e',
    accent: '#b2aea1',
    texture: '/assets/textures/blocks/skara-earth/winner.png',
    solid: true,
    breakable: true,
    placeable: true,
    roughness: 0.97,
    metalness: 0
  },
  skara_stone: {
    label: 'Skara Stone',
    color: '#8d939b',
    accent: '#a9b0b8',
    texture: '/assets/textures/blocks/skara-stone/winner.png',
    solid: true,
    breakable: true,
    placeable: true,
    roughness: 0.9,
    metalness: 0.02
  },
  skara_hearth: {
    label: 'Skara Hearth Stone',
    color: '#c6c1b8',
    accent: '#ddd8ce',
    texture: '/assets/textures/blocks/skara-hearth/winner.png',
    solid: true,
    breakable: true,
    placeable: true,
    roughness: 0.86,
    metalness: 0.01
  },
  frost: {
    label: 'Frost Block',
    color: '#c2d7e7',
    accent: '#e0f0fa',
    texture: '/assets/textures/blocks/frost/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  ice: {
    label: 'Ice',
    color: '#a7d4f5',
    accent: '#d0eeff',
    texture: '/assets/textures/blocks/ice/winner.png',
    solid: true,
    breakable: true,
    placeable: true,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2
  },
  basalt: {
    label: 'Basalt',
    color: '#3f434c',
    accent: '#555b67',
    texture: '/assets/textures/blocks/basalt/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  obsidian: {
    label: 'Obsidian',
    color: '#241f35',
    accent: '#3f3761',
    texture: '/assets/textures/blocks/obsidian/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  water: {
    label: 'Water',
    color: '#3a80c5',
    accent: '#5ba6f0',
    texture: '/assets/textures/blocks/water/winner.svg',
    solid: false,
    breakable: true,
    placeable: false,
    transparent: true,
    opacity: 0.72,
    roughness: 0.28
  },
  aqueduct_water: {
    label: 'Aqueduct Water',
    color: '#6caed9',
    accent: '#a4d8f6',
    texture: '/assets/textures/blocks/aqueduct-water/winner.png',
    solid: false,
    breakable: true,
    placeable: false,
    transparent: true,
    opacity: 0.76,
    roughness: 0.14,
    metalness: 0.08,
    emissive: '#0b2f3d'
  },
  timber: {
    label: 'Timber',
    color: '#8f6c48',
    accent: '#b39063',
    texture: '/assets/textures/blocks/timber/winner.png',
    solid: true,
    breakable: true,
    placeable: true
  },
  leaf: {
    label: 'Leaf Block',
    color: '#4f8a4c',
    accent: '#76af64',
    texture: '/assets/textures/blocks/leaf/winner.png',
    solid: false,
    breakable: true,
    placeable: true,
    transparent: true,
    opacity: 0.78
  },
  flower: {
    label: 'Flower',
    color: '#d26a8c',
    accent: '#f3acc3',
    texture: '/assets/textures/blocks/flower/winner.png',
    solid: false,
    breakable: true,
    placeable: true,
    transparent: true,
    opacity: 0.9
  },
  reed: {
    label: 'Reed',
    color: '#86b760',
    accent: '#b8da7d',
    texture: '/assets/textures/blocks/reed/winner.png',
    solid: false,
    breakable: true,
    placeable: true,
    transparent: true,
    opacity: 0.93
  },
  lantern: {
    label: 'Lantern',
    color: '#e5b860',
    accent: '#ffe4ad',
    texture: '/assets/textures/blocks/lantern/winner.png',
    solid: false,
    breakable: true,
    placeable: false,
    transparent: true,
    opacity: 0.88,
    roughness: 0.25,
    metalness: 0.35,
    emissive: '#ffcf87'
  },
  portal_core: {
    label: 'Portal Core',
    color: '#5ac8ff',
    accent: '#a6f3ff',
    texture: '/assets/textures/blocks/portal-core/winner.svg',
    solid: false,
    breakable: false,
    placeable: false,
    transparent: true,
    opacity: 0.62,
    roughness: 0.08,
    metalness: 0.35,
    emissive: '#36b7ff'
  }
};

export type BlockId = keyof typeof BLOCKS;

export const HOTBAR_DEFAULT: BlockId[] = [
  'dirt',
  'grass',
  'stone',
  'sand',
  'sandstone',
  'marble',
  'frost',
  'basalt',
  'obsidian'
];

export const INVENTORY_DEFAULT: Record<BlockId, number> = {
  bedrock: 0,
  dirt: 24,
  grass: 18,
  stone: 26,
  sand: 18,
  sandstone: 14,
  marble: 12,
  skara_earth: 0,
  skara_stone: 0,
  skara_hearth: 0,
  frost: 10,
  ice: 0,
  basalt: 12,
  obsidian: 10,
  timber: 8,
  leaf: 12,
  flower: 6,
  reed: 6,
  lantern: 0,
  water: 0,
  aqueduct_water: 0,
  portal_core: 0
};
