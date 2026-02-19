import { error } from '@sveltejs/kit';
import {
  getSiteConstruction,
  getSiteMaterialAndToolVisuals,
  getSiteSummary,
  getSiteVisualPack,
  getTimelineEvents
} from '$lib/data/sites';

export async function load({ params, fetch }) {
  const site = getSiteSummary(params.slug);
  if (!site) {
    throw error(404, 'Site not found');
  }

  const response = await fetch(`/site-media/${site.slug}/captions.json`);
  if (!response.ok) {
    throw error(404, 'Site gallery not found');
  }

  const images = await response.json();
  const construction = getSiteConstruction(site.slug);
  const visualPack = getSiteVisualPack(site.slug);
  const referenceVisuals = getSiteMaterialAndToolVisuals(site.slug);

  return {
    site,
    images,
    events: getTimelineEvents(site),
    construction,
    visualPack,
    referenceVisuals
  };
}
