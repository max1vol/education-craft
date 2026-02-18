import type { PageLoad } from './$types';

const LAYERS = ['terrain', 'flora', 'monument', 'portal', 'special'] as const;
type LayerId = (typeof LAYERS)[number];

function parseNumber(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function parseLayers(raw: string | null): LayerId[] {
  if (!raw) return [...LAYERS];
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is LayerId => (LAYERS as readonly string[]).includes(entry));
  if (!parsed.length) return [...LAYERS];
  return parsed;
}

export const load: PageLoad = ({ url }) => {
  const biome = url.searchParams.get('biome') ?? 'ring-plains';
  const radius = parseNumber(url.searchParams.get('radius'), 56, 20, 128);
  const sliceZOffset = parseNumber(url.searchParams.get('slice'), 0, -128, 128);
  const layers = parseLayers(url.searchParams.get('layers'));

  return {
    biome,
    radius,
    sliceZOffset,
    layers
  };
};
