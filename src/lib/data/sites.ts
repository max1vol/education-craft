import manifestData from './sites-manifest.json';
import factData from './site-facts.json';
import constructionData from './site-construction.json';
import siteVisualData from './site-visuals.json';
import termVisualData from './material-tool-visuals.json';

export type SiteManifestEntry = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  count: number;
  hero: string | null;
};

export type SiteFact = {
  slug: string;
  startYear: number;
  peakYear: number;
  endYear: number;
  rediscoveryYear: number;
  culture: string;
  idea: string;
  originStory: string;
};

export type ConstructionSource = {
  title: string;
  url: string;
  type: string;
};

export type SiteConstruction = {
  slug: string;
  siteName: string;
  wikipediaTitle: string;
  wikidataId: string | null;
  materials: string[];
  constructionMethods: string[];
  constructionTools: string[];
  toolsInferred: boolean;
  sources: ConstructionSource[];
  notes: string;
  searchSnippet: string;
  lastUpdated: string;
};

export type VisualMedia = {
  title: string;
  imageUrl: string;
  sourceUrl: string | null;
  sourceName: string;
  author?: string;
  license: string;
  description?: string;
};

export type SiteVisualPack = {
  slug: string;
  siteName: string;
  pageUrl: string;
  officialPhotos: VisualMedia[];
  officialIllustrations: VisualMedia[];
  createdIllustrations: VisualMedia[];
  updated: string;
};

export type TermVisual = {
  id: string;
  label: string;
  official: VisualMedia | null;
  created: VisualMedia;
};

export type TimelineEvent = {
  year: number;
  title: string;
  text: string;
};

export type SiteSummary = SiteManifestEntry & {
  startYear: number;
  peakYear: number;
  endYear: number;
  rediscoveryYear: number;
  culture: string;
  idea: string;
  originStory: string;
  epoch: string;
  yearRange: string;
};

type TurningPoint = { year: number; title: string; text: string };

const manifest = manifestData as SiteManifestEntry[];
const facts = factData as SiteFact[];
const constructions = constructionData as SiteConstruction[];
const siteVisuals = siteVisualData as SiteVisualPack[];
const termVisuals = termVisualData as {
  materials: TermVisual[];
  tools: TermVisual[];
  aliases: {
    materials: Record<string, string>;
    tools: Record<string, string>;
  };
  updated: string;
};
const factBySlug = new Map(facts.map((item) => [item.slug, item]));
const constructionBySlug = new Map(constructions.map((item) => [item.slug, item]));
const visualBySlug = new Map(siteVisuals.map((item) => [item.slug, item]));
const materialVisualById = new Map(termVisuals.materials.map((item) => [item.id, item]));
const toolVisualById = new Map(termVisuals.tools.map((item) => [item.id, item]));

const turningPoints: Record<string, TurningPoint> = {
  'pompeii': { year: 79, title: 'Vesuvius Eruption', text: 'Mount Vesuvius erupted and buried the city.' },
  'parthenon': { year: 1687, title: 'Parthenon Explosion', text: 'An ammunition blast caused major structural damage.' },
  'roman-colosseum': { year: 523, title: 'Gladiatorial Era Ends', text: 'Major arena spectacles declined in Late Antiquity.' },
  'hadrians-wall': { year: 122, title: "Hadrian's Frontier Plan", text: 'Construction began under Emperor Hadrian.' },
  'petra': { year: 1812, title: 'European Rediscovery', text: 'Johann Ludwig Burckhardt brought Petra to wider attention.' },
  'machu-picchu': { year: 1911, title: 'Global Attention', text: 'Hiram Bingham publicized Machu Picchu internationally.' },
  'terracotta-army-mausoleum': { year: 1974, title: 'Terracotta Army Found', text: 'Local farmers uncovered the first pits.' },
  'stonehenge': { year: -2500, title: 'Main Stone Phase', text: 'Large sarsen stones were raised in the famous circle.' },
  'angkor-wat': { year: 1150, title: 'Temple-City Peak', text: 'Angkor Wat became a major Khmer religious center.' },
  'chichen-itza': { year: 900, title: 'Regional Peak', text: 'The city rose as a major Maya political and ritual center.' },
  'cahokia-mounds': { year: 1100, title: 'Monks Mound Era', text: 'Cahokia reached large urban scale with major mound building.' },
  'great-pyramid-of-giza': { year: -2560, title: 'Great Pyramid Completed', text: 'The pyramid became the tallest human-made structure of its age.' }
};

