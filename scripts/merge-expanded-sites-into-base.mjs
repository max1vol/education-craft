#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const targetPerBase = 32;

const paths = {
  manifest: path.join(repoRoot, 'src/lib/data/sites-manifest.json'),
  facts: path.join(repoRoot, 'src/lib/data/site-facts.json'),
  construction: path.join(repoRoot, 'src/lib/data/site-construction.json'),
  visuals: path.join(repoRoot, 'src/lib/data/site-visuals.json'),
  mediaRoot: path.join(repoRoot, 'static/site-media')
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function baseSlug(slug) {
  return slug.replace(/-expanded-\d+$/, '');
}

function sortWithinGroup(slugs, base) {
  return [...slugs].sort((a, b) => {
    if (a === base) return -1;
    if (b === base) return 1;
    const na = Number((a.match(/-expanded-(\d+)$/) || [])[1] || Number.MAX_SAFE_INTEGER);
    const nb = Number((b.match(/-expanded-(\d+)$/) || [])[1] || Number.MAX_SAFE_INTEGER);
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  });
}

const manifest = readJson(paths.manifest);
const facts = readJson(paths.facts);
const constructions = readJson(paths.construction);
const visuals = readJson(paths.visuals);

const manifestBySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
const factsBySlug = new Map(facts.map((entry) => [entry.slug, entry]));
const constructionBySlug = new Map(constructions.map((entry) => [entry.slug, entry]));
const visualBySlug = new Map(visuals.map((entry) => [entry.slug, entry]));

const groups = new Map();
for (const entry of manifest) {
  const base = baseSlug(entry.slug);
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base).push(entry.slug);
}

const bases = [...groups.keys()].sort((a, b) => a.localeCompare(b));
const droppedSlugs = new Set();

for (const base of bases) {
  const memberSlugs = sortWithinGroup(groups.get(base), base);
  if (!memberSlugs.includes(base)) {
    throw new Error(`Missing base slug in group: ${base}`);
  }

  if (memberSlugs.length !== targetPerBase) {
    throw new Error(`Expected ${targetPerBase} members for ${base}, found ${memberSlugs.length}`);
  }

  const baseDir = path.join(paths.mediaRoot, base);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Clear previous merged outputs.
  for (const name of fs.readdirSync(baseDir)) {
    if (name.startsWith('merged-')) {
      fs.rmSync(path.join(baseDir, name), { force: true });
    }
  }

  const mergedCaptions = [];

  for (let i = 0; i < memberSlugs.length; i += 1) {
    const slug = memberSlugs[i];
    const sourceDir = path.join(paths.mediaRoot, slug);
    const captionsPath = path.join(sourceDir, 'captions.json');
    if (!fs.existsSync(captionsPath)) {
      throw new Error(`Missing captions.json for ${slug}`);
    }

    const captions = readJson(captionsPath);
    const selected = captions.find((item) => item && item.file) || captions[0];
    if (!selected || !selected.file) {
      throw new Error(`No usable caption entry for ${slug}`);
    }

    const sourceImage = path.join(sourceDir, selected.file);
    if (!fs.existsSync(sourceImage)) {
      throw new Error(`Missing source image for ${slug}: ${selected.file}`);
    }

    const ext = path.extname(selected.file).toLowerCase() || '.jpg';
    const file = `merged-${String(i + 1).padStart(3, '0')}${ext}`;
    fs.copyFileSync(sourceImage, path.join(baseDir, file));

    mergedCaptions.push({
      index: i + 1,
      file,
      caption:
        selected.caption ||
        `${manifestBySlug.get(base)?.name ?? base} reconstruction reference`,
      title: selected.title || `${manifestBySlug.get(base)?.name ?? base} reconstruction reference`,
      source_url: selected.source_url ?? null,
      query: selected.query || `${manifestBySlug.get(base)?.name ?? base} reconstruction`,
      score: selected.score ?? 10,
      license: selected.license || 'Unspecified (web source)'
    });

    if (slug !== base) {
      droppedSlugs.add(slug);
    }
  }

  writeJson(path.join(baseDir, 'captions.json'), mergedCaptions);

  const baseManifest = manifestBySlug.get(base);
  if (!baseManifest) {
    throw new Error(`Missing base manifest entry: ${base}`);
  }

  baseManifest.count = mergedCaptions.length;
  baseManifest.hero = mergedCaptions[0]?.file ?? null;
}

const keepBase = (entry) => !entry.slug.match(/-expanded-\d+$/);
const nextManifest = manifest.filter(keepBase).sort((a, b) => a.slug.localeCompare(b.slug));
const nextFacts = facts.filter(keepBase).sort((a, b) => a.slug.localeCompare(b.slug));
const nextConstructions = constructions.filter(keepBase).sort((a, b) => a.slug.localeCompare(b.slug));
const nextVisuals = visuals.filter(keepBase).sort((a, b) => a.slug.localeCompare(b.slug));

writeJson(paths.manifest, nextManifest);
writeJson(paths.facts, nextFacts);
writeJson(paths.construction, nextConstructions);
writeJson(paths.visuals, nextVisuals);

// Remove expanded media directories.
let removedDirs = 0;
for (const slug of droppedSlugs) {
  const dir = path.join(paths.mediaRoot, slug);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    removedDirs += 1;
  }
}

console.log(`Base groups: ${bases.length}`);
console.log(`Collapsed to ${nextManifest.length} site entries.`);
console.log(`Removed ${removedDirs} expanded media directories.`);
console.log(`Each base gallery now has ${targetPerBase} merged entries.`);
