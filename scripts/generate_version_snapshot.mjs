import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const PREVIOUS_COMMIT_COUNT = 10;
const LOG_ENTRY_LIMIT = PREVIOUS_COMMIT_COUNT + 1;

const run = (command) => {
  try {
    return execSync(command, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

const parseLogEntries = (logRaw) =>
  logRaw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash = '', shortHash = '', timestamp = '', unixRaw = '0', titleRaw = ''] = line.split('\x1f');
      const unixTime = Number.parseInt(unixRaw, 10);
      const title = titleRaw.split('\n')[0]?.trim() || 'Untitled commit';
      return {
        hash,
        shortHash,
        date: timestamp.slice(0, 10),
        timestamp,
        unixTime: Number.isNaN(unixTime) ? 0 : unixTime,
        title
      };
    })
    .filter((entry) => entry.hash && entry.shortHash && entry.timestamp);

const parseGithubRemote = (remoteUrl) => {
  const normalized = remoteUrl.replace(/\.git$/, '');
  const sshMatch = normalized.match(/^git@github\.com:([^/]+)\/(.+)$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = normalized.match(/^https:\/\/github\.com\/([^/]+)\/(.+)$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
};

const resolveGithubRepo = () => {
  const owner = process.env.VERCEL_GIT_REPO_OWNER?.trim();
  const repo = process.env.VERCEL_GIT_REPO_SLUG?.trim();
  if (owner && repo) return { owner, repo };

  const remoteUrl = run('git config --get remote.origin.url');
  if (!remoteUrl) return null;
  return parseGithubRemote(remoteUrl);
};

const getGithubEntries = async () => {
  const repo = resolveGithubRepo();
  if (!repo) return [];

  const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits?per_page=${LOG_ENTRY_LIMIT}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'education-craft-version-generator'
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return [];

    const payload = await response.json();
    if (!Array.isArray(payload)) return [];

    return payload
      .map((entry) => {
        const hash = typeof entry?.sha === 'string' ? entry.sha : '';
        const shortHash = hash ? hash.slice(0, 7) : '';
        const timestampRaw = entry?.commit?.committer?.date ?? entry?.commit?.author?.date ?? '';
        const timestamp = Number.isNaN(Date.parse(timestampRaw)) ? '' : new Date(timestampRaw).toISOString();
        const unixTime = timestamp ? Math.floor(Date.parse(timestamp) / 1000) : 0;
        const title = (entry?.commit?.message ?? '').split('\n')[0]?.trim() || 'Untitled commit';

        return {
          hash,
          shortHash,
          date: timestamp.slice(0, 10),
          timestamp,
          unixTime,
          title
        };
      })
      .filter((entry) => entry.hash && entry.shortHash && entry.timestamp);
  } catch {
    return [];
  }
};

const getFallbackLatestEntry = () => {
  const commitHash =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT_SHA?.trim() ||
    run('git rev-parse HEAD') ||
    'unknown';
  const shortHash = commitHash === 'unknown' ? 'unknown' : commitHash.slice(0, 7);
  const timestampRaw = process.env.VERCEL_GIT_COMMIT_TIMESTAMP?.trim();
  const timestamp = timestampRaw && !Number.isNaN(Date.parse(timestampRaw)) ? new Date(timestampRaw).toISOString() : new Date().toISOString();
  const unixTime = Math.floor(Date.parse(timestamp) / 1000);
  const title =
    process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0]?.trim() ||
    process.env.GIT_COMMIT_MESSAGE?.split('\n')[0]?.trim() ||
    'Build artifact generated without git history';

  return {
    hash: commitHash,
    shortHash,
    date: timestamp.slice(0, 10),
    timestamp,
    unixTime,
    title
  };
};

const packageJsonPath = path.join(repoRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const packageVersion = packageJson.version ?? '0.0.0';

const getGitEntries = () =>
  parseLogEntries(run(`git log --date=iso-strict --pretty=format:%H%x1f%h%x1f%cI%x1f%ct%x1f%s -n ${LOG_ENTRY_LIMIT}`));

let gitEntries = getGitEntries();
if (gitEntries.length < LOG_ENTRY_LIMIT && run('git rev-parse --is-shallow-repository') === 'true') {
  run(`git fetch --deepen=${LOG_ENTRY_LIMIT} origin`);
  gitEntries = getGitEntries();
}

const githubEntries = gitEntries.length >= LOG_ENTRY_LIMIT ? [] : await getGithubEntries();
const changelogEntries =
  gitEntries.length >= LOG_ENTRY_LIMIT
    ? gitEntries.slice(0, LOG_ENTRY_LIMIT)
    : githubEntries.length >= LOG_ENTRY_LIMIT
      ? githubEntries.slice(0, LOG_ENTRY_LIMIT)
      : [...gitEntries, ...githubEntries.filter((candidate) => !gitEntries.some((entry) => entry.hash === candidate.hash))].slice(0, LOG_ENTRY_LIMIT);

const fallbackLatest = getFallbackLatestEntry();
const latest = changelogEntries[0] ?? fallbackLatest;
const history = changelogEntries.slice(1, LOG_ENTRY_LIMIT);

const commitHash = latest.hash || fallbackLatest.hash;
const commitShort = latest.shortHash || fallbackLatest.shortHash;
const branch = process.env.VERCEL_GIT_COMMIT_REF?.trim() || run('git rev-parse --abbrev-ref HEAD') || 'unknown';
const describe = run('git describe --always --dirty --tags') || commitShort;

const snapshot = {
  generatedAt: new Date().toISOString(),
  packageVersion,
  commitHash,
  commitShort,
  branch,
  describe,
  label: `v${packageVersion} (${describe})`,
  latest,
  history: history.slice(0, PREVIOUS_COMMIT_COUNT)
};

const output = `// Generated by scripts/generate_version_snapshot.mjs. Do not edit manually.

export interface VersionChangelogEntry {
  hash: string;
  shortHash: string;
  date: string;
  timestamp: string;
  unixTime: number;
  title: string;
}

export interface VersionSnapshot {
  generatedAt: string;
  packageVersion: string;
  commitHash: string;
  commitShort: string;
  branch: string;
  describe: string;
  label: string;
  latest: VersionChangelogEntry | null;
  history: VersionChangelogEntry[];
}

export const VERSION_SNAPSHOT: VersionSnapshot = ${JSON.stringify(snapshot, null, 2)};
`;

const outputPath = path.join(repoRoot, 'src/lib/data/version-snapshot.ts');
writeFileSync(outputPath, output, 'utf8');
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