function epochFromYear(year: number): string {
  if (year <= -1200) return 'Early Civilizations';
  if (year <= -500) return 'Bronze & Iron Age';
  if (year <= 500) return 'Classical Antiquity';
  if (year <= 1000) return 'Early Medieval';
  if (year <= 1400) return 'High Medieval';
  return 'Late Medieval & Early Modern';
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year === 0) return '0 CE';
  return `${year} CE`;
}

function rangeLabel(startYear: number, endYear: number): string {
  return `${formatYear(startYear)} to ${formatYear(endYear)}`;
}

export function getSiteSummary(slug: string): SiteSummary | null {
  const base = manifest.find((item) => item.slug === slug);
  const fact = factBySlug.get(slug);
  if (!base || !fact) return null;
  const epoch = epochFromYear(fact.startYear);
  return {
    ...base,
    ...fact,
    epoch,
    yearRange: rangeLabel(fact.startYear, fact.endYear)
  };
}

export function getSiteConstruction(slug: string): SiteConstruction | null {
  return constructionBySlug.get(slug) ?? null;
}

export function getSiteVisualPack(slug: string): SiteVisualPack | null {
  return visualBySlug.get(slug) ?? null;
}

export function getMaterialVisualByTerm(term: string): TermVisual | null {
  const key = term.trim().toLowerCase();
  const id = termVisuals.aliases.materials[key];
  if (!id) return null;
  return materialVisualById.get(id) ?? null;
}

export function getToolVisualByTerm(term: string): TermVisual | null {
  const key = term.trim().toLowerCase();
  const id = termVisuals.aliases.tools[key];
  if (!id) return null;
  return toolVisualById.get(id) ?? null;
}

export function getSiteMaterialAndToolVisuals(slug: string): { materials: TermVisual[]; tools: TermVisual[] } {
  const construction = getSiteConstruction(slug);
  if (!construction) {
    return { materials: [], tools: [] };
  }

  const materialIds = new Set(
    construction.materials
      .map((term) => termVisuals.aliases.materials[term.trim().toLowerCase()])
      .filter((item): item is string => Boolean(item))
  );

  const toolIds = new Set(
    construction.constructionTools
      .map((term) => termVisuals.aliases.tools[term.trim().toLowerCase()])
      .filter((item): item is string => Boolean(item))
  );

  const materials = [...materialIds]
    .map((id) => materialVisualById.get(id))
    .filter((item): item is TermVisual => item !== undefined)
    .sort((a, b) => a.label.localeCompare(b.label));

  const tools = [...toolIds]
    .map((id) => toolVisualById.get(id))
    .filter((item): item is TermVisual => item !== undefined)
    .sort((a, b) => a.label.localeCompare(b.label));

  return { materials, tools };
}

export function getAllSites(): SiteSummary[] {
  return manifest
    .map((entry) => getSiteSummary(entry.slug))
    .filter((entry): entry is SiteSummary => entry !== null)
    .sort((a, b) => a.startYear - b.startYear || a.name.localeCompare(b.name));
}

export function getTimelineEvents(site: SiteSummary): TimelineEvent[] {
  const turningPoint = turningPoints[site.slug];
  const middleEvent: TimelineEvent = turningPoint
    ? {
        year: turningPoint.year,
        title: turningPoint.title,
        text: turningPoint.text
      }
    : {
        year: site.peakYear,
        title: 'Peak Era',
        text: `${site.name} reached an important growth phase in this period.`
      };

  return [
    {
      year: site.startYear,
      title: 'Origins',
      text: site.originStory
    },
    middleEvent,
    {
      year: site.endYear,
      title: 'Transition',
      text: 'Political change, environmental pressures, or shifting trade routes transformed how the site was used.'
    },
    {
      year: site.rediscoveryYear,
      title: 'Archaeology & Conservation',
      text: 'Modern excavation and conservation brought the site into classrooms, museums, and heritage studies.'
    }
  ].sort((a, b) => a.year - b.year);
}

export type TimelineGroup = {
  epoch: string;
  startYear: number;
  endYear: number;
  sites: SiteSummary[];
};

export function getTimelineGroups(): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();
  for (const site of getAllSites()) {
    const existing = groups.get(site.epoch);
    if (!existing) {
      groups.set(site.epoch, {
        epoch: site.epoch,
        startYear: site.startYear,
        endYear: site.endYear,
        sites: [site]
      });
      continue;
    }
    existing.sites.push(site);
    existing.startYear = Math.min(existing.startYear, site.startYear);
    existing.endYear = Math.max(existing.endYear, site.endYear);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      sites: group.sites.sort((a, b) => a.startYear - b.startYear || a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.startYear - b.startYear);
}

export const stats = {
  totalSites: manifest.length,
  totalImages: manifest.reduce((sum, site) => sum + site.count, 0)
};
