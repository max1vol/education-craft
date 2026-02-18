import { BIOMES, BIOME_BY_ID, type BiomeDefinition } from '$lib/data/monument-realms/biomes';
import { BLOCKS, type BlockId } from '$lib/data/monument-realms/blocks';
import { WORLD_MAX_Y, WORLD_MIN_Y } from '$lib/data/monument-realms/world';
import { columnKeyFor, keyFor } from './keys';
import { hash2, hash3 } from './noise';
import { buildStructures } from './structures';
import { getBiomeAt, getTerrainHeight } from './terrain';
import type { MonumentDistance, PortalArrival, StructureCell } from './types';

type BlockSource = 'terrain' | 'flora' | 'monument' | 'portal' | 'special' | 'edit';

export type DebugLayer = 'terrain' | 'flora' | 'monument' | 'portal' | 'special';

export interface BlockSample {
  type: BlockId;
  source: BlockSource;
  portalTo: string | null;
}

export interface WorldState {
  structureBlocks: Map<string, StructureCell>;
  structureColumnMaxY: Map<string, number>;
  portalArrival: Map<string, PortalArrival>;
  getBiomeAt: typeof getBiomeAt;
  getTerrainHeight: typeof getTerrainHeight;
  getBlockAt: (x: number, y: number, z: number) => BlockId | null;
  getBlockSampleAt: (x: number, y: number, z: number) => BlockSample | null;
  getTopBlockForLayers: (x: number, z: number, layers: Set<DebugLayer>) => { y: number; sample: BlockSample } | null;
  getColumnRenderMaxY: (x: number, z: number) => number;
  getPortalTargetAt: (x: number, y: number, z: number) => string | null;
  isProtectedBlock: (x: number, y: number, z: number) => boolean;
  isSolidForCollision: (type: string | null) => boolean;
  isOpaqueBlock: (type: string | null) => boolean;
  shouldRenderBlock: (x: number, y: number, z: number, type: BlockId) => boolean;
  findSpawnPosition: (biomeId: string) => PortalArrival;
  getPortalArrival: (biomeId: string) => PortalArrival;
  getMonumentDistances: (x: number, z: number) => MonumentDistance[];
  removeBlock: (x: number, y: number, z: number) => void;
  setBlock: (x: number, y: number, z: number, type: BlockId) => void;
}

const DECORATION_SCAN_HEIGHT = 8;
const DEBUG_SPECIAL_BLOCKS = new Set<BlockId>(['lantern', 'portal_core']);
const FLORETS: readonly BlockId[] = ['flower', 'reed'];

function selectDecorationType(biome: BiomeDefinition, x: number, z: number): BlockId | null {
  const distFromCenter = Math.hypot(x - biome.center.x, z - biome.center.z);

  if (distFromCenter < 34) {
    return null;
  }

  const treeNoise = hash2(x, z, biome.seed + 411);
  const flowerNoise = hash2(x, z, biome.seed + 547);
  const beaconNoise = hash2(x, z, biome.seed + 683);

  if (biome.id === 'ring-plains') {
    if (treeNoise > 0.998) return 'timber';
    if (flowerNoise > 0.985) return FLORETS[(Math.floor(flowerNoise * 10) & 1) as 0 | 1];
    return null;
  }

  if (biome.id === 'dune-pyramid') {
    if (treeNoise > 0.975) return 'reed';
    if (beaconNoise > 0.994) return 'lantern';
    return null;
  }

  if (biome.id === 'frost-citadel') {
    if (treeNoise > 0.965) return 'ice';
    if (flowerNoise > 0.94) return 'leaf';
    return null;
  }

  if (treeNoise > 0.965) return 'basalt';
  if (beaconNoise > 0.993) return 'lantern';
  if (flowerNoise > 0.93) return 'flower';
  return null;
}

