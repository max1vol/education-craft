import { BIOMES, type BiomeDefinition } from '$lib/data/monument-realms/biomes';
import { WORLD_MAX_Y } from '$lib/data/monument-realms/world';
import { fbm } from './noise';

export function getBiomeAt(x: number, z: number): BiomeDefinition {
  let nearest = BIOMES[0];
  let nearestDist = Number.POSITIVE_INFINITY;

  for (const biome of BIOMES) {
    const dx = x - biome.center.x;
    const dz = z - biome.center.z;
    const dist = dx * dx + dz * dz;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = biome;
    }
  }

  return nearest;
}

export function getTerrainHeight(x: number, z: number, biome = getBiomeAt(x, z)): number {
  const nx = x * biome.terrain.scale;
  const nz = z * biome.terrain.scale;

  const broad = fbm(nx * 0.8, nz * 0.8, biome.seed);
  const local = fbm(nx * 2.2, nz * 2.2, biome.seed + 31);
  const ridge = Math.abs(fbm(nx * 3.1, nz * 3.1, biome.seed + 71) - 0.5) * 2;

  const centerDist = Math.hypot(x - biome.center.x, z - biome.center.z);
  const centerLift = Math.max(0, 1 - centerDist / 82) * biome.terrain.centerLift;

  const height =
    biome.terrain.base +
    broad * biome.terrain.amplitude +
    local * biome.terrain.detailAmp +
    ridge * biome.terrain.ridgeAmp +
    centerLift;

  return Math.max(3, Math.min(WORLD_MAX_Y - 4, Math.floor(height)));
}
