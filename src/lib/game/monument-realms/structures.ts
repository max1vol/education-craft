import { BIOMES, type BiomeDefinition } from '$lib/data/monument-realms/biomes';
import { WORLD_MAX_Y, WORLD_MIN_Y } from '$lib/data/monument-realms/world';
import { columnKeyFor, keyFor } from './keys';
import type { PortalArrival, StructureCell } from './types';

interface BuildContext {
  structureBlocks: Map<string, StructureCell>;
  structureColumnMaxY: Map<string, number>;
  portalArrival: Map<string, PortalArrival>;
}

function setStructureBlock(
  context: BuildContext,
  x: number,
  y: number,
  z: number,
  type: string,
  { protectedBlock = true, portalTo = null }: { protectedBlock?: boolean; portalTo?: string | null } = {}
): void {
  if (y < WORLD_MIN_Y || y > WORLD_MAX_Y) return;

  context.structureBlocks.set(keyFor(x, y, z), {
    type,
    protectedBlock,
    portalTo
  });

  const columnKey = columnKeyFor(x, z);
  const currentMax = context.structureColumnMaxY.get(columnKey) ?? -1;
  if (y > currentMax) {
    context.structureColumnMaxY.set(columnKey, y);
  }
}

function flattenPad(
  context: BuildContext,
  cx: number,
  cz: number,
  radius: number,
  levelY: number,
  topType: string,
  fillType = topType
): void {
  for (let x = cx - radius; x <= cx + radius; x += 1) {
    for (let z = cz - radius; z <= cz + radius; z += 1) {
      if (Math.hypot(x - cx, z - cz) > radius + 0.3) continue;

      for (let y = levelY - 2; y <= levelY; y += 1) {
        const type = y === levelY ? topType : fillType;
        setStructureBlock(context, x, y, z, type, { protectedBlock: true });
      }
    }
  }
}

function buildRingMonument(context: BuildContext, biome: BiomeDefinition, getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenPad(context, cx, cz, 10, baseY, 'grass', 'dirt');

  const points = 16;
  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points;
    const x = Math.round(cx + Math.cos(angle) * 7);
    const z = Math.round(cz + Math.sin(angle) * 7);
    const height = i % 2 === 0 ? 4 : 3;

    for (let y = baseY + 1; y <= baseY + height; y += 1) {
      setStructureBlock(context, x, y, z, 'marble', { protectedBlock: true });
    }

    if (i % 2 === 0) {
      setStructureBlock(context, x, baseY + height + 1, z, 'marble', { protectedBlock: true });
    }
  }

  for (let x = cx - 1; x <= cx + 1; x += 1) {
    for (let z = cz - 1; z <= cz + 1; z += 1) {
      setStructureBlock(context, x, baseY + 1, z, 'marble', { protectedBlock: true });
    }
  }
}

function buildPyramidMonument(context: BuildContext, biome: BiomeDefinition, getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenPad(context, cx, cz, 12, baseY, 'sand', 'sandstone');

  let size = 13;
  let y = baseY + 1;
  while (size >= 3) {
    const half = Math.floor(size / 2);
    for (let x = cx - half; x <= cx + half; x += 1) {
      for (let z = cz - half; z <= cz + half; z += 1) {
        setStructureBlock(context, x, y, z, size > 5 ? 'sandstone' : 'marble', { protectedBlock: true });
      }
    }
    size -= 2;
    y += 1;
  }

  setStructureBlock(context, cx, y, cz, 'obsidian', { protectedBlock: true });

  for (let step = 0; step < 7; step += 1) {
    setStructureBlock(context, cx, baseY + 1 + step, cz + 8 - step, 'sandstone', { protectedBlock: true });
    setStructureBlock(context, cx, baseY + 1 + step, cz + 7 - step, 'sandstone', { protectedBlock: true });
  }
}

