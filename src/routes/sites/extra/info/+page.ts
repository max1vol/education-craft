import { getAllSites, getSiteConstruction } from '$lib/data/sites';
import { siteFeatureIdeas } from '$lib/data/site-feature-ideas';

type CountEntry = { name: string; count: number };

function topCounts(values: string[], limit: number): CountEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function load() {
  const sites = getAllSites().map((site) => {
    const construction = getSiteConstruction(site.slug);
    return {
      slug: site.slug,
      name: site.name,
      region: site.region,
      epoch: site.epoch,
      yearRange: site.yearRange,
      imageCount: site.count,
      materials: construction?.materials ?? [],
      methods: construction?.constructionMethods ?? [],
      tools: construction?.constructionTools ?? [],
      sources: construction?.sources ?? [],
      updated: construction?.lastUpdated ?? null
    };
  });

  const allMaterials = sites.flatMap((site) => site.materials);
  const allTools = sites.flatMap((site) => site.tools);
  const sourceTypes = sites.flatMap((site) => site.sources.map((source) => source.type));

  const topMaterials = topCounts(allMaterials, 20);
  const topTools = topCounts(allTools, 20);
  const topSourceTypes = topCounts(sourceTypes, 8);

  const stats = {
    siteCount: sites.length,
    totalImageCount: sites.reduce((sum, site) => sum + site.imageCount, 0),
    totalMaterialMentions: allMaterials.length,
    totalToolMentions: allTools.length,
    totalSourceLinks: sites.reduce((sum, site) => sum + site.sources.length, 0),
    sitesWithConstruction: sites.filter((site) => site.materials.length || site.tools.length || site.methods.length).length
  };

  return {
    stats,
    sites,
    topMaterials,
    topTools,
    topSourceTypes,
    siteFeatureIdeas
  };
}
