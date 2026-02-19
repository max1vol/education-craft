import { BIOMES, type BiomeDefinition } from '$lib/data/monument-realms/biomes';
import { WORLD_MAX_Y, WORLD_MIN_Y } from '$lib/data/monument-realms/world';
import { columnKeyFor, keyFor } from './keys';
import type { PortalArrival, StructureCell } from './types';

interface BuildContext {
  structureBlocks: Map<string, StructureCell>;
  structureColumnMaxY: Map<string, number>;
  portalArrival: Map<string, PortalArrival>;
}

const TECHNICAL_PROTECTED_BLOCKS = new Set<string>(['portal_core']);

function setStructureBlock(
  context: BuildContext,
  x: number,
  y: number,
  z: number,
  type: string,
  { portalTo = null }: { portalTo?: string | null } = {}
): void {
  if (y < WORLD_MIN_Y || y > WORLD_MAX_Y) return;

  context.structureBlocks.set(keyFor(x, y, z), {
    type,
    protectedBlock: TECHNICAL_PROTECTED_BLOCKS.has(type),
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
        setStructureBlock(context, x, y, z, type);
      }
    }
  }
}

function flattenEllipse(
  context: BuildContext,
  cx: number,
  cz: number,
  rx: number,
  rz: number,
  levelY: number,
  topType: string,
  fillType = topType
): void {
  for (let x = cx - rx; x <= cx + rx; x += 1) {
    for (let z = cz - rz; z <= cz + rz; z += 1) {
      const nx = (x - cx) / rx;
      const nz = (z - cz) / rz;
      if (nx * nx + nz * nz > 1.08) continue;

      for (let y = levelY - 2; y <= levelY; y += 1) {
        setStructureBlock(context, x, y, z, y === levelY ? topType : fillType);
      }
    }
  }
}

function carvePath(
  context: BuildContext,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  width: number,
  topBlock: string,
  fillBlock: string,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
  const dx = endX - startX;
  const dz = endZ - startZ;
  const steps = Math.max(4, Math.round(Math.hypot(dx, dz) * 2));

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const px = Math.round(startX + dx * t);
    const pz = Math.round(startZ + dz * t);
    const py = getTerrainHeight(px, pz, biome) + 1;

    for (let ox = -width; ox <= width; ox += 1) {
      for (let oz = -width; oz <= width; oz += 1) {
        if (Math.hypot(ox, oz) > width + 0.2) continue;
        const x = px + ox;
        const z = pz + oz;
        setStructureBlock(context, x, py - 1, z, fillBlock);
        setStructureBlock(context, x, py, z, topBlock);
      }
    }
  }
}

function buildStonehenge(
  context: BuildContext,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenPad(context, cx, cz, 15, baseY, 'grass', 'dirt');

  const ringPoints = 14;
  for (let i = 0; i < ringPoints; i += 1) {
    const angle = (Math.PI * 2 * i) / ringPoints;
    const x = Math.round(cx + Math.cos(angle) * 8);
    const z = Math.round(cz + Math.sin(angle) * 8);
    const height = i % 3 === 0 ? 5 : 4;

    for (let y = baseY + 1; y <= baseY + height; y += 1) {
      setStructureBlock(context, x, y, z, 'stone');
    }
  }

  for (let i = 0; i < ringPoints; i += 2) {
    const a0 = (Math.PI * 2 * i) / ringPoints;
    const a1 = (Math.PI * 2 * (i + 1)) / ringPoints;
    const x0 = Math.round(cx + Math.cos(a0) * 8);
    const z0 = Math.round(cz + Math.sin(a0) * 8);
    const x1 = Math.round(cx + Math.cos(a1) * 8);
    const z1 = Math.round(cz + Math.sin(a1) * 8);

    const lintelSteps = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0)));
    for (let step = 0; step <= lintelSteps; step += 1) {
      const t = step / lintelSteps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const z = Math.round(z0 + (z1 - z0) * t);
      setStructureBlock(context, x, baseY + 5, z, 'stone');
    }
  }

  for (let x = cx - 1; x <= cx + 1; x += 1) {
    for (let z = cz - 2; z <= cz + 2; z += 1) {
      setStructureBlock(context, x, baseY + 1, z, 'sandstone');
    }
  }
}

function buildColosseum(
  context: BuildContext,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenEllipse(context, cx, cz, 22, 16, baseY, 'stone', 'dirt');

  for (let y = baseY + 1; y <= baseY + 8; y += 1) {
    for (let x = cx - 17; x <= cx + 17; x += 1) {
      for (let z = cz - 12; z <= cz + 12; z += 1) {
        const outer = (x - cx) * (x - cx) / (17 * 17) + (z - cz) * (z - cz) / (12 * 12);
        const inner = (x - cx) * (x - cx) / (12 * 12) + (z - cz) * (z - cz) / (7 * 7);
        if (outer > 1.03 || inner < 0.95) continue;

        const isGate =
          y <= baseY + 3 &&
          ((Math.abs(x - cx) < 2 && (Math.abs(z - cz) > 10 || Math.abs(z - cz) < 2)) ||
            (Math.abs(z - cz) < 2 && Math.abs(x - cx) > 13));

        if (isGate) continue;

        const topTier = y >= baseY + 6;
        setStructureBlock(context, x, y, z, topTier ? 'marble' : 'sandstone');
      }
    }
  }

  for (let x = cx - 10; x <= cx + 10; x += 1) {
    for (let z = cz - 6; z <= cz + 6; z += 1) {
      const bowl = (x - cx) * (x - cx) / (10 * 10) + (z - cz) * (z - cz) / (6 * 6);
      if (bowl > 1) continue;
      setStructureBlock(context, x, baseY + 1, z, 'sand');
    }
  }
}

