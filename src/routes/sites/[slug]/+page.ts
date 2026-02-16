import { error } from '@sveltejs/kit';
import { getSiteSummary, getTimelineEvents } from '$lib/data/sites';

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
  return {
    site,
    images,
    events: getTimelineEvents(site)
  };
}