function getDecorationBlockAt(
  structureBlocks: Map<string, StructureCell>,
  x: number,
  y: number,
  z: number,
  biome: BiomeDefinition,
  terrainHeight: number
): BlockId | null {
  if (y <= terrainHeight || y > terrainHeight + DECORATION_SCAN_HEIGHT) {
    return null;
  }

  const decorationType = selectDecorationType(biome, x, z);
  if (!decorationType) {
    return null;
  }

  const baseY = terrainHeight + 1;
  const key = keyFor(x, y, z);
  if (structureBlocks.has(key)) {
    return null;
  }

  if (decorationType === 'timber') {
    const trunkHeight = 3 + Math.floor(hash2(x, z, biome.seed + 751) * 3);
    if (y >= baseY && y < baseY + trunkHeight) {
      return 'timber';
    }
  }

  if (y >= baseY + 2 && y <= baseY + 7) {
    for (let ax = x - 2; ax <= x + 2; ax += 1) {
      for (let az = z - 2; az <= z + 2; az += 1) {
        if (selectDecorationType(biome, ax, az) !== 'timber') continue;

        const anchorTerrain = getTerrainHeight(ax, az, biome);
        const anchorTrunk = 3 + Math.floor(hash2(ax, az, biome.seed + 751) * 3);
        const canopyBase = anchorTerrain + anchorTrunk;

        if (y < canopyBase - 1 || y > canopyBase + 1) continue;

        const radius = y === canopyBase + 1 ? 1.2 : 1.8;
        if (Math.hypot(x - ax, z - az) <= radius) {
          return 'leaf';
        }
      }
    }
  }

  if (decorationType === 'reed') {
    const reedHeight = 2 + Math.floor(hash2(x, z, biome.seed + 829) * 3);
    if (y >= baseY && y < baseY + reedHeight) {
      return 'reed';
    }
    return null;
  }

  if (decorationType === 'ice') {
    const spikeHeight = 3 + Math.floor(hash2(x, z, biome.seed + 977) * 4);
    if (y >= baseY && y < baseY + spikeHeight) {
      return 'ice';
    }
    return null;
  }

  if (decorationType === 'basalt') {
    const spikeHeight = 2 + Math.floor(hash2(x, z, biome.seed + 1057) * 4);
    if (y >= baseY && y < baseY + spikeHeight) {
      return y === baseY + spikeHeight - 1 ? 'obsidian' : 'basalt';
    }
    return null;
  }

  if (decorationType === 'lantern') {
    return y === baseY + 1 ? 'lantern' : null;
  }

  if (decorationType === 'leaf') {
    return y === baseY ? 'leaf' : null;
  }

  return y === baseY ? decorationType : null;
}

function terrainBlockAt(x: number, y: number, z: number, biome: BiomeDefinition, terrainHeight: number): BlockId | null {
  if (y === 0) return 'bedrock';

  if (y > terrainHeight) {
    if (biome.waterLevel > 0 && y <= biome.waterLevel) {
      if (biome.id === 'frost-citadel' && y === biome.waterLevel) {
        return 'ice';
      }
      return 'water';
    }
    return null;
  }

  if (y === terrainHeight) {
    return biome.topBlock as BlockId;
  }

  if (y >= terrainHeight - 2) {
    return biome.fillerBlock as BlockId;
  }

  const oreNoise = hash3(x, y, z, biome.seed + 301);
  if (biome.id === 'ember-terrace' && oreNoise > 0.83) {
    return 'obsidian';
  }

  return biome.deepBlock as BlockId;
}

function mapSourceToLayer(source: BlockSource): DebugLayer {
  if (source === 'edit') return 'terrain';
  return source;
}

function isLayerMatch(source: BlockSource, layers: Set<DebugLayer>): boolean {
  return layers.has(mapSourceToLayer(source));
}