function buildRomanAqueduct(
  context: BuildContext,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  for (let x = cx - 28; x <= cx + 28; x += 1) {
    for (let z = cz - 5; z <= cz + 5; z += 1) {
      setStructureBlock(context, x, baseY - 1, z, 'sandstone');
      setStructureBlock(context, x, baseY, z, 'sand');
    }
  }

  for (let segment = -24; segment <= 24; segment += 5) {
    const px = cx + segment;
    for (let y = baseY + 1; y <= baseY + 6; y += 1) {
      setStructureBlock(context, px, y, cz - 3, 'sandstone');
      setStructureBlock(context, px, y, cz + 3, 'sandstone');
    }

    for (let z = cz - 3; z <= cz + 3; z += 1) {
      setStructureBlock(context, px, baseY + 7, z, 'stone');
    }

    for (let z = cz - 2; z <= cz + 2; z += 1) {
      setStructureBlock(context, px, baseY + 6, z, 'marble');
    }
  }

  for (let x = cx - 24; x <= cx + 24; x += 1) {
    setStructureBlock(context, x, baseY + 8, cz - 2, 'stone');
    setStructureBlock(context, x, baseY + 8, cz + 2, 'stone');
    setStructureBlock(context, x, baseY + 8, cz - 1, 'aqueduct_water');
    setStructureBlock(context, x, baseY + 8, cz, 'aqueduct_water');
    setStructureBlock(context, x, baseY + 8, cz + 1, 'aqueduct_water');
  }

  carvePath(context, cx - 30, cz + 8, cx + 30, cz + 8, 1, 'sandstone', 'sand', biome, getTerrainHeight);
}

function buildSkaraBrae(
  context: BuildContext,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
  const cx = biome.center.x;
  const cz = biome.center.z;
  const baseY = getTerrainHeight(cx, cz, biome) + 1;

  flattenPad(context, cx, cz, 16, baseY, 'skara_earth', 'skara_earth');

  const hutCenters = [
    { x: -6, z: -3 },
    { x: 0, z: -6 },
    { x: 7, z: -2 },
    { x: -7, z: 4 },
    { x: 1, z: 5 },
    { x: 8, z: 6 }
  ];

  for (const hut of hutCenters) {
    const hx = cx + hut.x;
    const hz = cz + hut.z;
    const hy = getTerrainHeight(hx, hz, biome) + 1;

    flattenPad(context, hx, hz, 3, hy - 1, 'skara_hearth', 'skara_stone');

    for (let x = hx - 3; x <= hx + 3; x += 1) {
      for (let z = hz - 3; z <= hz + 3; z += 1) {
        const dist = Math.hypot(x - hx, z - hz);
        const doorway = z === hz - 3 && Math.abs(x - hx) <= 1;
        if (doorway) continue;

        if (dist >= 2.1 && dist <= 3.05) {
          setStructureBlock(context, x, hy, z, 'skara_stone');
          setStructureBlock(context, x, hy + 1, z, 'skara_stone');
        }
      }
    }

    setStructureBlock(context, hx, hy, hz, 'skara_hearth');
  }

  for (let i = 0; i < hutCenters.length; i += 1) {
    const hut = hutCenters[i];
    carvePath(
      context,
      cx + hut.x,
      cz + hut.z,
      cx,
      cz,
      1,
      'skara_earth',
      'skara_stone',
      biome,
      getTerrainHeight
    );
  }
}

function buildMonument(
  context: BuildContext,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
  if (biome.id === 'stonehenge-salisbury') {
    buildStonehenge(context, biome, getTerrainHeight);
    return;
  }

  if (biome.id === 'colosseum-rome') {
    buildColosseum(context, biome, getTerrainHeight);
    return;
  }

  if (biome.id === 'roman-aqueduct') {
    buildRomanAqueduct(context, biome, getTerrainHeight);
    return;
  }

  buildSkaraBrae(context, biome, getTerrainHeight);
}

function buildPortal(
  context: BuildContext,
  biome: BiomeDefinition,
  getTerrainHeight: (x: number, z: number, biome: BiomeDefinition) => number
): void {
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
    setStructureBlock(context, x, y, z, 'obsidian');
  }

  for (let iy = 1; iy <= 3; iy += 1) {
    setStructureBlock(context, px, baseY + 1 + iy, pz, 'portal_core', {
      portalTo: biome.portalTo
    });
  }

  carvePath(
    context,
    px,
    pz,
    biome.center.x,
    biome.center.z,
    1,
    biome.fillerBlock,
    biome.fillerBlock,
    biome,
    getTerrainHeight
  );

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
    buildMonument(context, biome, getTerrainHeight);
    buildPortal(context, biome, getTerrainHeight);
  }

  return context;
}
