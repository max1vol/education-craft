import { execSync } from 'node:child_process';
import { VERSION_SNAPSHOT, type VersionSnapshot } from '$lib/data/version-snapshot';
import type { PageServerLoad } from './$types';

const run = (command: string): string =>
  execSync(command, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();

const getVersionFromRepo = (): VersionSnapshot => {
  const packageVersion = VERSION_SNAPSHOT.packageVersion;
  const commitHash = run('git rev-parse HEAD');
  const commitShort = run('git rev-parse --short HEAD');
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const describe = run('git describe --always --tags --dirty');

  const logRaw = run('git log --date=short --pretty=format:%H%x1f%h%x1f%ad%x1f%s -n 20');
  const entries = logRaw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, shortHash, date, title] = line.split('\x1f');
      return { hash, shortHash, date, title };
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
      version: getVersionFromRepo()
    };
  } catch {
    return {
      version: VERSION_SNAPSHOT
    };
  }
};