export function createWorldState(): WorldState {
  const { structureBlocks, structureColumnMaxY, portalArrival } = buildStructures(getTerrainHeight);
  const worldEditsAdded = new Map<string, BlockId>();
  const worldEditsRemoved = new Set<string>();

  const getBlockSampleAt = (x: number, y: number, z: number): BlockSample | null => {
    if (y < WORLD_MIN_Y || y > WORLD_MAX_Y) return null;

    const cellKey = keyFor(x, y, z);

    if (worldEditsAdded.has(cellKey)) {
      const type = worldEditsAdded.get(cellKey) as BlockId;
      return {
        type,
        source: DEBUG_SPECIAL_BLOCKS.has(type) ? 'special' : 'edit',
        portalTo: null
      };
    }

    if (worldEditsRemoved.has(cellKey)) {
      return null;
    }

    const structure = structureBlocks.get(cellKey);
    if (structure) {
      const structureType = structure.type as BlockId;
      return {
        type: structureType,
        source: structure.portalTo ? 'portal' : DEBUG_SPECIAL_BLOCKS.has(structureType) ? 'special' : 'monument',
        portalTo: structure.portalTo
      };
    }

    const biome = getBiomeAt(x, z);
    const terrainHeight = getTerrainHeight(x, z, biome);

    const decoration = getDecorationBlockAt(structureBlocks, x, y, z, biome, terrainHeight);
    if (decoration) {
      return {
        type: decoration,
        source: decoration === 'lantern' ? 'special' : 'flora',
        portalTo: null
      };
    }

    const terrainBlock = terrainBlockAt(x, y, z, biome, terrainHeight);
    if (!terrainBlock) {
      return null;
    }

    return {
      type: terrainBlock,
      source: 'terrain',
      portalTo: null
    };
  };

  const getBlockAt = (x: number, y: number, z: number): BlockId | null => getBlockSampleAt(x, y, z)?.type ?? null;

  const isSolidForCollision = (type: string | null): boolean => {
    if (!type) return false;
    return Boolean(BLOCKS[type]?.solid);
  };

  const isOpaqueBlock = (type: string | null): boolean => {
    if (!type) return false;
    const def = BLOCKS[type];
    return Boolean(def?.solid && !def.transparent);
  };

  const shouldRenderBlock = (x: number, y: number, z: number, type: BlockId): boolean => {
    const def = BLOCKS[type];
    if (!def) return false;

    const checks = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ] as const;

    for (const [dx, dy, dz] of checks) {
      const neighbor = getBlockAt(x + dx, y + dy, z + dz);
      if (!neighbor) return true;

      if (def.transparent) {
        if (neighbor !== type) return true;
      } else if (!isOpaqueBlock(neighbor)) {
        return true;
      }
    }

    return false;
  };

  const getColumnRenderMaxY = (x: number, z: number): number => {
    const biome = getBiomeAt(x, z);
    const terrainTop = getTerrainHeight(x, z, biome);
    const structureTop = structureColumnMaxY.get(columnKeyFor(x, z)) ?? -1;
    return Math.max(terrainTop + DECORATION_SCAN_HEIGHT, biome.waterLevel + 1, structureTop + 1);
  };

  const findSpawnPosition = (biomeId: string): PortalArrival => {
    const biome = BIOME_BY_ID.get(biomeId) ?? BIOMES[0];
    const spawnX = biome.center.x + 2;
    const spawnZ = biome.center.z + 2;
    const spawnY = getTerrainHeight(spawnX, spawnZ, biome) + 2.1;

    return {
      x: spawnX + 0.5,
      y: spawnY,
      z: spawnZ + 0.5
    };
  };

  const getPortalArrival = (biomeId: string): PortalArrival => portalArrival.get(biomeId) ?? findSpawnPosition(biomeId);

  const getMonumentDistances = (x: number, z: number): MonumentDistance[] =>
    BIOMES.map((biome) => {
      const dx = x - (biome.center.x + 0.5);
      const dz = z - (biome.center.z + 0.5);
      return {
        name: biome.monumentName,
        biomeName: biome.name,
        distance: Math.round(Math.hypot(dx, dz))
      };
    }).sort((a, b) => a.distance - b.distance);

  const removeBlock = (x: number, y: number, z: number): void => {
    const blockKey = keyFor(x, y, z);
    if (worldEditsAdded.has(blockKey)) {
      worldEditsAdded.delete(blockKey);
      return;
    }
    worldEditsRemoved.add(blockKey);
  };

  const setBlock = (x: number, y: number, z: number, type: BlockId): void => {
    const blockKey = keyFor(x, y, z);
    if (worldEditsRemoved.has(blockKey)) {
      worldEditsRemoved.delete(blockKey);
    }
    worldEditsAdded.set(blockKey, type);
  };

  const getTopBlockForLayers = (
    x: number,
    z: number,
    layers: Set<DebugLayer>
  ): { y: number; sample: BlockSample } | null => {
    const maxY = Math.min(WORLD_MAX_Y, getColumnRenderMaxY(x, z));
    for (let y = maxY; y >= WORLD_MIN_Y; y -= 1) {
      const sample = getBlockSampleAt(x, y, z);
      if (!sample) continue;
      if (!isLayerMatch(sample.source, layers)) continue;
      return { y, sample };
    }
    return null;
  };

  return {
    structureBlocks,
    structureColumnMaxY,
    portalArrival,
    getBiomeAt,
    getTerrainHeight,
    getBlockAt,
    getBlockSampleAt,
    getTopBlockForLayers,
    getColumnRenderMaxY,
    getPortalTargetAt: (x: number, y: number, z: number) => structureBlocks.get(keyFor(x, y, z))?.portalTo ?? null,
    isProtectedBlock: (x: number, y: number, z: number) => Boolean(structureBlocks.get(keyFor(x, y, z))?.protectedBlock),
    isSolidForCollision,
    isOpaqueBlock,
    shouldRenderBlock,
    findSpawnPosition,
    getPortalArrival,
    getMonumentDistances,
    removeBlock,
    setBlock
  };
}
