export interface TextureFamilyPipeline {
  id: string;
  label: string;
  blockIds: string[];
  referenceInputs: string[];
  candidates: string[];
  winner: string;
  legacy: string;
}

export const TEXTURE_FAMILIES: TextureFamilyPipeline[] = [
  {
    id: 'grass',
    label: 'Grassland Ground',
    blockIds: ['grass', 'leaf', 'flower', 'reed'],
    referenceInputs: ['nanobanana /generate family_grass*'],
    candidates: [
      '/assets/textures/blocks/grass/candidate-01.png',
      '/assets/textures/blocks/grass/candidate-02.png',
      '/assets/textures/blocks/grass/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/grass/winner.png',
    legacy: '/assets/textures/legacy/grass-before.png'
  },
  {
    id: 'dirt',
    label: 'Soil / Dirt',
    blockIds: ['dirt'],
    referenceInputs: ['nanobanana /generate family_dirt'],
    candidates: [
      '/assets/textures/blocks/dirt/candidate-01.png',
      '/assets/textures/blocks/dirt/candidate-02.png',
      '/assets/textures/blocks/dirt/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/dirt/winner.png',
    legacy: '/assets/textures/legacy/dirt-before.png'
  },
  {
    id: 'stone',
    label: 'Stone Construction',
    blockIds: ['stone'],
    referenceInputs: ['nanobanana /generate family_stone'],
    candidates: [
      '/assets/textures/blocks/stone/candidate-01.png',
      '/assets/textures/blocks/stone/candidate-02.png',
      '/assets/textures/blocks/stone/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/stone/winner.png',
    legacy: '/assets/textures/legacy/stone-before.png'
  },
  {
    id: 'sand',
    label: 'Sand Terrain',
    blockIds: ['sand'],
    referenceInputs: ['nanobanana /generate family_sand'],
    candidates: [
      '/assets/textures/blocks/sand/candidate-01.png',
      '/assets/textures/blocks/sand/candidate-02.png',
      '/assets/textures/blocks/sand/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/sand/winner.png',
    legacy: '/assets/textures/legacy/sand-before.png'
  },
  {
    id: 'sandstone',
    label: 'Sandstone Masonry',
    blockIds: ['sandstone'],
    referenceInputs: ['nanobanana /generate family_sandstone'],
    candidates: [
      '/assets/textures/blocks/sandstone/candidate-01.png',
      '/assets/textures/blocks/sandstone/candidate-02.png',
      '/assets/textures/blocks/sandstone/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/sandstone/winner.png',
    legacy: '/assets/textures/legacy/sandstone-before.png'
  },
  {
    id: 'marble',
    label: 'Marble Monument',
    blockIds: ['marble', 'frost'],
    referenceInputs: ['nanobanana /generate family_marble'],
    candidates: [
      '/assets/textures/blocks/marble/candidate-01.png',
      '/assets/textures/blocks/marble/candidate-02.png',
      '/assets/textures/blocks/marble/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/marble/winner.png',
    legacy: '/assets/textures/legacy/marble-before.png'
  },
  {
    id: 'basalt',
    label: 'Basalt / Obsidian',
    blockIds: ['basalt', 'obsidian'],
    referenceInputs: ['nanobanana /generate family_basalt'],
    candidates: [
      '/assets/textures/blocks/basalt/candidate-01.png',
      '/assets/textures/blocks/basalt/candidate-02.png',
      '/assets/textures/blocks/basalt/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/basalt/winner.png',
    legacy: '/assets/textures/legacy/basalt-before.png'
  },
  {
    id: 'timber',
    label: 'Weathered Timber',
    blockIds: ['timber'],
    referenceInputs: ['nanobanana /generate family_timber'],
    candidates: [
      '/assets/textures/blocks/timber/candidate-01.png',
      '/assets/textures/blocks/timber/candidate-02.png',
      '/assets/textures/blocks/timber/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/timber/winner.png',
    legacy: '/assets/textures/legacy/timber-before.png'
  },
  {
    id: 'ice',
    label: 'Ice Crystals',
    blockIds: ['ice'],
    referenceInputs: ['nanobanana /generate family_ice'],
    candidates: [
      '/assets/textures/blocks/ice/candidate-01.png',
      '/assets/textures/blocks/ice/candidate-02.png',
      '/assets/textures/blocks/ice/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/ice/winner.png',
    legacy: '/assets/textures/legacy/ice-before.png'
  },
  {
    id: 'skara-earth',
    label: 'Skara Brae Ground',
    blockIds: ['skara_earth'],
    referenceInputs: ['nanobanana /generate seamless_topdown_earthy_gravel*'],
    candidates: [
      '/assets/textures/blocks/skara-earth/candidate-01.png',
      '/assets/textures/blocks/skara-earth/candidate-02.png',
      '/assets/textures/blocks/skara-earth/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/skara-earth/winner.png',
    legacy: '/assets/textures/blocks/frost/winner.png'
  },
  {
    id: 'skara-stone',
    label: 'Skara Brae Wall Stone',
    blockIds: ['skara_stone'],
    referenceInputs: ['nanobanana /generate seamless_topdown_texture_of_weat*'],
    candidates: [
      '/assets/textures/blocks/skara-stone/candidate-01.png',
      '/assets/textures/blocks/skara-stone/candidate-02.png',
      '/assets/textures/blocks/skara-stone/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/skara-stone/winner.png',
    legacy: '/assets/textures/blocks/stone/winner.png'
  },
  {
    id: 'skara-hearth',
    label: 'Skara Brae Hearth Stone',
    blockIds: ['skara_hearth'],
    referenceInputs: ['nanobanana /generate seamless_topdown_texture_of_worn*'],
    candidates: [
      '/assets/textures/blocks/skara-hearth/candidate-01.png',
      '/assets/textures/blocks/skara-hearth/candidate-02.png',
      '/assets/textures/blocks/skara-hearth/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/skara-hearth/winner.png',
    legacy: '/assets/textures/blocks/sandstone/winner.png'
  },
  {
    id: 'aqueduct-water',
    label: 'Aqueduct Flow Water',
    blockIds: ['aqueduct_water'],
    referenceInputs: ['nanobanana /generate seamless_topdown_texture_of_shal*'],
    candidates: [
      '/assets/textures/blocks/aqueduct-water/candidate-01.png',
      '/assets/textures/blocks/aqueduct-water/candidate-02.png',
      '/assets/textures/blocks/aqueduct-water/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/aqueduct-water/winner.png',
    legacy: '/assets/textures/blocks/water/winner.svg'
  }
];
