import { execSync } from 'node:child_process';
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

const run = (command: string): string =>
  execSync(command, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();

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

const getVersionFromRepo = (): VersionSnapshot => {
  const packageVersion = VERSION_SNAPSHOT.packageVersion;
  const commitHash = run('git rev-parse HEAD');
  const commitShort = run('git rev-parse --short HEAD');
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const describe = run('git describe --always --tags --dirty');

  const logRaw = run('git log --date=iso-strict --pretty=format:%H%x1f%h%x1f%cI%x1f%ct%x1f%s -n 20');
  const entries = logRaw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, shortHash, timestamp, unixRaw, title] = line.split('\x1f');
      const unixTime = Number.parseInt(unixRaw, 10);
      return {
        hash,
        shortHash,
        date: timestamp.slice(0, 10),
        timestamp,
        unixTime: Number.isNaN(unixTime) ? 0 : unixTime,
        title
      } satisfies VersionEntry;
    });

  const [latest = null, ...history] = entries;

  return {
    generatedAt: new Date().toISOString(),
    packageVersion,
    commitHash,
    commitShort,
    branch,
    describe,
    label: `v${packageVersion} (${describe})`,
    latest,
    history
  };
};

export const load: PageServerLoad = () => {
  try {
    return {
      version: normalizeSnapshot(getVersionFromRepo())
    };
  } catch {
    return {
      version: normalizeSnapshot(VERSION_SNAPSHOT)
    };
  }
};
