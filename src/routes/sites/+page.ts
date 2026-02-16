import { getTimelineGroups, stats } from '$lib/data/sites';

export function load() {
  return {
    groups: getTimelineGroups(),
    stats
  };
}
