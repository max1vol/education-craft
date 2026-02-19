import { getTimelineGroups, stats } from '$lib/data/sites';
import { siteFeatureIdeas } from '$lib/data/site-feature-ideas';

export function load() {
  return {
    groups: getTimelineGroups(),
    stats,
    siteFeatureIdeas
  };
}
