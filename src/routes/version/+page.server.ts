import { VERSION_SNAPSHOT, type VersionSnapshot } from '$lib/data/version-snapshot';
import type { PageServerLoad } from './$types';

interface VersionEntry {
  hash: string;
  shortHash: string;
  date: string;
  timestamp: string;
  unixTime: number;
  title: string;
}

const normalizeEntry = (entry: Partial<VersionEntry> | null | undefined): VersionEntry | null => {
  if (!entry?.hash || !entry.shortHash || !entry.title) return null;

  const timestamp = entry.timestamp ?? (entry.date ? `${entry.date}T00:00:00.000Z` : new Date(0).toISOString());
  const unixFromTimestamp = Math.round(Number.isFinite(Date.parse(timestamp)) ? Date.parse(timestamp) / 1000 : 0);

  return {
    hash: entry.hash,
    shortHash: entry.shortHash,
    date: entry.date ?? timestamp.slice(0, 10),
    timestamp,
    unixTime: typeof entry.unixTime === 'number' && Number.isFinite(entry.unixTime) ? entry.unixTime : unixFromTimestamp,
    title: entry.title
  };
};

const normalizeSnapshot = (snapshot: VersionSnapshot): VersionSnapshot => {
  const latest = normalizeEntry(snapshot.latest as Partial<VersionEntry> | null);
  const history = (snapshot.history as Array<Partial<VersionEntry>>)
    .map((entry) => normalizeEntry(entry))
    .filter((entry): entry is VersionEntry => Boolean(entry));

  return {
    ...snapshot,
    latest,
    history
  };
};

export const load: PageServerLoad = () => ({
  version: normalizeSnapshot(VERSION_SNAPSHOT)
});
