export interface TextureFamilyPipeline {
  id: string;
  label: string;
  blockIds: string[];
  referenceInputs: string[];
  candidates: string[];
  winner: string;
}

export const TEXTURE_FAMILIES: TextureFamilyPipeline[] = [
  {
    id: 'dirt',
    label: 'Soil / Dirt',
    blockIds: ['dirt', 'timber'],
    referenceInputs: [
      'docs/texture-refs/style-ref-modern.png',
      'docs/texture-refs/style-ref-pattern.png'
    ],
    candidates: [
      '/assets/textures/blocks/dirt/candidate-01.png',
      '/assets/textures/blocks/dirt/candidate-02.png',
      '/assets/textures/blocks/dirt/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/dirt/winner.png'
  },
  {
    id: 'grass',
    label: 'Grass / Flora',
    blockIds: ['grass', 'leaf', 'flower', 'reed'],
    referenceInputs: [
      'docs/texture-refs/style-ref-modern.png',
      'docs/texture-refs/style-ref-pattern.png'
    ],
    candidates: [
      '/assets/textures/blocks/grass/candidate-01.png',
      '/assets/textures/blocks/grass/candidate-02.png',
      '/assets/textures/blocks/grass/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/grass/winner.png'
  },
  {
    id: 'stone',
    label: 'Stone / Monument Core',
    blockIds: ['stone', 'bedrock'],
    referenceInputs: ['docs/texture-refs/style-ref-modern.png'],
    candidates: [
      '/assets/textures/blocks/stone/candidate-01.png',
      '/assets/textures/blocks/stone/candidate-02.png',
      '/assets/textures/blocks/stone/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/stone/winner.png'
  },
  {
    id: 'sand',
    label: 'Sand / Sandstone',
    blockIds: ['sand', 'sandstone'],
    referenceInputs: ['docs/texture-refs/style-ref-pattern.png'],
    candidates: [
      '/assets/textures/blocks/sand/candidate-01.png',
      '/assets/textures/blocks/sand/candidate-02.png',
      '/assets/textures/blocks/sand/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/sand/winner.png'
  },
  {
    id: 'marble',
    label: 'Marble / Frost',
    blockIds: ['marble', 'frost', 'ice', 'lantern'],
    referenceInputs: ['docs/texture-refs/style-ref-modern.png'],
    candidates: [
      '/assets/textures/blocks/marble/candidate-01.png',
      '/assets/textures/blocks/marble/candidate-02.png',
      '/assets/textures/blocks/marble/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/marble/winner.png'
  },
  {
    id: 'basalt',
    label: 'Basalt / Obsidian',
    blockIds: ['basalt', 'obsidian'],
    referenceInputs: ['docs/texture-refs/style-ref-pattern.png'],
    candidates: [
      '/assets/textures/blocks/basalt/candidate-01.png',
      '/assets/textures/blocks/basalt/candidate-02.png',
      '/assets/textures/blocks/basalt/candidate-03.png'
    ],
    winner: '/assets/textures/blocks/basalt/winner.png'
  }
];