function buildFrostMonument(context: BuildContext, biome: BiomeDefinition, getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenPad(context, cx, cz, 10, baseY, 'frost', 'stone');

  for (let x = cx - 6; x <= cx + 6; x += 1) {
    for (let z = cz - 6; z <= cz + 6; z += 1) {
      const edge = Math.abs(x - cx) === 6 || Math.abs(z - cz) === 6;
      if (!edge) continue;

      for (let y = baseY + 1; y <= baseY + 5; y += 1) {
        if ((x + z + y) % 4 === 0) {
          setStructureBlock(context, x, y, z, 'ice', { protectedBlock: true });
        } else {
          setStructureBlock(context, x, y, z, 'frost', { protectedBlock: true });
        }
      }
    }
  }

  for (let y = baseY + 1; y <= baseY + 7; y += 1) {
    setStructureBlock(context, cx, y, cz, 'ice', { protectedBlock: true });
  }
}

function buildEmberMonument(context: BuildContext, biome: BiomeDefinition, getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenPad(context, cx, cz, 11, baseY, 'basalt', 'obsidian');

  const terraces = [13, 9, 5, 3];
  let y = baseY + 1;

  for (const size of terraces) {
    const half = Math.floor(size / 2);
    for (let layer = 0; layer < 2; layer += 1) {
      for (let x = cx - half; x <= cx + half; x += 1) {
        for (let z = cz - half; z <= cz + half; z += 1) {
          setStructureBlock(context, x, y + layer, z, layer % 2 === 0 ? 'basalt' : 'obsidian', {
            protectedBlock: true
          });
        }
      }
    }
    y += 2;
  }

  for (let step = 0; step < 7; step += 1) {
    setStructureBlock(context, cx, baseY + 1 + step, cz - 8 + step, 'basalt', { protectedBlock: true });
    setStructureBlock(context, cx, baseY + 1 + step, cz - 7 + step, 'basalt', { protectedBlock: true });
  }
}

function buildPortal(context: BuildContext, biome: BiomeDefinition, getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number): void {
  const px = biome.center.x + biome.portalOffset.x;
  const pz = biome.center.z + biome.portalOffset.z;
  const baseY = getTerrainHeight(px, pz, biome) + 1;

  flattenPad(context, px, pz, 3, baseY, biome.topBlock, biome.fillerBlock);

  const axisX = Math.abs(biome.portalOffset.x) > Math.abs(biome.portalOffset.z);

  const frameBlocks = [] as Array<{ ix: number; iy: number }>;
  for (let ix = -1; ix <= 1; ix += 1) {
    for (let iy = 0; iy <= 4; iy += 1) {
      const isFrame = ix === -1 || ix === 1 || iy === 0 || iy === 4;
      if (!isFrame) continue;
      frameBlocks.push({ ix, iy });
    }
  }

  for (const block of frameBlocks) {
    const x = axisX ? px : px + block.ix;
    const z = axisX ? pz + block.ix : pz;
    const y = baseY + 1 + block.iy;
    setStructureBlock(context, x, y, z, 'obsidian', { protectedBlock: true });
  }

  for (let iy = 1; iy <= 3; iy += 1) {
    const x = px;
    const z = pz;
    const y = baseY + 1 + iy;
    setStructureBlock(context, x, y, z, 'portal_core', {
      protectedBlock: true,
      portalTo: biome.portalTo
    });
  }

  const approachOffset = axisX
    ? { x: 0.5, z: biome.portalOffset.z > 0 ? -2.5 : 2.5 }
    : { x: biome.portalOffset.x > 0 ? -2.5 : 2.5, z: 0.5 };

  context.portalArrival.set(biome.id, {
    x: px + approachOffset.x,
    y: baseY + 1.1,
    z: pz + approachOffset.z
  });
}

export function buildStructures(
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): BuildContext {
  const context: BuildContext = {
    structureBlocks: new Map(),
    structureColumnMaxY: new Map(),
    portalArrival: new Map()
  };

  for (const biome of BIOMES) {
    if (biome.id === 'ring-plains') {
      buildRingMonument(context, biome, getTerrainHeight);
    } else if (biome.id === 'dune-pyramid') {
      buildPyramidMonument(context, biome, getTerrainHeight);
    } else if (biome.id === 'frost-citadel') {
      buildFrostMonument(context, biome, getTerrainHeight);
    } else {
      buildEmberMonument(context, biome, getTerrainHeight);
    }

    buildPortal(context, biome, getTerrainHeight);
  }

  return context;
}
